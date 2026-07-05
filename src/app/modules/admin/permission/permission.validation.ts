import z from "zod";

const createPermissionZodSchema = z.object({
  key: z.string(),
  description: z.string().optional(),
});
const createPermissionCategoryZodSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});
const addPermissionsToCategoryZodSchema = z.object({
  categoryId: z.string(),
  permissions: z.array(z.string()),
});
const softDeletePermissions = z.object({
  ids: z.array(z.string()),
});
const softDeletePermissionCategories = z.object({
  ids: z.array(z.string()),
});
const restorePermissions = z.object({
  ids: z.array(z.string()),
});
const restorePermissionCategories = z.object({
  ids: z.array(z.string()),
});
const hardDeletePermissions = z.object({
  ids: z.array(z.string()),
});
const hardDeletePermissionCategories = z.object({
  ids: z.array(z.string()),
});
const updatePermission = createPermissionZodSchema
  .partial()
  .extend({
    type: z.literal("permission"),
    slug: z.string().optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== "type"), {
    message: "At least 1 field must be provided to edit permissions",
  });
const updatePermissionCategory = createPermissionCategoryZodSchema
  .partial()
  .extend({
    type: z.literal("category"),
    slug: z.string().optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== "type"), {
    message: "At least 1 field must be provided to edit permission categories",
  });
const updatePermissionZodSchema = z.discriminatedUnion("type", [
  updatePermission,
  updatePermissionCategory,
]);
export const PermissionZodSchema = {
  createPermissionZodSchema,
  createPermissionCategoryZodSchema,
  addPermissionsToCategoryZodSchema,
  softDeletePermissions,
  softDeletePermissionCategories,
  restorePermissions,
  restorePermissionCategories,
  updatePermissionZodSchema,
  hardDeletePermissions,
  hardDeletePermissionCategories,
};
