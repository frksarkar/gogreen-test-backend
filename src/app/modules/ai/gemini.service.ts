import { GoogleGenAI } from "@google/genai";
import config from "../../config";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const client = new GoogleGenAI({
  apiKey: config.ai.gemini_api_key,
});

const generateResponse = async (
  prompt: string,
  history: any[] = [],
  imageData?: { data: string; mimeType: string },
  retryCount = 0
): Promise<{ text: string; tokenUsage: number }> => {
  try {
    const contents: any[] = [
      ...history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    ];

    const userParts: any[] = [{ text: prompt }];
    
    if (imageData) {
      userParts.push({
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType,
        },
      });
    }

    contents.push({ role: "user", parts: userParts });

    const response = await client.models.generateContent({
      model: config.ai.gemini_model, 
      contents,
    });

    const text = response.text || "";
    const tokenUsage = Math.ceil((prompt.length + text.length) / 4);

    return { text, tokenUsage };
  } catch (error: any) {
    if (retryCount < config.ai.retry_count) {
      return generateResponse(prompt, history, imageData, retryCount + 1);
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "AI service error: " + error.message);
  }
};

const generateJSON = async <T>(
  prompt: string,
  imageData?: { data: string; mimeType: string }
): Promise<T> => {
  const jsonPrompt = `${prompt}\n\nReturn response ONLY in valid JSON format.`;
  const { text } = await generateResponse(jsonPrompt, [], imageData);
  
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || 
                     text.match(/{[\s\S]*}/);
                     
    const cleaned = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
    return JSON.parse(cleaned.trim()) as T;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to parse AI JSON response");
  }
};

const testConnection = async (): Promise<{ status: string; message: string }> => {
  try {
    const response = await client.models.generateContent({
      model: config.ai.gemini_model,
      contents: [{ role: "user", parts: [{ text: "ping" }] }],
    });
    return { 
      status: "connected", 
      message: response.text || "Connected to Gemini." 
    };
  } catch (error: any) {
    return { status: "disconnected", message: error.message };
  }
};

export const GeminiService = {
  generateResponse,
  generateJSON,
  testConnection,
};
