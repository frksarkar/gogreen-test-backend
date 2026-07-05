import { Router } from "express";
import { validateRequest } from "../../../middlewares/validateRequest";
import { staticContentZodSchema } from "./staticContent.validation";
import { StaticContentController } from "./staticContent.controller";
import { multerUpload } from "../../../config/multer.config";

const route = Router();
route.get("/", StaticContentController.getStaticPage);
route.post(
  "/",
  validateRequest(staticContentZodSchema.createStaticContentZodSchema),
  StaticContentController.createStaticContent,
);
route.post(
  "/section",
  validateRequest(staticContentZodSchema.createStaticContentSectionZodSchema),
  StaticContentController.createStaticContentSection,
);
route.get("/section", StaticContentController.getStaticContentSection);
route.delete(
  "/section/:id",
  StaticContentController.deleteStaticContentSection,
);
route.patch(
  "/",
  validateRequest(staticContentZodSchema.editStaticContentZodSchema),
  StaticContentController.editStaticContent,
);
route.patch(
  "/section/:id",
  validateRequest(staticContentZodSchema.editStaticContentSectionZodSchema),
  StaticContentController.editStaticContentSection,
);
route.post(
  "/blog",
  multerUpload.single("file"),
  StaticContentController.createNewBlog,
);
route.get("/blog", StaticContentController.getAllBlogs);
route.get("/blog/:id", StaticContentController.getBlogById);
route.post(
  "/banner",
  multerUpload.array("files"),
  StaticContentController.createNewBanner,
);
route.patch(
  "/blog/:id",
  multerUpload.single("file"),
  validateRequest(staticContentZodSchema.updateBlogZodSchema),
  StaticContentController.editBlogById,
);
route.get("/banner", StaticContentController.getAllBanners);
route.get("/banner/:id", StaticContentController.getBannerById);
route.delete("/:id", StaticContentController.deleteStaticContent);
export const StaticContentRouter = route;
