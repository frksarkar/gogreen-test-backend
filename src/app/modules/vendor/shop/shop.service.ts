import { deleteImgFromCloudinary } from "../../../config/cloudinary.config";
import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import {
  VendorActivityActions,
  VendorActivityService,
} from "../activity/activity.service";

const createStore = async (userId: string, payload: any) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  if (payload.slug) {
    const existingStore = await prisma.store.findUnique({
      where: { slug: payload.slug },
    });
    if (existingStore)
      throw new ApiError(400, "Store with this slug already exists");
  }

  const { social, ...rest } = payload;

  return await prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        ...rest,
        vendorId: vendor.id,
        social: social ? { create: social } : undefined,
      },
      include: { social: true },
    });

    // Log store creation activity
    await tx.vendorActivityLog.create({
      data: {
        vendorId: vendor.id,
        storeId: store.id,
        action: VendorActivityActions.STORE_CREATED,
        details: `Store created: ${store.shopName}`,
      },
    });

    return store;
  });
};

const getAllStores = async () => {
  return await prisma.store.findMany({
    where: { isDeleted: false },
    include: {
      vendor: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      social: true,
    },
  });
};

const getStoreById = async (id: string) => {
  return await prisma.store.findUnique({
    where: { id, isDeleted: false },
    include: {
      vendor: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      social: true,
    },
  });
};
const getStoreBySlug = async (slug: string) => {
  return await prisma.store.findUnique({
    where: { slug, isDeleted: false },

    include: {
      vendor: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },

      products: {
        select: {
          productReviews: {
            orderBy: { createdAt: "desc" },

            select: {
              review: true,
              rating: true,
              reviewer: {
                select: {
                  name: true,
                  profile_photo: true,
                },
              },
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
      },

      coupons: {
        where: {
          isDeleted: false,
          isActive: true,
        },
        select: {
          code: true,
          discountType: true,
          amount: true,
          minSpend: true,
          startDate: true,
          endDate: true,
        },
      },

      _count: {
        select: {
          products: {
            where: {
              isDeleted: false,
            },
          },
          followers: true,
        },
      },
      social: true,
    },
  });
};

const updateStore = async (userId: string, id: string, payload: any) => {
  const store = await prisma.store.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  const { social, ...rest } = payload;

  if (rest.shopLogo && store.shopLogo) {
    await deleteImgFromCloudinary(store.shopLogo);
  }
  if (rest.shopBanner && store.shopBanner) {
    await deleteImgFromCloudinary(store.shopBanner);
  }

  return await prisma.$transaction(async (tx) => {
    if (social) {
      await tx.vendorSocial.upsert({
        where: { storeId: id },
        update: { ...social, isDeleted: false, deletedAt: null },
        create: { ...social, storeId: id, isDeleted: false },
      });
    }

    const updatedStore = await tx.store.update({
      where: { id },
      data: rest,
      include: { social: true },
    });

    // Log store update activity
    await tx.vendorActivityLog.create({
      data: {
        vendorId: store.vendorId,
        storeId: store.id,
        action: VendorActivityActions.STORE_UPDATED,
        details: `Store updated: ${updatedStore.shopName}`,
      },
    });

    return updatedStore;
  });
};

const deleteStore = async (userId: string, id: string, hardDelete = false) => {
  const store = await prisma.store.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  if (hardDelete) {
    if (store.shopLogo) await deleteImgFromCloudinary(store.shopLogo);
    if (store.shopBanner) await deleteImgFromCloudinary(store.shopBanner);

    // Log hard delete activity before deletion
    await VendorActivityService.createVendorActivityLog({
      vendorId: store.vendorId,
      storeId: store.id,
      action: VendorActivityActions.STORE_DELETED,
      details: `Store permanently deleted (hard delete): ${store.shopName}`,
    });

    return await prisma.store.delete({ where: { id } });
  }

  const deletedStore = await prisma.store.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  // Log soft delete activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: store.vendorId,
    storeId: store.id,
    action: VendorActivityActions.STORE_DELETED,
    details: `Store soft deleted: ${store.shopName}`,
  });

  return deletedStore;
};

const getAllFollowsByStore = async (storeId: string) => {
  const vendorFollower = await prisma.vendorFollower.findMany({
    where: { storeId },
    include: {
      store: true,
      user: true,
    },
  });

  return vendorFollower;
};

const getFollowsByStore = async (userId: string, storeId: string) => {
  const vendorFollower = await prisma.vendorFollower.findUnique({
    where: { storeId_userId: { storeId, userId } },
    include: {
      store: true,
      user: true,
    },
  });

  return vendorFollower;
};

const followStore = async (userId: string, storeId: string) => {
  return await prisma.vendorFollower.create({
    data: { userId, storeId },
  });
};

const unfollowStore = async (userId: string, storeId: string) => {
  return await prisma.vendorFollower.delete({
    where: { storeId_userId: { storeId, userId } },
  });
};

// Admin Access
const updateStoreStatus = async (storeId: string, payload: any) => {
  return await prisma.store.update({
    where: { id: storeId },
    data: payload,
  });
};

export const ShopService = {
  createStore,
  getAllStores,
  getStoreById,
  getStoreBySlug,
  updateStore,
  deleteStore,
  getFollowsByStore,
  getAllFollowsByStore,
  followStore,
  unfollowStore,
  updateStoreStatus,
};
