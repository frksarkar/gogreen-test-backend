import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { JwtPayload } from "jsonwebtoken";
import { TestimonialService } from "./testimonial.service";
import sendResponse from "../../../shared/sendResponse";

const createTestimonial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user as JwtPayload;
    const payload = { user_id: id, ...req.body };
    const result = await TestimonialService.createTestimonial(payload);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Testimonial created successfully!",
      data: result,
    });
  },
);
const getTestimonialById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await TestimonialService.getTestimonial(id as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Testimonial fetched successfully!",
      data: result,
    });
  },
);

const updateTestimonial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const payload = { ...req.body };
    const result = await TestimonialService.updateTestimonial(
      id as string,
      payload,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Testimonial updated successfully!",
      data: result,
    });
  },
);
const getAllTestimonials = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await TestimonialService.getAllTestimonials();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Testimonials fetched successfully!",
      data: result,
    });
  },
);
const deleteTestimonial = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await TestimonialService.deleteTestimonial(
      req.params.id as string,
    );
    sendResponse(res, {
      statusCode: 200,
      message: "Testimonial deleted successfully!",
      success: true,
      data: result,
    });
  },
);
export const TestimonialController = {
  createTestimonial,
  getTestimonialById,
  updateTestimonial,
  getAllTestimonials,
  deleteTestimonial,
};
