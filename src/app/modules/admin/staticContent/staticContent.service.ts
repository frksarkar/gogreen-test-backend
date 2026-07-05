import { ContentSection, StaticPage } from "@prisma/client";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";
const createStaticContent = async (
  title: string,
  description: string,
  page: StaticPage,
  sectionId: string,
) => {
  return await prisma.content.create({
    data: {
      title,
      description,
      page,
      section_id: sectionId,
    },
  });
};

const createStaticContentSection = async (
  page: StaticPage,
  section: string,
) => {
  return await prisma.contentSection.create({
    data: {
      page,
      section,
    },
  });
};
const editStaticContentSection = async (
  id: string,
  section: Partial<ContentSection>,
) => {
  const contentSection = await prisma.contentSection.findUnique({
    where: { id },
  });
  if (!contentSection)
    throw new ApiError(httpStatus.BAD_REQUEST, "Content section not found");

  return await prisma.contentSection.update({
    where: { id },
    data: section,
  });
};
const getStaticPage = async (page: StaticPage) => {
  return await prisma.content.findMany({
    where: {
      page: page,
    },
    include: {
      Section: true,
    },
  });
};
const getStaticContentSection = async (page: StaticPage) => {
  return await prisma.contentSection.findMany({
    where: {
      page,
    },
  });
};
const editStaticContent = async (
  sections: [{ id: string; title: string; description: string }],
) => {
  return await prisma.$transaction(
    sections.map(({ id, title, description }) =>
      prisma.content.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
        },
      }),
    ),
  );
};
const createNewBlog = async (payload: any) => {
  return await prisma.blog.create({
    data: {
      ...payload,
    },
  });
};
const getBlogById = async (id: string) => {
  const blog = await prisma.blog.findUnique({
    where: {
      id,
    },
  });
  if (!blog) throw new ApiError(httpStatus.BAD_REQUEST, "Blog not found");
  await prisma.blog.update({
    where: {
      id,
    },
    data: {
      views: blog.views + 1,
    },
  });
  return blog;
};
const getAllBlogs = async () => {
  return await prisma.blog.findMany({
    where: {
      isActive: true,
    },
  });
};
const createNewBanner = async (payload: any) => {
  const { title, isActive, position, order, images } = payload;

  await prisma.$transaction(async (tnx) => {
    const banner = await tnx.banner.create({
      data: {
        title,
        isActive,
        position,
        order,
      },
    });

    await Promise.all(
      images.map((img: string) =>
        tnx.bannerImage.create({
          data: {
            banner_id: banner.id,
            image_url: img,
          },
        }),
      ),
    );
    return banner;
  });
};
const getAllBanners = async () => {
  return await prisma.banner.findMany({
    include: {
      bannerImages: true,
    },
  });
};
const getBannerById = async (id: string) => {
  const banner = await prisma.banner.findUnique({
    where: {
      id,
    },
    include: {
      bannerImages: true,
    },
  });
  if (!banner) throw new ApiError(httpStatus.BAD_REQUEST, "Banner not found");
  return banner;
};

const editBlogById = async (id: string, payload: any) => {
  const blog = await prisma.blog.findUnique({
    where: {
      id,
    },
  });
  if (!blog) throw new ApiError(httpStatus.BAD_REQUEST, "Blog not found");
  return await prisma.blog.update({
    where: {
      id,
    },
    data: {
      ...payload,
    },
  });
};
const editBannerById = async (id: string, payload: any) => {
  const { title, isActive, position, order, images } = payload;
  const banner = await prisma.banner.findUnique({
    where: { id },
  });
  if (!banner) throw new ApiError(httpStatus.BAD_REQUEST, "Banner not found");
  return await prisma.$transaction(async (tnx) => {
    await tnx.banner.update({
      where: {
        id,
      },
      data: {
        title,
        isActive,
        position,
        order,
      },
    });
  });
};
const deleteStaticContent = async (id: string) => {
  const content = await prisma.content.findUnique({
    where: {
      id,
    },
  });
  if (!content) throw new ApiError(httpStatus.BAD_REQUEST, "Content not found");
  return await prisma.content.delete({
    where: {
      id,
    },
  });
};
const deleteStaticContentSection = async (id: string) => {
  const contentSection = await prisma.contentSection.findUnique({
    where: {
      id,
    },
  });
  if (!contentSection)
    throw new ApiError(httpStatus.BAD_REQUEST, "Content section not found");
  return await prisma.contentSection.delete({
    where: {
      id,
    },
  });
};
export const StaticContentService = {
  createStaticContent,
  createStaticContentSection,
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
