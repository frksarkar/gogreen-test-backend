import { Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { userZodSchema } from "./user.validation";
import { multerUpload } from "../../config/multer.config";
import { auth } from "../../middlewares/auth";

const route = Router();
route.get("/me", auth(), userController.getMe);
route.get("/search", userController.searchUser);
route.get("/all", userController.getAllUsers);
route.delete("/soft", auth(), userController.softDeleteUser);
route.patch("/restore", auth(), userController.restoreUser);
route.delete("/hard", auth(), userController.hardDeleteUser);
route.patch(
  "/edit",
  auth(),
  multerUpload.single("file"),
  validateRequest(userZodSchema.updateUserSchema),
  userController.updateUser,
);
route.get("/address", auth(), userController.getUserAddress);
route.post(
  "/address",
  auth(),
  validateRequest(userZodSchema.createUserAddressSchema),
  userController.createAddress,
);
route.patch(
  "/address/:id",
  auth(),
  validateRequest(userZodSchema.updateAddressSchema),
  userController.updateUserAddress,
);
route.delete("/address/:id", userController.deleteUserAddress);
route.get("/:id", userController.getUserById);
export const userRouter = route;
