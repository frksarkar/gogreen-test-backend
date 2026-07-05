import { Router } from "express";
import { RoleController } from "./role.controller";
import { validateRequest } from "../../../middlewares/validateRequest";
import { roleZodSchema } from "./role.validation";

const route = Router();
// role
route.post(
  "/",
  validateRequest(roleZodSchema.createRoleZodSchema),
  RoleController.createNewRole,
);
route.get("/", RoleController.getAllRoles);
route.post(
  "/assign",
  validateRequest(roleZodSchema.assignRoleZodSchema),
  RoleController.assignRole,
);
route.patch(
  "/restore",
  validateRequest(roleZodSchema.restoreRoleZodSchema),
  RoleController.restoreRole,
);
route.get("/:id", RoleController.getRoleById);
route.patch(
  "/:id",
  validateRequest(roleZodSchema.editRoleByIdZodSchema),
  RoleController.editRoleById,
);
route.delete("/soft/:id", RoleController.softDeleteRole);
route.delete("/hard/:id", RoleController.hardDeleteRole);

// role category
route.post("/category", RoleController.createRoleCategory);
route.delete("/category/:id", RoleController.deleteRoleCategory);

/// role inheritance
route.post(
  "/inheritance",
  validateRequest(roleZodSchema.createNewRoleInheritanceZodSchema),
  RoleController.createNewRoleInheritance,
);
export const RoleRouter = route;
