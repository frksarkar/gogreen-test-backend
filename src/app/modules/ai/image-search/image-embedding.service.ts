import config from "../../../config";
import { isTestMode } from "../../../utils/mode.util";
import { EmbeddingService } from "../search/search.embedding.service";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";

import { GeminiService } from "../gemini.service";

export class ImageEmbeddingService {
  // Generates a 768-dimensional embedding from an image
  static async generateImageEmbedding(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<number[]> {
    try {
      const visualDescription = await this.analyzeImage(imageBuffer, mimeType);

      if (isTestMode()) {
        console.log("[ImageEmbeddingService] Visual Analysis:", visualDescription.slice(0, 100) + "...");
      }

      const embedding = await EmbeddingService.generateEmbedding(visualDescription);

      return embedding;
    } catch (error: any) {
      if (isTestMode()) {
        console.warn("[ImageEmbeddingService] Failed, using mock embedding:", error.message);
        return EmbeddingService.generateMockEmbedding();
      }
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to generate image embedding: " + error.message,
      );
    }
  }

  // Uses Gemini Vision to extract descriptive metadata from an image
  private static async analyzeImage(
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    const prompt = `
      Analyze this product image in detail. 
      Describe:
      1. The type of product (e.g., shoe, shirt, watch).
      2. Dominant colors and patterns.
      3. Materials and textures (e.g., leather, fabric, metallic).
      4. Unique visual features (e.g., logo style, shape, specialized parts).
      5. The style/vibe (e.g., sporty, elegant, casual).
      
      Return a concise but highly descriptive paragraph that captures the visual essence of this product for similarity matching.
      Avoid fluff, stick to visual facts.
    `;

    const { text } = await GeminiService.generateResponse(
      prompt,
      [],
      { data: buffer.toString("base64"), mimeType }
    );

    if (!text) throw new Error("Empty response from Gemini Vision");
    return text;
  }
}
