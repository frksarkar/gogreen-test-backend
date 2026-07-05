import { z } from "zod";

const uploadDocumentZodSchema = z.object({
  documentType: z.string({ message: "Document type is required" }),
  fileUrl: z.string().optional(),
});

const updateDocumentStatusZodSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING"] as [string, ...string[]]),
});

const updateDocumentZodSchema = z.object({
  documentType: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const ComplianceValidation = {
  uploadDocumentZodSchema,
  updateDocumentStatusZodSchema,
  updateDocumentZodSchema,
};
