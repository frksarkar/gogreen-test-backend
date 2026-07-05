import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const updateVendorSocial = async (userId: string, payload: any) => {
  const { storeId, ...rest } = payload;
  if (!storeId) throw new ApiError(400, "StoreId is required");

  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  const social = await prisma.vendorSocial.upsert({
    where: { storeId },
    update: { ...rest, isDeleted: false, deletedAt: null },
    create: { ...rest, storeId, isDeleted: false },
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    store.vendorId,
    storeId,
    VendorActivityActions.SOCIAL_UPDATED,
    `Updated social links for store: ${store.shopName || storeId}`,
  );

  return social;
};

const getStoreSocial = async (storeId: string) => {
  return await prisma.vendorSocial.findFirst({
    where: { storeId, isDeleted: false },
  });
};

const getSocialById = async (userId: string, id: string) => {
  const social = await prisma.vendorSocial.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
  });
  if (!social)
    throw new ApiError(404, "Social links not found or unauthorized");
  return social;
};

const deleteVendorSocial = async (
  userId: string,
  storeId: string,
  hardDelete = false,
) => {
  const social = await prisma.vendorSocial.findFirst({
    where: { storeId, store: { vendor: { userId } }, isDeleted: false },
    include: {
      store: { select: { vendorId: true, shopName: true } },
    },
  });
  if (!social)
    throw new ApiError(404, "Social links not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorSocial.delete({ where: { id: social.id } });
  } else {
    result = await prisma.vendorSocial.update({
      where: { id: social.id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.logVendorActivity(
    social.store.vendorId,
    storeId,
    VendorActivityActions.SOCIAL_DELETED,
    `${hardDelete ? "Permanently deleted" : "Removed"} social links for store: ${social.store.shopName || storeId}`,
  );

  return result;
};

export const SocialService = {
  updateVendorSocial,
  getStoreSocial,
  getSocialById,
  deleteVendorSocial,
};
