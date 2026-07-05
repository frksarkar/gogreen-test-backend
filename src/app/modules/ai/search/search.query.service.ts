import { ExtractedFilters, ProductSearchResult } from "./search.types";
import { EmbeddingService } from "./search.embedding.service";
import config from "../../../config";
import { prisma } from "../../../shared/prisma";
import { isTestMode } from "../../../utils/mode.util";

const RESULT_LIMIT = config.ai.search_result_limit;

export const buildProductText = (product: {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  category?: string;
}): string => {
  return [
    product.name,
    product.category,
    product.shortDescription,
    product.description,
  ]
    .filter(Boolean)
    .join(" | ")
    .slice(0, 2000);
};

const vectorSearch = async (
  queryEmbedding: number[],
  filters: ExtractedFilters,
  limit: number,
): Promise<ProductSearchResult[]> => {
  const whereConditions: string[] = [
    'p."isDeleted" = false',
    "p.\"status\" = 'IN_STOCK'",
  ];
  const queryParams: any[] = [JSON.stringify(queryEmbedding)];
  let paramIdx = 2;

  if (filters.minPrice !== undefined) {
    whereConditions.push(`EXISTS (
      SELECT 1 FROM "ProductVariant" pv
      WHERE pv."productId" = p.id AND pv."mainPrice" >= $${paramIdx} AND pv."isDeleted" = false
    )`);
    queryParams.push(filters.minPrice);
    paramIdx++;
  }

  if (filters.maxPrice !== undefined) {
    whereConditions.push(`EXISTS (
      SELECT 1 FROM "ProductVariant" pv
      WHERE pv."productId" = p.id AND pv."mainPrice" <= $${paramIdx} AND pv."isDeleted" = false
    )`);
    queryParams.push(filters.maxPrice);
    paramIdx++;
  }

  if (filters.category) {
    whereConditions.push(`pc."name" ILIKE $${paramIdx}`);
    queryParams.push(`%${filters.category}%`);
    paramIdx++;
  }

  queryParams.push(limit);
  const limitParam = paramIdx;

  const whereClause = whereConditions.join(" AND ");

  const sql = `
    WITH embedding_input AS (
      SELECT $1::float8[] AS qvec
    )
    SELECT
      p.id,
      p.name,
      p."productSlug",
      p.description,
      p."shortDescription",
      pc.name AS category,
      p."status",
      p.rating,
      p."ratingCount",
      MIN(pv."mainPrice") AS "minPrice",
      MAX(pv."mainPrice") AS "maxPrice",
      (
        SELECT pvi."imageUrl"
        FROM "ProductVariantImage" pvi
        JOIN "ProductVariant" pv2 ON pvi."variantId" = pv2.id
        WHERE pv2."productId" = p.id
        ORDER BY pvi."sortOrder" ASC NULLS LAST
        LIMIT 1
      ) AS thumbnail,
      CASE
        WHEN p.embedding IS NOT NULL AND array_length(p.embedding, 1) > 0 THEN (
          SELECT
            (
              SELECT SUM(e1 * e2)
              FROM unnest(p.embedding, (SELECT qvec FROM embedding_input)) AS t(e1, e2)
            ) /
            NULLIF(
              sqrt(SELECT SUM(e1*e1) FROM unnest(p.embedding) AS t(e1)) *
              sqrt((SELECT SUM(e2*e2) FROM unnest((SELECT qvec FROM embedding_input)) AS t(e2))),
              0
            )
        )
        ELSE 0
      END AS "similarityScore"
    FROM "Product" p
    JOIN "ProductCategory" pc ON pc.id = p."categoryId"
    LEFT JOIN "ProductVariant" pv ON pv."productId" = p.id AND pv."isDeleted" = false
    WHERE ${whereClause}
    GROUP BY p.id, p.name, p."productSlug", p.description, p."shortDescription", pc.name, p.status, p.rating, p."ratingCount", p.embedding
    ORDER BY "similarityScore" DESC NULLS LAST
    LIMIT $${limitParam}
  `;

  try {
    const results = await prisma.$queryRawUnsafe<any[]>(sql, ...queryParams);
    return results.map((r) => ({
      id: r.id,
      name: r.name,
      productSlug: r.productSlug,
      description: r.description,
      shortDescription: r.shortDescription,
      category: r.category,
      status: r.status,
      rating: r.rating ? parseFloat(r.rating) : null,
      ratingCount: r.ratingCount ? parseInt(r.ratingCount) : null,
      minPrice: r.minPrice ? parseFloat(r.minPrice) : null,
      maxPrice: r.maxPrice ? parseFloat(r.maxPrice) : null,
      thumbnail: r.thumbnail || null,
      similarityScore: r.similarityScore ? parseFloat(r.similarityScore) : 0,
    }));
  } catch (err: any) {
    console.error("[QueryService] Vector search SQL error:", err.message);
    throw err;
  }
};

