import { NextFunction, Response, Request } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StaticContentService } from "./staticContent.service";
import { StaticPage } from "@prisma/client";

const createStaticContentSection = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page, section } = req.body;
    const result = await StaticContentService.createStaticContentSection(
      page,
      section,
    );
    sendResponse(res, {
      success: true,
      message: "Static content section created successfully",
      data: result,
      statusCode: 201,
    });
  },
);
const createStaticContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, description, page, sectionId } = req.body;
    const result = await StaticContentService.createStaticContent(
      title,
      description,
      page,
      sectionId,
    );
    sendResponse(res, {
      success: true,
      message: "Content page added successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const getStaticPage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page } = req.query;
    const result = await StaticContentService.getStaticPage(page as StaticPage);
    sendResponse(res, {
      success: true,
      message: "Static page retrieved successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const editStaticContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await StaticContentService.editStaticContent(req.body);
    sendResponse(res, {
      success: true,
      message: "Content edited successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const editStaticContentSection = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const result = await StaticContentService.editStaticContentSection(
      id as string,
      req.body,
    );
    sendResponse(res, {
      success: true,
      message: "Updated static content section successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const getStaticContentSection = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page } = req.query;
    const result = await StaticContentService.getStaticContentSection(
      page as StaticPage,
    );
    sendResponse(res, {
      success: true,
      message: "Static content section retrieved successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const createNewBlog = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const parsedData = JSON.parse(req.body.data);
    const payload = {
      ...(req.file?.path && { image_url: req.file.path }),
      title: parsedData.title,
      blog: JSON.stringify(parsedData.blog),
    };
    const result = await StaticContentService.createNewBlog(payload);
    sendResponse(res, {
      success: true,
      message: "New blog created successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const getBlogById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await StaticContentService.getBlogById(id as string);
    sendResponse(res, {
      success: true,
      message: "Blog retrieved successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const getAllBlogs = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await StaticContentService.getAllBlogs();
    sendResponse(res, {
      success: true,
      message: "Blogs retrieved successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const createNewBanner = catchAsync(async (req: Request, res: Response) => {
  const parsedData = JSON.parse(req.body.data);
  const payload = {
    title: parsedData.title,
    isActive: parsedData.isActive,
    position: parsedData.position,
    order: parsedData.order,
    images: (req.files as Express.Multer.File[])?.map((file) => file.path),
  };
  const result = await StaticContentService.createNewBanner(payload);
  sendResponse(res, {
    success: true,
    message: "Banner created successfully",
    data: result,
    statusCode: 201,
  });
});
const getAllBanners = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await StaticContentService.getAllBanners();
    sendResponse(res, {
      success: true,
      message: "Banners Retrieved successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const getBannerById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await StaticContentService.getBannerById(id as string);
    sendResponse(res, {
      success: true,
      message: "Banner retrieved successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const editBannerById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const payload = {
      ...req.body,
      images: (req.files as Express.Multer.File[])?.map((file) => file.path),
    };
    const result = await StaticContentService.editBannerById(
      id as string,
      payload,
    );
    sendResponse(res, {
      success: true,
      message: "Banner updated successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const editBlogById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const image_url = req.file?.path;
    const payload = {
      ...req.body,
      ...(!image_url && { image_url }),
    };
    const result = await StaticContentService.editBlogById(
      id as string,
      payload,
    );
    sendResponse(res, {
      success: true,
      message: "Blog updated successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const deleteStaticContentSection = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await StaticContentService.deleteStaticContentSection(
      id as string,
    );
    sendResponse(res, {
      success: true,
      message: "Static content section deleted successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
const deleteStaticContent = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await StaticContentService.deleteStaticContent(id as string);
    sendResponse(res, {
      success: true,
      message: "Static content deleted successfully!",
      data: result,
      statusCode: 201,
    });
  },
);
export const StaticContentController = {
  createStaticContentSection,
  createStaticContent,
  getStaticPage,
  editStaticContent,
  editStaticContentSection,
  getStaticContentSection,
  createNewBlog,
  getBlogById,
  getAllBlogs,
  createNewBanner,
  getAllBanners,
  getBannerById,
  editBlogById,
  editBannerById,
  deleteStaticContentSection,
  deleteStaticContent,
};
