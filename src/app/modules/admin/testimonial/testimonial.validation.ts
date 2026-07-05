import z from "zod";

const createTestimonial = z.object({
  rating: z.number().min(1).max(5),
  review: z.string().min(1),
});
const updateTestimonial = createTestimonial.partial();
export const TestimonialValidationSchema = {
  updateTestimonial,
  createTestimonial,
};
