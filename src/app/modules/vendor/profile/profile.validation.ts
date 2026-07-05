import z from "zod";

export const createVendorZodSchema = z.object({
  shopName: z.string({ message: "Shop name is required" }),
  shopDescription: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  businessName: z.string({ message: "Business name is required" }).optional(),
  businessType: z.string().optional(),
  routingNumber: z.string().optional(),
  tradeLicense: z.string().optional(),
  nidCopy: z.string().optional(),
  shopLogo: z.string().optional(),
  shopBanner: z.string().optional(),
});

export const updateVendorZodSchema = z.object({
  shopName: z.string().optional(),
  shopDescription: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  tradeLicense: z.string().optional(),
  taxId: z.string().optional(),
  bankName: z.string().optional(),
  branchName: z.string().optional(),    
  accountHolder: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  nidCopy: z.string().optional(),
  shopLogo: z.string().optional(),
  shopBanner: z.string().optional(),
});

export const updateVendorStatusZodSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]),
});
