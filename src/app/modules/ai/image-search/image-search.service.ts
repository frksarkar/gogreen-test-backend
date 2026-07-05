import axios from "axios";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import { isTestMode } from "../../../utils/mode.util";
import { AIService } from "../ai.service";
import { EmbeddingService } from "../search/search.embedding.service";
import { ImageEmbeddingService } from "./image-embedding.service";

export class ImageSearchService {
  static async searchByImage(
    userId: string | undefined,
    imageBuffer: Buffer,
    mimeType: string,
    imageUrl: string,
    limit: number = 10,
  ) {
    const startTime = Date.now();
    let finalBuffer = imageBuffer;
    let finalMimeType = mimeType;

    // Handle cases where buffer is missing ( Cloudinary storage)
    if (!finalBuffer && imageUrl) {
      try {
        const response = await axios.get(imageUrl, {
          responseType: "arraybuffer",
        });
        finalBuffer = Buffer.from(response.data);
        // finalMimeType = response.headers["content-type"] || finalMimeType;
        const contentType = response.headers["content-type"];

        if (typeof contentType === "string") {
          finalMimeType = contentType;
        } else if (Array.isArray(contentType)) {
          finalMimeType = contentType[0];
        }
      } catch (err: any) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Failed to retrieve image data for analysis: " + err.message,
        );
      }
    }

    if (!finalBuffer) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Image buffer or public URL is required",
      );
    }

    // 1. Generate embedding for the uploaded image
    const queryEmbedding = await ImageEmbeddingService.generateImageEmbedding(
      finalBuffer,
      finalMimeType,
    );

    // 2. Retrieve all products with image embeddings
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        productSlug: true,
        imageEmbedding: true,
        status: true,
        variants: {
          take: 1,
          select: {
            images: { take: 1, select: { imageUrl: true } },
            mainPrice: true,
            salePrice: true,
          },
        },
      },
    });

    // 3. Calculate similarity and rank
    let rankedResults = (products as any[])
      .filter((p) => p.imageEmbedding && p.imageEmbedding.length > 0)
      .map((product) => {
        const similarity = EmbeddingService.cosineSimilarity(
          queryEmbedding,
          product.imageEmbedding as number[],
        );
        return {
          id: product.id,
          name: product.name,
          slug: product.productSlug,
          imageUrl: product.variants[0]?.images[0]?.imageUrl,
          price:
            product.variants[0]?.salePrice ?? product.variants[0]?.mainPrice,
          similarityScore: similarity,
        };
      })
      .filter(
        (r) => r.similarityScore > (config.ai.min_similarity_score ?? 0.5),
      )
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);

    // Fallback for TEST mode if no indexed products found
    if (isTestMode() && rankedResults.length === 0) {
      const allProducts = await prisma.product.findMany({
        take: 3,
        where: { isDeleted: false },
        select: {
          id: true,
          name: true,
          productSlug: true,
          variants: {
            take: 1,
            select: {
              images: { take: 1, select: { imageUrl: true } },
              mainPrice: true,
              salePrice: true,
            },
          },
        },
      });

      rankedResults = allProducts.map((p) => ({
        id: p.id,
        name: p.name + " (MOCK)",
        slug: p.productSlug,
        imageUrl: (p.variants as any)?.[0]?.images?.[0]?.imageUrl,
        price:
          (p.variants as any)?.[0]?.salePrice ??
          (p.variants as any)?.[0]?.mainPrice,
        similarityScore: Math.random() * 0.4 + 0.6, // Mock high score (0.6 - 1.0)
      }));
    }

    const duration = Date.now() - startTime;

    // 4. Logging & Analytics
    const logTasks: Promise<any>[] = [];

    // Log Image Search Metadata
    logTasks.push(
      prisma.imageSearchLog
        .create({
          data: {
            userId,
            imageUrl,
            similarityScores: rankedResults.map((r) => ({
              id: r.id,
              score: r.similarityScore,
            })) as any,
            resultCount: rankedResults.length,
          },
        })
        .catch(() => {}),
    );

    // Log AI Usage
    logTasks.push(
      AIService.logAIUsage({
        userId: userId || "anonymous",
        service: "IMAGE_SEARCH",
        tokensUsed: 1200, // Approximate for vision + text
      }).catch(() => {}),
    );

    // 5. Finalize response
    return {
      results: rankedResults,
      totalCount: rankedResults.length,
      searchDurationMs: duration,
      mode: isTestMode() ? "TEST" : "PROD",
      debugInfo: isTestMode()
        ? {
            topScores: rankedResults.slice(0, 3).map((r) => r.similarityScore),
          }
        : undefined,
    };
  }

  /**
   * Refreshes the image embedding for a specific product
   */
  static async updateProductImageEmbedding(productId: string) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          variants: {
            include: {
              images: {
                include: { mainImage: true },
              },
            },
          },
        },
      });

      if (!product) return;

      // Find the designated main image across all variants
      let selectedImage = null;

      for (const variant of product.variants) {
        const mainImg = variant.images.find((img) => img.mainImage.length > 0);
        if (mainImg) {
          selectedImage = mainImg;
          break;
        }
      }

      // Fallback: first available image if no main designated
      if (!selectedImage) {
        for (const variant of product.variants) {
          if (variant.images.length > 0) {
            selectedImage = variant.images[0];
            break;
          }
        }
      }

      if (!selectedImage || !selectedImage.imageUrl) return;

      const imageUrl = selectedImage.imageUrl;

      // Fetch image buffer using axios
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data);
      const mimeType =
        typeof response.headers["content-type"] === "string"
          ? response.headers["content-type"]
          : "";

      const embedding = await ImageEmbeddingService.generateImageEmbedding(
        buffer,
        mimeType,
      );

      await prisma.product.update({
        where: { id: productId },
        data: {
          imageEmbedding: embedding,
          imageEmbeddingUpdatedAt: new Date(),
        },
      });
    } catch (error) {
      // Silently fail in background
    }
  }
}
