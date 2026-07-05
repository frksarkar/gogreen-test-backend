import { AIModelMode, RoleType } from "@prisma/client";
import { prisma } from "../../../shared/prisma";
import config from "../../../config";
import { getSystemPrompt, sanitizeOutput } from "../ai.utils";
import { GeminiService } from "../gemini.service";
import { AIService } from "../ai.service";

// Main entry point for processing chat messages
const processChat = async (
  userId: string,
  role: RoleType,
  message: string,
  mode: AIModelMode,
) => {
  const conversation = await prisma.aIConversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  const history = conversation ? (conversation.messages as any[]) : [];
  const recentHistory = history.slice(-config.ai.max_history);

  if (mode === "TEST") {
    return handleTestMode(userId, role, message);
  }

  return handleProdMode(userId, role, message, recentHistory);
};

// Handle chat in TEST mode (Mocking)
const handleTestMode = async (
  userId: string,
  role: RoleType,
  message: string,
) => {
  let responseText =
    "MOCK: I am currently in TEST MODE. I can safely simulate order statuses but cannot perform real DB actions.";

  if (
    message.toLowerCase().includes("order") ||
    message.toLowerCase().includes("status")
  ) {
    responseText =
      "MOCK: Your order #MOCK-123 is currently in 'PROCESSED' status. Expected delivery in 3 days.";
  } else if (
    message.toLowerCase().includes("return") ||
    message.toLowerCase().includes("policy")
  ) {
    responseText =
      "MOCK: Our return policy allows for returns within 7 days of delivery. Please ensure items are in original condition.";
  }

  // Log mock usage
  await AIService.logAIUsage({
    userId,
    service: "CHAT_MOCK",
    tokensUsed: 0,
  });

  return {
    response: responseText,
    mode: "TEST",
    message: "This response is from mock data.",
  };
};

// Handle chat in PROD mode (Gemini)
const handleProdMode = async (
  userId: string,
  role: RoleType,
  message: string,
  history: any[],
) => {
  let enhancedPrompt = message;

  // Domain-specific context injection
  if (message.toLowerCase().includes("order")) {
    const lastOrder = await prisma.vendorOrder.findFirst({
      where: { vendor: { userId: userId } },
      orderBy: { createdAt: "desc" },
    });

    if (lastOrder) {
      enhancedPrompt = `Context: The user's most recent order ID is ${lastOrder.id} with status. ${message}`;
    }
  }

  const systemPrompt = getSystemPrompt(role);
  const finalPrompt = `${systemPrompt}\n\nUser: ${enhancedPrompt}`;

  const { text, tokenUsage } = await GeminiService.generateResponse(
    finalPrompt,
    history,
  );
  
  const sanitizedText = sanitizeOutput(text);

  const updatedMessages = [
    ...history,
    { role: "user", content: message },
    { role: "model", content: sanitizedText },
  ];

  // Persist conversation
  const existingConv = await prisma.aIConversation.findFirst({
    where: { userId },
    select: { id: true },
  });

  await prisma.aIConversation.upsert({
    where: {
      id: existingConv?.id || "new",
    },
    update: {
      messages: updatedMessages,
      tokenUsage: { increment: tokenUsage },
      mode: "PROD",
    },
    create: {
      userId,
      role,
      messages: updatedMessages,
      tokenUsage,
      mode: "PROD",
    },
  });

  // Log usage using centralized service
  await AIService.logAIUsage({
    userId,
    service: "CHAT",
    tokensUsed: tokenUsage,
  });

  return { response: sanitizedText };
};

export const ChatService = {
  processChat,
};
