import { GeminiService } from "./gemini.service";
import { prisma } from "../../shared/prisma";
import { calculateCost } from "./ai.utils";

// Test AI configuration
const testAIConnection = async () => {
  return await GeminiService.testConnection();
};

// Centralized logging for AI token usage and cost
const logAIUsage = async (payload: {
  userId: string;
  service: string;
  tokensUsed: number;
}) => {
  try {
    const costEstimate = calculateCost(payload.tokensUsed);
    
    await prisma.aIUsageLog.create({
      data: {
        userId: payload.userId,
        service: payload.service,
        tokensUsed: payload.tokensUsed,
        costEstimate: costEstimate,
      },
    });
  } catch (error) {
    // Fail silently to not block the main AI response
    // console.error("Failed to log AI usage:", error);
  }
};

export const AIService = {
  testAIConnection,
  logAIUsage,
};
