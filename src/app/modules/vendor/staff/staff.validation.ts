import { z } from "zod";

const addVendorStaffZodSchema = z.object({
  storeId: z.string({ message: "StoreId is required" }),
  email: z.string().email({ message: "Invalid staff email" }),
  role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
});

const updateVendorStaffZodSchema = addVendorStaffZodSchema.partial().omit({ storeId: true });

export const StaffValidation = {
  addVendorStaffZodSchema,
  updateVendorStaffZodSchema,
};
