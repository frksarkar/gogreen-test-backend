import { Request, Response, NextFunction } from "express";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const rateLimitMap = new Map<string, { count: number; lastTime: number }>();

export const aiRateLimiter = (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  const userId = (req.user as any)?.id || (req.query.userId as string);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const userLimit = rateLimitMap.get(userId);

  if (!userLimit) {
    rateLimitMap.set(userId, { count: 1, lastTime: now });
    return next();
  }

  if (now - userLimit.lastTime > windowMs) {
    rateLimitMap.set(userId, { count: 1, lastTime: now });
    return next();
  }

  if (userLimit.count >= maxRequests) {
    throw new ApiError(
      httpStatus.TOO_MANY_REQUESTS,
      "Slow down! You are chatting too fast.",
    );
  }

  userLimit.count++;
  next();
};

export const abuseDetector = (
  req: Request,
  _: Response,
  next: NextFunction,
) => {
  if (!req.body) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Request body is missing.");
  }

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Valid message is required.");
  }

  if (message.length > 2000) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Message too long. Keep it under 2000 characters.",
    );
  }

  next();
};
