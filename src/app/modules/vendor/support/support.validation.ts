import { z } from "zod";

const createTicketZodSchema = z.object({
  subject: z.string().min(5),
  description: z.string().min(10),
  category: z.enum(["ORDER", "PAYMENT", "SHIPPING", "PRODUCT", "OTHER"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
});

const updateTicketZodSchema = z.object({
  subject: z.string().min(5).optional(),
  description: z.string().min(10).optional(),
  category: z.enum(["ORDER", "PAYMENT", "SHIPPING", "PRODUCT", "OTHER"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
});

export const SupportValidation = {
  createTicketZodSchema,
  updateTicketZodSchema,
};