const keywordSearch = async (
  query: string,
  filters: ExtractedFilters,
  limit: number,
  queryEmbedding?: number[],
): Promise<ProductSearchResult[]> => {
  // Build keyword array from query + extracted keywords
  const searchKeywords = [query, ...(filters.keywords || [])].filter(Boolean);

  // Build OR conditions for text matching
  const nameConditions = searchKeywords.map((kw) => ({
    name: { contains: kw, mode: "insensitive" as const },
  }));
  const descConditions = searchKeywords.map((kw) => ({
    description: { contains: kw, mode: "insensitive" as const },
  }));

  const products = await prisma.product.findMany({
    where: {
      isDeleted: false,
      status: "IN_STOCK",
      OR: [...nameConditions, ...descConditions],
      ...(filters.category
        ? {
            category: {
              name: { contains: filters.category, mode: "insensitive" },
            },
          }
        : {}),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? {
            variants: {
              some: {
                isDeleted: false,
                ...(filters.minPrice !== undefined
                  ? { mainPrice: { gte: filters.minPrice } }
                  : {}),
                ...(filters.maxPrice !== undefined
                  ? { mainPrice: { lte: filters.maxPrice } }
                  : {}),
              },
            },
          }
        : {}),
    },
    include: {
      category: { select: { name: true } },
      variants: {
        where: { isDeleted: false },
        select: {
          mainPrice: true,
          images: { select: { imageUrl: true }, take: 1 },
        },
        orderBy: { mainPrice: "asc" },
        take: 1,
      },
    },
    take: limit,
    orderBy: [{ rating: "desc" }, { viewCount: "desc" }],
  });

  // Compute JS-side similarity if query embedding is available
  const results: ProductSearchResult[] = products.map((p) => {
    let similarityScore = 0;

    if (queryEmbedding && p.embedding && p.embedding.length > 0) {
      similarityScore = EmbeddingService.cosineSimilarity(
        queryEmbedding,
        p.embedding,
      );
      if (isTestMode()) {
        console.log(
          `[QueryService][TEST] Similarity for "${p.name}": ${similarityScore.toFixed(4)}`,
        );
      }
    }

    const minVariant = p.variants[0];
    return {
      id: p.id,
      name: p.name,
      productSlug: p.productSlug,
      description: p.description,
      shortDescription: p.shortDescription,
      category: p.category.name,
      status: p.status,
      rating: p.rating,
      ratingCount: p.ratingCount,
      minPrice: minVariant?.mainPrice ?? null,
      maxPrice: minVariant?.mainPrice ?? null,
      thumbnail: minVariant?.images?.[0]?.imageUrl ?? null,
      similarityScore,
    };
  });

  // Sort by similarity score if we have embeddings, otherwise keep original order
  if (queryEmbedding) {
    results.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  return results;
};

// Perform search: chooses PROD (vector) or TEST (keyword) strategy.
const search = async (
  query: string,
  filters: ExtractedFilters,
  limit: number = RESULT_LIMIT,
): Promise<{ results: ProductSearchResult[]; isFallback: boolean }> => {
  const productCount = await prisma.product.count({
    where: { isDeleted: false, status: "IN_STOCK" },
  });

  if (isTestMode()) {
    console.log(`[QueryService][TEST] Products in DB: ${productCount}`);
  }

  if (!isTestMode()) {
    // PROD: try vector search
    try {
      const { embedding: queryEmbedding } =
        await EmbeddingService.generateQueryEmbedding(query);
      const results = await vectorSearch(queryEmbedding, filters, limit);
      return { results, isFallback: false };
    } catch (err: any) {
      console.error(
        "[QueryService] Vector search failed, falling back to keyword:",
        err.message,
      );
      // Fall through to keyword search
    }
  }

  // TEST mode or PROD fallback: keyword + optional JS cosine similarity
  let queryEmbedding: number[] | undefined;
  try {
    const { embedding } = await EmbeddingService.generateQueryEmbedding(query);
    queryEmbedding = embedding;
  } catch {
    // Fine, proceed without embedding
  }

  // Use mock results if DB is empty (for TEST mode demo)
  if (productCount === 0 && isTestMode()) {
    if (isTestMode()) {
      console.log("[QueryService][TEST] DB is empty, returning mock results");
    }
    return { results: getMockResults(query, filters), isFallback: true };
  }

  const results = await keywordSearch(query, filters, limit, queryEmbedding);
  const isFallback = results.length === 0 || !queryEmbedding;

  return { results, isFallback };
};

// Generate mock search results for TEST mode when DB has no products.
const getMockResults = (
  query: string,
  filters: ExtractedFilters,
): ProductSearchResult[] => {
  const mockPrice = filters.maxPrice
    ? Math.round(filters.maxPrice * 0.8)
    : 1500;

  return [
    {
      id: "mock-001",
      name: `${filters.keywords?.[0] || query} - Premium Model`,
      productSlug: "mock-premium-model",
      description: "High quality product matching your search criteria",
      shortDescription: "Best in class",
      category: filters.category || "General",
      status: "IN_STOCK",
      rating: 4.5,
      ratingCount: 128,
      minPrice: mockPrice,
      maxPrice: mockPrice,
      thumbnail: null,
      similarityScore: 0.92,
    },
    {
      id: "mock-002",
      name: `${filters.keywords?.[0] || query} - Standard Edition`,
      productSlug: "mock-standard-edition",
      description: "Good value for money product",
      shortDescription: "Great daily use option",
      category: filters.category || "General",
      status: "IN_STOCK",
      rating: 3.9,
      ratingCount: 64,
      minPrice: Math.round(mockPrice * 0.7),
      maxPrice: Math.round(mockPrice * 0.7),
      thumbnail: null,
      similarityScore: 0.78,
    },
  ];
};

export const QueryService = {
  search,
  buildProductText,
  keywordSearch,
  vectorSearch,
};
