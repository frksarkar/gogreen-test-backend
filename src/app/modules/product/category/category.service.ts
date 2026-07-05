import { deleteImgFromCloudinary } from "../../../config/cloudinary.config";
import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import { buildCategoryTree } from "../../../utils/buildCategoryTree";
import { generateSlug } from "../../../utils/generateSlug";

const createCategory = async (payload: any) => {
  const existingCategory = await prisma.productCategory.findFirst({
    where: {
      name: {
        equals: payload.name,
        mode: "insensitive",
      },
      isDeleted: false,
    },
  });

  if (existingCategory) {
    throw new ApiError(400, "Category name already exists");
  }
  // console.log(payload.name);
  const generatedSlug = await generateSlug(payload.name, "productCategory");
  const updatePayload = {
    ...payload,
    slug: generatedSlug,
  };

  if (updatePayload.parentId) {
    const parent = await prisma.productCategory.findUnique({
      where: { id: updatePayload.parentId },
    });

    if (!parent) {
      throw new ApiError(404, "Parent category not found");
    }
  }

  return prisma.productCategory.create({
    data: updatePayload,
    select: {
      name: true,
      slug: true,
      description: true,
      image: true,
      parentId: true,
    },
  });
};

const getAllCategories = async () => {
  const categories = await prisma.productCategory.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      parentId: true,
    },
  });

  return buildCategoryTree(categories, null);
};

const getSingleCategory = async (id: string) => {
  const category = await prisma.productCategory.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      children: {
        where: { isDeleted: false },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
        },
      },
    },
  });

  if (!category) throw new ApiError(404, "Category not found");

  return category;
};

const updateCategory = async (id: string, payload: any) => {
  const category = await prisma.productCategory.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, "Category not found");
  let generatedSlug = category.slug;
  if (payload.name) {
    const existingCategoryName = await prisma.productCategory.findFirst({
      where: {
        name: {
          equals: payload.name,
          mode: "insensitive", // prevents Electronics vs electronics
        },
        isDeleted: false,
        NOT: { id },
      },
    });
    if (existingCategoryName) {
      throw new ApiError(400, "Category name already exists");
    }
    if (payload.name !== category.name) {
      generatedSlug = await generateSlug(payload.name, "productCategory");
    }
  }
  const updatePayload = {
    ...payload,
    slug: generatedSlug,
  };

  const updatedCategory = prisma.productCategory.update({
    where: { id },
    data: updatePayload,
  });

  if (updatePayload.image && category.image) {
    await deleteImgFromCloudinary(category.image);
  }
  return updatedCategory;
};

const softDeleteCategory = async (id: string) => {
  
  const category = await prisma.productCategory.findUnique({
    where: { id },
  });

  if (!category || category.isDeleted) {
    throw new ApiError(404, "Category not found");
  }

  
  const childExists = await prisma.productCategory.findFirst({
    where: {
      parentId: id,
      isDeleted: false,
    },
    select: { id: true },
  });

  
  if (childExists) {
    throw new ApiError(
      400,
      "Cannot delete category because it has child categories"
    );
  }


  return prisma.productCategory.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

const restoreCategory = async (id: string) => {
  await prisma.productCategory.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  });
};

const hardDeleteCategory = async (id: string) => {
  // 1️⃣ check category exists
  const category = await prisma.productCategory.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  // 2️⃣ prevent delete if has children
  const childExists = await prisma.productCategory.findFirst({
    where: {
      parentId: id,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (childExists) {
    throw new ApiError(
      400,
      "Cannot delete category because it has child categories"
    );
  }

  // 3️⃣ prevent delete if has products
  const hasProducts = await prisma.product.findFirst({
    where: {
      categoryId: id,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (hasProducts) {
    throw new ApiError(400, "Cannot delete category with products");
  }

  // 4️⃣ hard delete
  return prisma.productCategory.delete({
    where: { id },
  });
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  softDeleteCategory,
  restoreCategory,
  hardDeleteCategory,
};
