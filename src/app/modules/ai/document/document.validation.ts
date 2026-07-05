import { z } from "zod";

export const documentExtractionSchema = z.object({
  target: z.enum(["user", "vendor", "address", "all"]).default("all").optional(),
});

export type DocumentExtractionInput = z.infer<typeof documentExtractionSchema>;
