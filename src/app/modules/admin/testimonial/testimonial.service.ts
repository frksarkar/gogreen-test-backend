import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import httpStatus from "http-status";
const createTestimonial = async (payload: any) => {
  return await prisma.testimonial.create({
    data: payload,
  });
};

const getTestimonial = async (id: string) => {
  const testimonial = await prisma.testimonial.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          name: true,
          profile_photo: true,
          gender: true,
        },
      },
    },
  });
  if (!testimonial)
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial Not found");
  return testimonial;
};
const updateTestimonial = async (id: string, payload: any) => {
  const testimonial = await prisma.testimonial.findUnique({
    where: {
      id,
    },
  });
  if (!testimonial)
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial Not found");
  return await prisma.testimonial.update({
    where: {
      id,
    },
    data: payload,
  });
};

const getAllTestimonials = async () => {
  const testimonials = await prisma.testimonial.findMany({
    include: {
      user: {
        select: {
          name: true,
          profile_photo: true,
          gender: true,
        },
      },
    },
  });
  return testimonials;
};

const deleteTestimonial = async (id: string) => {
  const testimonial = await prisma.testimonial.findUnique({
    where: {
      id,
    },
  });
  if (!testimonial)
    throw new ApiError(httpStatus.NOT_FOUND, "Testimonial Not found");
  return await prisma.testimonial.delete({
    where: {
      id,
    },
  });
};

export const TestimonialService = {
  createTestimonial,
  getTestimonial,
  updateTestimonial,
  getAllTestimonials,
  deleteTestimonial,
};
