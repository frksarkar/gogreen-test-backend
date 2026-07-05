export interface ExtractedFilters {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  brand?: string;
  gender?: string; 
  keywords?: string[];
}

export interface ProductSearchResult {
  id: string;
  name: string;
  productSlug: string;
  description: string | null;
  shortDescription: string | null;
  category: string;
  status: string;
  rating: number | null;
  ratingCount: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  thumbnail: string | null;
  similarityScore: number;
}

export interface SearchResponse {
  query: string;
  mode: "TEST" | "PROD";
  extractedFilters: ExtractedFilters;
  results: ProductSearchResult[];
  totalCount: number;
  isFallback: boolean;
  debugInfo?: SearchDebugInfo;
}

export interface SearchDebugInfo {
  similarityScores?: number[];
  embeddingGenerated?: boolean;
  filterExtractionMs?: number;
  vectorSearchMs?: number;
  totalMs?: number;
}

export interface SearchLogInput {
  userId?: string;
  query: string;
  extractedFilters: ExtractedFilters;
  resultCount: number;
  searchMode: string;
  isFallback: boolean;
}

export interface AIUsageLogInput {
  userId?: string;
  service: "CHAT" | "SEARCH";
  tokensUsed: number;
  costEstimate: number;
}
