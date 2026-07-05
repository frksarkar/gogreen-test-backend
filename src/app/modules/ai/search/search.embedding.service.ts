import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import config from "../../../config";
import { redisClient } from "../../../config/redis.config";
import { isTestMode } from "../../../utils/mode.util";
import { withRetry } from "../../../utils/retry.util";

const client = new GoogleGenAI({ apiKey: config.ai.gemini_api_key });

// In-memory embedding cache for TEST mode (no Redis needed)
const memoryCache = new Map<string, { embedding: number[]; expiry: number }>();

// Generate SHA-256 hash for cache key
const hashText = (text: string): string => {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 32);
};

// Get embedding from in-memory cache
const getFromMemoryCache = (key: string): number[] | null => {
  const cached = memoryCache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.embedding;
  }
  memoryCache.delete(key);
  return null;
};

// Store embedding in in-memory cache
const setToMemoryCache = (
  key: string,
  embedding: number[],
  ttlSeconds: number,
): void => {
  memoryCache.set(key, {
    embedding,
    expiry: Date.now() + ttlSeconds * 1000,
  });
};

const redisAvailable = (): boolean => {
  return !!(config.redis.host && config.redis.port && redisClient);
};

// Get cached embedding (Redis first, then memory)
const getCachedEmbedding = async (
  cacheKey: string,
): Promise<number[] | null> => {
  // Try Redis first (PROD mode)
  if (!isTestMode() && redisAvailable()) {
    try {
      const cached = await redisClient.get(`embedding:${cacheKey}`);
      if (cached) {
        if (isTestMode())
          console.log("[EmbeddingCache] Redis hit:", cacheKey);
        return JSON.parse(cached) as number[];
      }
    } catch (err: any) {
      console.warn("[EmbeddingCache] Redis read failed:", err.message);
    }
  }

  // Fallback to memory cache
  return getFromMemoryCache(cacheKey);
};

// Store embedding in cache (Redis + memory)
const setCachedEmbedding = async (
  cacheKey: string,
  embedding: number[],
  ttlSeconds: number,
): Promise<void> => {
  // Store in memory cache always
  setToMemoryCache(cacheKey, embedding, ttlSeconds);

  // Store in Redis for PROD mode
  if (!isTestMode() && redisAvailable()) {
    try {
      await redisClient.setex(
        `embedding:${cacheKey}`,
        ttlSeconds,
        JSON.stringify(embedding),
      );
    } catch (err: any) {
      console.warn("[EmbeddingCache] Redis write failed:", err.message);
    }
  }
};

// Generate a text embedding using Google's text-embedding-004 model.
// Returns a 768-dimensional numeric vector.
const generateEmbedding = async (text: string): Promise<number[]> => {
  const cacheKey = hashText(text);
  const ttl = config.ai.embedding_cache_ttl;

  // Check cache
  const cached = await getCachedEmbedding(cacheKey);
  if (cached) {
    return cached;
  }

  if (isTestMode()) {
    console.log(
      `[EmbeddingService][TEST] Generating embedding for: "${text.slice(0, 80)}..."`,
    );
  }

  // Generate via Google AI API (with retry)
  const embedding = await withRetry(
    async () => {
      const response = await client.models.embedContent({
        model: "gemini-embedding-001",
        contents: [{ parts: [{ text }] }],
      });

      const values = response.embeddings?.[0]?.values;
      if (!values || values.length === 0) {
        throw new Error("Empty embedding response from Google AI");
      }
      return values;
    },
    {
      maxRetries: config.ai.retry_count,
      delayMs: 500,
      onRetry: (err, attempt) => {
        console.warn(
          `[EmbeddingService] Retry attempt ${attempt}: ${err.message}`,
        );
      },
    },
  );

  // Cache the result
  await setCachedEmbedding(cacheKey, embedding, ttl);

  return embedding;
};

// Calculate cosine similarity between two vectors.
// Returns a score between -1 and 1 (1 = identical, 0 = unrelated).
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
};

// Generate a mock embedding for TEST mode (random 768-dim vector).
// Saves API quota during development.
const generateMockEmbedding = (): number[] => {
  return Array.from({ length: 768 }, () => (Math.random() - 0.5) * 2);
};

// Generate embedding — uses real API in PROD, mock in TEST.
const generateQueryEmbedding = async (
  text: string,
): Promise<{ embedding: number[]; isMock: boolean }> => {
  if (isTestMode()) {
    // Still try real embedding in TEST but fall back to mock
    try {
      const embedding = await generateEmbedding(text);
      return { embedding, isMock: false };
    } catch (err: any) {
      console.log(
        "[EmbeddingService][TEST] Using mock embedding due to:",
        err.message,
      );
      return { embedding: generateMockEmbedding(), isMock: true };
    }
  }

  const embedding = await generateEmbedding(text);
  return { embedding, isMock: false };
};

export const EmbeddingService = {
  generateEmbedding,
  generateQueryEmbedding,
  generateMockEmbedding,
  cosineSimilarity,
};
