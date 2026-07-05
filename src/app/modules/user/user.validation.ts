import { AddressType, Gender } from "@prisma/client";
import z from "zod";

const addressSchema = z.object({
  label: z.enum(AddressType).optional(),
  division: z.string().min(2).max(50),
  district: z.string().min(2).max(50),
  area: z.string().min(2).max(100).optional(),
  street_address: z.string().min(2).max(100),
  landmark: z.string().min(2).max(50).optional(),
  zipcode: z.string().min(4).max(4).optional(),
  isDefault: z.boolean().optional(),
  contactName: z.string().min(2).max(50).optional(),
  contactPhone: z.string().regex(/^(?:\+8801|8801|01)[3-9]\d{8}$/, {
    message: "Invalid number format",
  }),
});
const createUserAddressSchema = addressSchema;
const updateAddressSchema = addressSchema.partial();

const deleteAddressSchema = z.array(z.uuid());
const updateUserSchema = z.object({
  profile: z
    .object({
      name: z.string().min(2).max(50).optional(),
      phone: z.string().min(10).max(15).optional(),
      password: z.string().min(8).max(36).optional(),
      profile_photo: z.url().optional(),
      gender: z.enum(Gender).optional(),
      birthday: z.coerce.date().optional(),
      isVerified: z.boolean().optional(),
    })
    .optional(),
  address: z
    .object({
      create: z.array(createUserAddressSchema).optional(),
      update: z.array(updateAddressSchema).optional(),
      delete: deleteAddressSchema.optional(),
    })
    .optional(),
});

export const userZodSchema = {
  updateUserSchema,
  createUserAddressSchema,
  updateAddressSchema,
};
