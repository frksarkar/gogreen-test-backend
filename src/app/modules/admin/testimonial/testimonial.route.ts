import { Router } from "express";
import { TestimonialController } from "./testimonial.controller";
import { validateRequest } from "../../../middlewares/validateRequest";
import { TestimonialValidationSchema } from "./testimonial.validation";
import { auth } from "../../../middlewares/auth";

const route = Router();

route.get("/", TestimonialController.getAllTestimonials);
route.post(
  "/",
  auth(),
  validateRequest(TestimonialValidationSchema.createTestimonial),
  TestimonialController.createTestimonial,
);
route.get("/:id", TestimonialController.getTestimonialById);
route.patch(
  "/:id",
  validateRequest(TestimonialValidationSchema.updateTestimonial),
  TestimonialController.updateTestimonial,
);
route.delete("/:id", TestimonialController.deleteTestimonial);
export const TestimonialRouter = route;
