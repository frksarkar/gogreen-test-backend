import { Router } from "express";
import { PermissionsController } from "./permission.controller";
import { validateRequest } from "../../../middlewares/validateRequest";
import { PermissionZodSchema } from "./permission.validation";

const route = Router();

// ─── Permissions ────────────────────────────────────────────

route.get("/", PermissionsController.getPermissions);
route.post(
  "/",
  validateRequest(PermissionZodSchema.createPermissionZodSchema),
  PermissionsController.createPermission,
);

// Soft delete — PATCH is more appropriate than DELETE for soft deletes
route.delete(
  "/soft-delete",
  validateRequest(PermissionZodSchema.softDeletePermissions),
  PermissionsController.softDeletePermissions,
);
route.patch(
  "/restore",
  validateRequest(PermissionZodSchema.restorePermissions),
  PermissionsController.restorePermissions,
);

// Hard delete
route.delete(
  "/hard-delete",
  validateRequest(PermissionZodSchema.hardDeletePermissions),
  PermissionsController.hardDeletePermissions,
);

// ─── Permission Categories ───────────────────────────────────

route.post(
  "/category",
  validateRequest(PermissionZodSchema.createPermissionCategoryZodSchema),
  PermissionsController.createPermissionCategory,
);

// ─── Category ↔ Permission Relations ────────────────────────

route.post(
  "/add-permission-category",
  validateRequest(PermissionZodSchema.addPermissionsToCategoryZodSchema),
  PermissionsController.addPermissionsToCategory,
);
route.delete(
  "/remove-permission-from-category",
  PermissionsController.removePermissionsFromCategory,
);

route.patch(
  "/:id",
  validateRequest(PermissionZodSchema.updatePermissionZodSchema),
  PermissionsController.updatePermission,
);

// view a single permission
route.get("/:id", PermissionsController.getPermissionById);
export const PermissionsRouter = route;
