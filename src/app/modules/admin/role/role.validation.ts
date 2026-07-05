import { RoleType } from "@prisma/client";
import z from "zod";

const createRoleZodSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  systemLevel: z.enum(RoleType),
  isActive: z.boolean().optional(),
});

const assignRoleZodSchema = z.object({
  email: z.email(),
  roleId: z.string(),
  assignedBy: z.string(),
});
const restoreRoleZodSchema = z.object({
  ids: z.array(z.string()),
});
const createNewRoleInheritanceZodSchema = z.object({
  childRoleId: z.string(),
  parentRoleId: z.string(),
});
const createRoleCategoryZodSchema = z.object({
  categoryId: z.string(),
  roleId: z.string(),
});
const editRoleByIdZodSchema = createRoleZodSchema.partial();
export const roleZodSchema = {
  createRoleZodSchema,
  assignRoleZodSchema,
  restoreRoleZodSchema,
  createNewRoleInheritanceZodSchema,
  createRoleCategoryZodSchema,
  editRoleByIdZodSchema,
};
