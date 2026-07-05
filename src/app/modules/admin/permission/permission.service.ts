import { Permission, Category, Prisma } from "@prisma/client";
import { prisma } from "../../../shared/prisma";
import { generateSlug } from "../../../utils/generateSlug";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";
import { paginationHelper } from "../../../helper/paginationHelper";
const getCategoryObj: Prisma.CategoryDefaultArgs = {
  select: {
    id: true,
    name: true,
    createdAt: true,
    slug: true,
    categoryPermissions: {
      select: {
        permission: {
          select: {
            id: true,
            key: true,
          },
        },
      },
    },
  },
};
const createPermission = async (data: Permission) => {
  const slug = await generateSlug(data.key, "permission");
  return await prisma.permission.create({
    data: {
      ...data,
      slug,
    },
  });
};
const getPermissions = async (filters: any, options: any) => {
  const { deleted, type } = filters;
  const { skip, page, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const where =
    deleted === "true"
      ? { isDeleted: true }
      : deleted === "all"
        ? {}
        : { isDeleted: false };
  if (type === "permission" || !type) {
    const permissions = await prisma.permission.findMany({
      skip,
      take: limit,
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
    return {
      data: permissions,
      meta: {
        page,
        limit,
        total: permissions.length,
      },
    };
  }
  if (type === "category") {
    const categories = await prisma.category.findMany({
      skip,
      take: limit,
      where,
      ...getCategoryObj,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
    return {
      data: categories,
      meta: {
        page,
        limit,
        total: categories.length,
      },
    };
  }
  return {
    data: [],
    meta: {
      page,
      limit,
      total: 0,
    },
  };
};
const getPermissionById = async (id: string, type = "permission") => {
  if (type === "category") {
    const category = await prisma.category.findUnique({
      where: {
        id,
      },
      ...getCategoryObj,
    });
    if (!category)
      throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");

    return category;
  }
  const permission = await prisma.permission.findUnique({
    where: {
      id,
    },
  });
  if (!permission)
    throw new ApiError(httpStatus.BAD_REQUEST, "Permission not found");
  return permission;
};
const createPermissionCategory = async (name: string, description?: string) => {
  const slug = await generateSlug(name, "category");
  return await prisma.category.create({
    data: {
      name,
      ...(description && { description }),
      slug,
    },
  });
};
const addPermissionsToCategory = async (
  permissions: string[],
  categoryId: string,
) => {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
      isDeleted: false,
    },
  });
  if (!category)
    throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");
  const permissionKeys = await prisma.permission.findMany({
    where: {
      id: {
        in: permissions,
      },
    },
  });
  if (permissionKeys.length !== permissions.length)
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid permissions");

  const existingPermissions = await prisma.categoryPermission.findMany({
    where: {
      category_id: categoryId,
      permission_id: {
        in: permissions,
      },
    },
  });
  if (existingPermissions.length === permissions.length)
    throw new ApiError(httpStatus.BAD_REQUEST, "Permission already exists");

  return await prisma.categoryPermission.createMany({
    data: permissions.map((permission) => ({
      category_id: categoryId,
      permission_id: permission,
    })),
  });
};

const removePermissionsFromCategory = async (
  categoryId: string,
  permissions: string[],
) => {
  return await prisma.categoryPermission.deleteMany({
    where: {
      category_id: categoryId,
      permission_id: {
        in: permissions,
      },
    },
  });
};
type UpdatePermissionPayload = Partial<Omit<Permission, "type">> & {
  type: "permission";
};
type UpdateCategoryPayload = Partial<Omit<Category, "type">> & {
  type: "category";
};

type UpdatePayload = UpdatePermissionPayload | UpdateCategoryPayload;
const updatePermission = async (id: string, payload: UpdatePayload) => {
  if (payload.type === "category") {
    const { type: _, ...updateData } = payload;

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category)
      throw new ApiError(httpStatus.BAD_REQUEST, "Category not found");
    if (category.isDeleted)
      throw new ApiError(httpStatus.BAD_REQUEST, "Category is deleted");

    let slug = updateData.slug;
    if (updateData.name) {
      slug = await generateSlug(updateData.name, "category");
    }
    if (slug) {
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing && existing.id !== id)
        throw new ApiError(httpStatus.BAD_REQUEST, "Slug already exists");
    }

    return prisma.category.update({
      where: { id },
      data: { ...updateData, ...(slug && { slug }) },
    });
  }

  if (payload.type === "permission") {
    const { type: _, ...updateData } = payload;

    let slug = updateData.slug;
    if (updateData.key) {
      slug = await generateSlug(updateData.key, "permission");
    }
    if (slug) {
      const existing = await prisma.permission.findUnique({ where: { slug } });
      if (existing && existing.id !== id)
        throw new ApiError(httpStatus.BAD_REQUEST, "Slug already exists");
    }

    return prisma.permission.update({
      where: { id },
      data: { ...updateData, ...(slug && { slug }) },
    });
  }
};
const softDeletePermissions = async (ids: string[], type = "permission") => {
  if (type === "category") {
    const alreadyInRoleCategory = await prisma.roleCategory.findFirst({
      where: {
        permission_category_id: {
          in: ids,
        },
      },
    });
    if (alreadyInRoleCategory)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cannot delete this Permission Category. This category is belongs to a role",
      );
    await prisma.category.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: { isDeleted: true },
    });
  } else {
    await prisma.$transaction(async (tnx) => {
      await tnx.categoryPermission.deleteMany({
        where: {
          permission_id: {
            in: ids,
          },
        },
      });
      await tnx.permission.updateMany({
        where: {
          id: {
            in: ids,
          },
        },
        data: { isDeleted: true },
      });
    });
  }
  return true;
};
const restorePermissions = async (ids: string[], type: string) => {
  if (type === "category") {
    await prisma.category.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        isDeleted: false,
      },
    });
  }
  if (type === "permission" || !type) {
    await prisma.permission.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        isDeleted: false,
      },
    });
  }
};
const hardDeletePermission = async (ids: string[], type: string) => {
  if (type === "category") {
    await prisma.$transaction(async (tnx) => {
      await tnx.categoryPermission.deleteMany({
        where: {
          category_id: {
            in: ids,
          },
        },
      });
    });
    await prisma.category.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
    return true;
  }
  if (type === "permission" || !type) {
    await prisma.$transaction(async (tnx) => {
      await tnx.categoryPermission.deleteMany({
        where: {
          permission_id: {
            in: ids,
          },
        },
      });
      await tnx.permission.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });
    });
  }
};
export const PermissionsService = {
  createPermission,
  getPermissions,
  createPermissionCategory,
  getPermissionById,
  addPermissionsToCategory,
  removePermissionsFromCategory,
  updatePermission,
  softDeletePermissions,
  restorePermissions,
  hardDeletePermission,
};
