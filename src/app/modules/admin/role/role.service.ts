import { Prisma, Role, UserRole } from "@prisma/client";
import { prisma } from "../../../shared/prisma";
import { generateSlug } from "../../../utils/generateSlug";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";
import { paginationHelper } from "../../../helper/paginationHelper";

const getRoleCategoryObj: Prisma.RoleCategoryDefaultArgs = {
  select: {
    id: true,
    role: {
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isDeleted: true,
        systemLevel: true,
        createdAt: true,
      },
    },

    permission_category: {
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isDeleted: true,
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
    },
  },
};
const createRoleCategory = async (categoryId: string, roleId: string) => {
  const roleExists = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });
  if (!roleExists) throw new ApiError(httpStatus.BAD_REQUEST, "Role not found");

  const categoryExists = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
  });
  if (!categoryExists)
    throw new ApiError(httpStatus.BAD_REQUEST, "Permission Category not found");
  const existingCategory = await prisma.roleCategory.findFirst({
    where: {
      role_id: roleId,
      permission_category_id: categoryId,
    },
  });
  if (existingCategory)
    throw new ApiError(httpStatus.BAD_REQUEST, "Role Category already exists");
  return await prisma.roleCategory.create({
    data: {
      role_id: roleId,
      permission_category_id: categoryId,
    },
  });
};
const createNewRole = async (role: Role) => {
  const roleExists = await prisma.role.findFirst({
    where: {
      name: {
        equals: role.name,
        mode: "insensitive",
      },
    },
  });
  if (roleExists)
    throw new ApiError(httpStatus.BAD_REQUEST, "Role name already exists");

  const slug = await generateSlug(role.name, "role");
  return await prisma.role.create({
    data: {
      ...role,
      slug,
    },
  });
};
const getAllRoles = async (filters: any, options: any) => {
  const { deleted, type } = filters;
  const { skip, page, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  if (type === "category") {
    const category = await prisma.roleCategory.findMany({
      skip,
      take: limit,
      ...getRoleCategoryObj,
    });
    return {
      data: category,
      meta: {
        page,
        limit,
        total: category.length,
      },
    };
    // return await prisma.roleCategory.findMany({});
  }
  if (type === "role" || !type) {
    const where =
      deleted === "true"
        ? { isDeleted: true }
        : deleted === "all"
          ? {}
          : { isDeleted: false };
    const roles = await prisma.role.findMany({ skip, take: limit, where });
    return {
      data: roles,
      meta: {
        page,
        limit,
        total: roles.length,
      },
    };
  }
  if (type === "inheritance") {
    const inheritance = await prisma.roleInheritance.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        child: {
          omit: {
            updatedAt: true,
          },
        },
        parent: {
          omit: {
            updatedAt: true,
          },
        },
      },
    });
    return {
      data: inheritance,
      meta: {
        page,
        limit,
        total: inheritance.length,
      },
    };
  }
  if (type === "assign") {
    const assignedRoles = await prisma.userRole.findMany({
      skip,
      take: limit,

      where: {
        assigned_by: {
          not: null,
        },
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        role: true,
        user: {
          omit: {
            password: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return {
      data: assignedRoles,
      meta: {
        page,
        limit,
        total: assignedRoles.length,
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
const assignRole = async (
  email: string,
  roleId: string,
  assignedBy: string,
) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User not found");
  }
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });
  if (!role) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Role not found");
  }
  if (assignedBy) {
    const assignedByUser = await prisma.user.findUnique({
      where: { id: assignedBy },
    });
    if (!assignedByUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Assigned by user not found");
    }
  }
  const assignedRole = await prisma.userRole.create({
    data: {
      user_id: user.id,
      role_id: roleId,
      assigned_by: assignedBy,
    },
  });
  return await prisma.userRole.findUnique({
    where: {
      id: assignedRole.id,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      user: {
        omit: {
          password: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      assigned_by: true,
    },
  });
};

const deleteAssignedRole = async (id: string) => {
  const userRole = await prisma.userRole.findUnique({
    where: {
      id: id,
    },
  });
  if (!userRole)
    throw new ApiError(httpStatus.BAD_REQUEST, "User Role not found");
  return await prisma.userRole.delete({
    where: {
      id: id,
    },
  });
};
const softDeleteRole = async (id: string) => {
  const roleExists = await prisma.role.findUnique({
    where: {
      id: id,
    },
  });
  if (!roleExists) throw new ApiError(httpStatus.BAD_REQUEST, "Role not found");
  const existingUsers = await prisma.userRole.findFirst({
    where: {
      role_id: id,
    },
  });
  if (existingUsers) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete role assigned to users",
    );
  }
  await prisma.role.update({
    where: {
      id: id,
    },
    data: {
      isDeleted: true,
    },
  });
};
const restoreRole = async (ids: string[]) => {
  const roleExists = await prisma.role.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
  if (roleExists.length !== ids.length)
    throw new ApiError(httpStatus.BAD_REQUEST, "Some role were not found");

  return await prisma.role.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      isDeleted: false,
    },
  });
};
const hardDeleteRole = async (id: string, type?: string) => {
  if (type === "role" || !type) {
    const roleExists = await prisma.role.findUnique({
      where: {
        id,
      },
    });
    if (!roleExists)
      throw new ApiError(httpStatus.BAD_REQUEST, "Role not found");
    const existingUsers = await prisma.userRole.findFirst({
      where: {
        role_id: id,
      },
    });
    if (existingUsers) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cannot delete role assigned to users",
      );
    }
    await prisma.$transaction(async (tnx) => {
      tnx.roleCategory.deleteMany({
        where: {
          role_id: id,
        },
      });
      await tnx.role.delete({
        where: {
          id,
        },
      });
    });
  }
  if (type === "category") {
    await deleteRoleCategory(id);
  }
  if (type === "inheritance") {
    await deleteRolInheritanceById(id);
  }
  if (type === "assign") {
    await deleteAssignedRole(id);
  }
};
const deleteRoleCategory = async (id: string) => {
  const roleCategory = await prisma.roleCategory.findUnique({
    where: {
      id,
    },
  });
  if (!roleCategory)
    throw new ApiError(httpStatus.BAD_REQUEST, "Role category not found");
  return await prisma.roleCategory.delete({
    where: {
      id,
    },
  });
};
const createNewRoleInheritance = async (
  childRoleId: string,
  parentRoleId: string,
) => {
  const role = await prisma.role.findUnique({
    where: {
      id: childRoleId,
    },
  });
  if (!role) throw new ApiError(httpStatus.BAD_REQUEST, "Child role not found");
  const parentRole = await prisma.role.findUnique({
    where: {
      id: parentRoleId,
    },
  });
  if (!parentRole)
    throw new ApiError(httpStatus.BAD_REQUEST, "Parent role not found");

  const roleInheritance = await prisma.roleInheritance.create({
    data: {
      parent_role_id: parentRoleId,
      child_role_id: childRoleId,
    },
  });
  return await prisma.roleInheritance.findUnique({
    where: {
      id: roleInheritance.id,
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      parent: true,
      child: true,
    },
  });
};

