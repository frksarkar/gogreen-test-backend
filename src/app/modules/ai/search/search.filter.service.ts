import { GoogleGenAI } from "@google/genai";
import { ExtractedFilters } from "./search.types";
import { sanitizeSearchQuery } from "./search.validation";
import config from "../../../config";
import { withRetry, withTimeout } from "../../../utils/retry.util";
import { isTestMode } from "../../../utils/mode.util";
import { extractJsonFromMarkdown } from "../ai.utils";

const client = new GoogleGenAI({ apiKey: config.ai.gemini_api_key });

const FILTER_EXTRACTION_PROMPT = (query: string) => `
You are a search filter extractor for an e-commerce platform.
Extract structured search filters from the user query below.
The platform sells electronics, clothing, accessories, and general products.
Prices are in BDT (Bangladeshi Taka).

User Query: "${query}"

Return ONLY a valid JSON object with these fields (null if not found):
{
  "minPrice": <number or null>,
  "maxPrice": <number or null>,
  "category": <string or null>,
  "brand": <string or null>,
  "gender": <"male" | "female" | "unisex" or null>,
  "keywords": [<array of important product keywords, max 5>]
}

Rules:
- "under 2000 taka" → maxPrice: 2000
- "above 500" → minPrice: 500
- "for men" or "পুরুষের" → gender: "male"
- "for women" or "মহিলার" → gender: "female"
- Extract category intelligently (e.g., "headphones" → "Electronics", "jacket" → "Clothing")
- Translate Bangla terms to English for category, brand, gender fields
- keywords should be the core product search terms in English
- Return ONLY the JSON, no explanation, no markdown code block.
`;

const extractFiltersWithAI = async (
  query: string,
): Promise<ExtractedFilters> => {
  const sanitized = sanitizeSearchQuery(query);
  const prompt = FILTER_EXTRACTION_PROMPT(sanitized);

  const response = await withRetry(
    async () => {
      const result = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 256,
          temperature: 0.1, // low temperature = more deterministic JSON
        },
      });
      return result.text || "{}";
    },
    {
      maxRetries: config.ai.retry_count,
      delayMs: 300,
      onRetry: (err, attempt) => {
        // Log retry only in test mode
      },
    },
  );

  const parsed = extractJsonFromMarkdown(response);
  
  if (!parsed) {
    return extractFiltersWithRegex(query);
  }

  return {
    minPrice:
      typeof parsed.minPrice === "number" ? parsed.minPrice : undefined,
    maxPrice:
      typeof parsed.maxPrice === "number" ? parsed.maxPrice : undefined,
    category:
      typeof parsed.category === "string" ? parsed.category : undefined,
    brand: typeof parsed.brand === "string" ? parsed.brand : undefined,
    gender: ["male", "female", "unisex"].includes(parsed.gender)
      ? parsed.gender
      : undefined,
    keywords: Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k: any) => typeof k === "string").slice(0, 5)
      : [],
  };
};

// Regex-based filter extraction — fallback for TEST mode or when Gemini fails.
// Handles basic Bangla and English patterns.
const extractFiltersWithRegex = (query: string): ExtractedFilters => {
  const lower = query.toLowerCase();

  // Price patterns: "under 2000", "below 500 taka", "2000 টাকার নিচে", "above 1000"
  const maxPriceMatch = lower.match(
    /(?:under|below|within|less\s+than|max|maximum|নিচে|কমে|এর\s+নিচে)\s*(\d+)/i,
  );
  const minPriceMatch = lower.match(
    /(?:above|over|more\s+than|min|minimum|উপরে|বেশি)\s*(\d+)/i,
  );
  const rangePriceMatch = lower.match(
    /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:taka|tk|টাকা)?/i,
  );

  // Gender patterns
  const isMale = /\b(men|man|male|boys|boy|পুরুষ|ছেলে)\b/i.test(lower);
  const isFemale =
    /\b(women|woman|female|girls|girl|ladies|মহিলা|মেয়ে)\b/i.test(lower);

  // Category patterns
  const categoryMap: Record<string, string[]> = {
    Electronics: [
      "headphone",
      "earphone",
      "mouse",
      "keyboard",
      "laptop",
      "phone",
      "mobile",
      "tablet",
      "monitor",
      "speaker",
    ],
    Clothing: [
      "jacket",
      "shirt",
      "pant",
      "jeans",
      "dress",
      "coat",
      "sweater",
      "hoodie",
      "t-shirt",
    ],
    Footwear: ["shoe", "boot", "sandal", "sneaker", "slipper"],
    Accessories: ["bag", "watch", "belt", "wallet", "sunglasses"],
  };

  let detectedCategory: string | undefined;
  for (const [cat, terms] of Object.entries(categoryMap)) {
    if (terms.some((term) => lower.includes(term))) {
      detectedCategory = cat;
      break;
    }
  }

  // Keywords: remove common stop words and extract meaningful words
  const stopWords = new Set([
    "best",
    "cheap",
    "good",
    "nice",
    "top",
    "for",
    "the",
    "a",
    "an",
    "and",
    "or",
    "with",
    "under",
    "above",
    "taka",
    "tk",
  ]);
  const keywords = lower
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w) && /^[a-z]+$/.test(w))
    .slice(0, 5);

  return {
    maxPrice: maxPriceMatch
      ? parseFloat(maxPriceMatch[1])
      : rangePriceMatch
        ? parseFloat(rangePriceMatch[2])
        : undefined,
    minPrice: minPriceMatch
      ? parseFloat(minPriceMatch[1])
      : rangePriceMatch
        ? parseFloat(rangePriceMatch[1])
        : undefined,
    category: detectedCategory,
    gender: isMale ? "male" : isFemale ? "female" : undefined,
    keywords: keywords.length > 0 ? keywords : [lower.trim()],
  };
};

const extractFilters = async (
  query: string,
): Promise<{ filters: ExtractedFilters; tokensUsed: number }> => {
  const startMs = Date.now();

  try {
    const filters = await withTimeout(
      () => extractFiltersWithAI(query),
      config.ai.search_timeout,
      extractFiltersWithRegex(query),
    );

    const elapsedMs = Date.now() - startMs;

    if (isTestMode()) {
      console.log(
        `[FilterService][TEST] Extracted filters in ${elapsedMs}ms:`,
        JSON.stringify(filters),
      );
    }

    const tokensUsed = Math.ceil(
      (FILTER_EXTRACTION_PROMPT(query).length + 100) / 4,
    );

    return { filters, tokensUsed };
  } catch (err: any) {
    if (isTestMode()) {
      console.warn(
        "[FilterService] AI failed, using regex fallback:",
        err.message,
      );
    }
    return {
      filters: extractFiltersWithRegex(query),
      tokensUsed: 0,
    };
  }
};

export const FilterService = {
  extractFilters,
  extractFiltersWithRegex,
};
