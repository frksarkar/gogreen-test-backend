import { Router } from "express";
import { CategoryController } from "./category.controller";
import { categoryZodValidation } from "./category.validation";
import { validateRequest } from "../../../middlewares/validateRequest";
import { multerUpload } from "../../../config/multer.config";

const router = Router();

router.post(
  "/",
  multerUpload.single("file"),
  validateRequest(categoryZodValidation.createCategoryZodSchema),
  CategoryController.createCategory,
);
router.get("/", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getSingleCategory);
router.patch(
  "/:id",
  multerUpload.single("file"),
  validateRequest(categoryZodValidation.updateCategoryZodSchema),
  CategoryController.updateCategory,
);
router.delete("/:id", CategoryController.softDeleteCategory);
router.patch("/restore/:id", CategoryController.restoreCategory);
router.delete("/hard/:id", CategoryController.hardDeleteCategory);

export const categoryRouter = router;