const deleteRolInheritanceById = async (id: string) => {
  const roleInheritance = await prisma.roleInheritance.findUnique({
    where: {
      id,
    },
  });
  if (!roleInheritance)
    throw new ApiError(httpStatus.BAD_REQUEST, "Role inheritance not found");
  return await prisma.roleInheritance.delete({
    where: {
      id,
    },
  });
};

const getRoleById = async (id: string, type?: string) => {
  if (type === "category") {
    const roleCategory = await prisma.roleCategory.findUnique({
      where: {
        id,
      },
      ...getRoleCategoryObj,
    });
    if (!roleCategory)
      throw new ApiError(httpStatus.BAD_REQUEST, "Role category not found");
    return roleCategory;
  }
  if (type === "role" || !type) {
    const role = await prisma.role.findUnique({
      where: {
        id,
      },
    });
    if (!role) throw new ApiError(httpStatus.BAD_REQUEST, "Role not found");
    return role;
  }
  if (type === "inheritance") {
    const roleInheritance = await prisma.roleInheritance.findUnique({
      where: {
        id,
      },
    });
    if (!roleInheritance)
      throw new ApiError(httpStatus.BAD_REQUEST, "Role inheritance not found");
    return roleInheritance;
  }
  if (type === "assign") {
    const userRole = await prisma.userRole.findUnique({
      where: {
        id,
      },
    });
    if (!userRole)
      throw new ApiError(httpStatus.BAD_REQUEST, "User role not found");
    return userRole;
  }
};
const editRoleById = async (id: string, data: Partial<Role>) => {
  if (data.name) {
    const roleNameExists = await prisma.role.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: "insensitive",
        },
      },
    });
    if (roleNameExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Role name already exists");
    }
    const slug = await generateSlug(data.name, "role");
    data.slug = slug;
  }

  return await prisma.role.update({
    where: {
      id,
    },
    data,
  });
};
export const RoleService = {
  createRoleCategory,
  createNewRole,
  getAllRoles,
  assignRole,
  softDeleteRole,
  restoreRole,
  hardDeleteRole,
  deleteRoleCategory,
  createNewRoleInheritance,
  getRoleById,
  editRoleById,
};
