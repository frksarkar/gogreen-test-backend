import { z } from "zod";

const INJECTION_PATTERNS = [
  /ignore\s+previous\s+instructions/i,
  /forget\s+your\s+instructions/i,
  /system\s*:/i,
  /you\s+are\s+now/i,
  /act\s+as\s+(a\s+)?(?!helpful)/i,
  /<script[\s\S]*?>/i,
  /javascript\s*:/i,
  /DROP\s+TABLE/i,
  /SELECT\s+\*\s+FROM/i,
  /DELETE\s+FROM/i,
];

export const searchQuerySchema = z.object({
  query: z
    .string({ message: "Search query is required" })
    .min(2, "Search query must be at least 2 characters")
    .max(500, "Search query must be at most 500 characters")
    .trim()
    .refine((val) => !INJECTION_PATTERNS.some((pattern) => pattern.test(val)), {
      message:
        "Invalid search query. Please use a natural language product search.",
    }),

  limit: z.number().int().min(1).max(50).default(20).optional(),

  page: z.number().int().min(1).default(1).optional(),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .replace(/<[^>]*>/g, "")
    .replace(/[{}[\]]/g, "")
    .replace(/\bSELECT\b|\bDROP\b|\bDELETE\b|\bINSERT\b/gi, "")
    .trim()
    .slice(0, 500);
};
