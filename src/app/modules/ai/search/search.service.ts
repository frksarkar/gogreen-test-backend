import { SearchResponse } from "./search.types";
import { FilterService } from "./search.filter.service";
import { QueryService as QS } from "./search.query.service";
import { EmbeddingService } from "./search.embedding.service";
import { getSearchMode, isTestMode } from "../../../utils/mode.util";
import config from "../../../config";
import { prisma } from "../../../shared/prisma";
import { AIService } from "../ai.service";

// Perform AI-powered search
const search = async (
  query: string,
  userId?: string,
  limit?: number,
): Promise<SearchResponse> => {
  const startMs = Date.now();
  const mode = getSearchMode();

  let filters = {};
  let filterTokens = 0;
  
  try {
    const { filters: extractedFilters, tokensUsed } =
      await FilterService.extractFilters(query);
    filters = extractedFilters;
    filterTokens = tokensUsed;
  } catch (err: any) {
    filters = FilterService.extractFiltersWithRegex(query);
  }

  const searchStart = Date.now();
  let results: any[] = [];
  let isFallback = false;

  try {
    const searchResult = await QS.search(
      query,
      filters,
      limit || config.ai.search_result_limit,
    );
    results = searchResult.results;
    isFallback = searchResult.isFallback;
  } catch (err: any) {
    results = [];
    isFallback = true;
  }

  const totalMs = Date.now() - startMs;

  // Unified logging
  const logTasks: Promise<any>[] = [];
  
  // 1. Log search metadata
  logTasks.push(prisma.searchLog.create({
    data: {
      userId: userId ?? undefined,
      query: query.slice(0, 500),
      extractedFilters: filters as any,
      resultCount: results.length,
      searchMode: mode,
      isFallback,
    }
  }).catch(() => {}));

  // 2. Log AI usage (tokens/cost)
  if (filterTokens > 0) {
    logTasks.push(AIService.logAIUsage({
      userId: userId || "anonymous",
      service: "SEARCH",
      tokensUsed: filterTokens,
    }).catch(() => {}));
  }

  const response: any = {
    query,
    mode,
    extractedFilters: filters,
    results,
    totalCount: results.length,
    isFallback,
  };

  if (isTestMode()) {
    response.debugInfo = {
      similarityScores: results.map((r: any) =>
        parseFloat(r.similarityScore?.toFixed(4) || "0"),
      ),
      embeddingGenerated: !isFallback,
      filterExtractionMs: Date.now() - startMs,
      vectorSearchMs: Date.now() - searchStart,
      totalMs,
    };
  }

  return response;
};

// Generate and store embedding for a product
const generateAndStoreProductEmbedding = async (
  productId: string,
): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: { select: { name: true } } },
    });

    if (!product) return;

    const text = QS.buildProductText({
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      category: product.category.name,
    });

    const embedding = await EmbeddingService.generateEmbedding(text);

    await prisma.product.update({
      where: { id: productId },
      data: {
        embedding,
        embeddingUpdatedAt: new Date(),
      },
    });
  } catch (err: any) {
    // console.error(`Failed to generate embedding for product ${productId}:`, err.message);
  }
};

// Get paginated search logs
const getSearchLogs = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.searchLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.searchLog.count(),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const SearchService = {
  search,
  generateAndStoreProductEmbedding,
  getSearchLogs,
};
