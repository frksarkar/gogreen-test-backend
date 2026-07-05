import  httpStatus  from 'http-status';
import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";

type UpdateCategoryProperty = {
  attributeId?: string;
  categoryId?: string;
};

const createCategoryProperty = async (payload: any) => {
  const attribute = await prisma.attribute.findUnique({
    where: { id: payload.attributeId },
  });

  if (!attribute) throw new ApiError(404, "Attribute not found");
  if(attribute.propertyType === "VARIANT"){
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot direct assign variant values to category")
  }

  const category = await prisma.productCategory.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) throw new ApiError(404, "Category not found");

  const existing = await prisma.categoryProperty.findFirst({
    where: {
      attributeId: payload.attributeId,
      categoryId: payload.categoryId,
    },
  });

  if (existing) {
    throw new ApiError(400, "Attribute already assigned to this category");
  }

  await prisma.categoryProperty.create({
    data: payload
  });
  return prisma.productCategory.findUnique({
    where: { id: payload.categoryId },
    select: {
      name: true,
      slug: true,
      categoryProperties: {
        where: { isDeleted: false },
        select: {
          property: {
            select: {
              name: true,
              type: true,
              propertyType: true,
            },
          },
        },
      },
    },
  });
};

const getAllCategoryProperties = async () => {
  return prisma.productCategory.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryProperties: {
        where: { isDeleted: false },
        select: {
          id: true,
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              propertyType: true,
            },
          },
        },
      },
    },
  });
};

const getCategoryPropertiesByType = async (
  type: "ATTRIBUTE" | "VARIANT"
) => {
  return prisma.productCategory.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      slug: true,
      categoryProperties: {
        where: {
          isDeleted: false,
          property: { propertyType: type },
        },
        select: {
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              propertyType: true,
            },
          },
        },
      },
    },
  });
};

const getSingleCategoryProperty = async (id: string) => {
  const item = await prisma.categoryProperty.findFirst({
    where: { id, isDeleted: false },
    select: {
      property: {
        select:{
          name:true,
          type:true,
          propertyType:true
        }
      },
      category: {
        select:{
          name:true
        }
      },
    },
  });

  if (!item) throw new ApiError(404, "Category attribute not found");

  return item;
};

const updateCategoryProperty = async (
  id: string,
  payload: UpdateCategoryProperty,
) => {
  const existing = await prisma.categoryProperty.findUnique({
    where: { id },
  });

  if (!existing || existing.isDeleted) {
    throw new ApiError(404, "Category attribute not found");
  }

  if (payload.attributeId) {
    const attribute = await prisma.attribute.findUnique({
      where: { id: payload.attributeId },
    });
    if (!attribute) throw new ApiError(404, "Attribute not found");
  }

  if (payload.categoryId) {
    const category = await prisma.productCategory.findUnique({
      where: { id: payload.categoryId },
    });
    if (!category) throw new ApiError(404, "Category not found");
  }

  prisma.categoryProperty.update({
    where: { id },
    data: payload,
  });
  return prisma.productCategory.findUnique({
    where: { id: payload.categoryId },
    select: {
      name: true,
      slug: true,
      categoryProperties: {
        where: { isDeleted: false },
        select: {
          property: {
            select: {
              name: true,
              type: true,
              propertyType: true,
            },
          },
        },
      },
    },
  });
};

const softDeleteCategoryProperty = async (id: string) => {
  await prisma.categoryProperty.update({
    where: { id },
    data: { isDeleted: true },
  });
};

const restoreCategoryProperty = async (id: string) => {
  await prisma.categoryProperty.update({
    where: { id },
    data: { isDeleted: false },
  });
};

const hardDeleteCategoryProperty = async (id: string) => {
  const existing = await prisma.categoryProperty.findUnique({
    where: { id },
  });

  if (!existing) throw new ApiError(404, "Category attribute not found");

  await prisma.categoryProperty.delete({
    where: { id },
  });
};

export const CategoryPropertyService = {
  createCategoryProperty,
  getAllCategoryProperties,
  getSingleCategoryProperty,
  updateCategoryProperty,
  softDeleteCategoryProperty,
  restoreCategoryProperty,
  hardDeleteCategoryProperty,
  getCategoryPropertiesByType
};