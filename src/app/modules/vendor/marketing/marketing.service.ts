import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const createCoupon = async (userId: string, payload: any) => {
  const { storeId, ...rest } = payload;
  if (!storeId) throw new ApiError(400, "StoreId is required");

  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
    include: { vendor: true },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  const coupon = await prisma.vendorCoupon.create({
    data: { ...rest, storeId },
  });

  // Log coupon creation activity
  await prisma.vendorActivityLog.create({
    data: {
      vendorId: store.vendor.id,
      storeId: store.id,
      action: VendorActivityActions.COUPON_CREATED,
      details: `Coupon created: ${coupon.code} (ID: ${coupon.id})`,
    },
  });

  return coupon;
};

const updateCoupon = async (userId: string, id: string, payload: any) => {
  const coupon = await prisma.vendorCoupon.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!coupon) throw new ApiError(404, "Coupon not found or unauthorized");

  const updatedCoupon = await prisma.vendorCoupon.update({
    where: { id },
    data: payload,
  });

  // Log coupon update activity
  await prisma.vendorActivityLog.create({
    data: {
      vendorId: coupon.store.vendor.id,
      storeId: coupon.storeId,
      action: VendorActivityActions.COUPON_UPDATED,
      details: `Coupon updated: ${coupon.code} (ID: ${coupon.id})`,
    },
  });

  return updatedCoupon;
};

const deleteCoupon = async (userId: string, id: string, hardDelete = false) => {
  const coupon = await prisma.vendorCoupon.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!coupon) throw new ApiError(404, "Coupon not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorCoupon.delete({ where: { id } });
  } else {
    result = await prisma.vendorCoupon.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log coupon deletion activity
  await prisma.vendorActivityLog.create({
    data: {
      vendorId: coupon.store.vendor.id,
      storeId: coupon.storeId,
      action: VendorActivityActions.COUPON_DELETED,
      details: `Coupon ${hardDelete ? "hard deleted" : "soft deleted"}: ${coupon.code} (ID: ${coupon.id})`,
    },
  });

  return result;
};

const getStoreCoupons = async (userId: string, storeId?: string) => {
  return await prisma.vendorCoupon.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      store: { vendor: { userId } },
      isDeleted: false,
    },
  });
};

const getCouponById = async (userId: string, id: string) => {
  const coupon = await prisma.vendorCoupon.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
  });
  if (!coupon) throw new ApiError(404, "Coupon not found or unauthorized");
  return coupon;
};

const createPromotion = async (userId: string, payload: any) => {
  const { storeId, ...rest } = payload;
  if (!storeId) throw new ApiError(400, "StoreId is required");

  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
    include: { vendor: true },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  const promotion = await prisma.vendorPromotion.create({
    data: { ...rest, storeId },
  });

  // Log promotion creation activity
  await prisma.vendorActivityLog.create({
    data: {
      vendorId: store.vendor.id,
      storeId: store.id,
      action: VendorActivityActions.PROMOTION_CREATED,
      details: `Promotion created: ${promotion.name} (ID: ${promotion.id})`,
    },
  });

  return promotion;
};

const updatePromotion = async (userId: string, id: string, payload: any) => {
  const promotion = await prisma.vendorPromotion.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!promotion)
    throw new ApiError(404, "Promotion not found or unauthorized");

  const updatedPromotion = await prisma.vendorPromotion.update({
    where: { id },
    data: payload,
  });

  // Log promotion update activity
  await prisma.vendorActivityLog.create({
    data: {
      vendorId: promotion.store.vendor.id,
      storeId: promotion.storeId,
      action: VendorActivityActions.PROMOTION_UPDATED,
      details: `Promotion updated: ${promotion.name} (ID: ${promotion.id})`,
    },
  });

  return updatedPromotion;
};

const deletePromotion = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const promotion = await prisma.vendorPromotion.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!promotion)
    throw new ApiError(404, "Promotion not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorPromotion.delete({ where: { id } });
  } else {
    result = await prisma.vendorPromotion.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log promotion deletion activity
  await prisma.vendorActivityLog.create({
    data: {
      vendorId: promotion.store.vendor.id,
      storeId: promotion.storeId,
      action: VendorActivityActions.PROMOTION_DELETED,
      details: `Promotion ${hardDelete ? "hard deleted" : "soft deleted"}: ${promotion.name} (ID: ${promotion.id})`,
    },
  });

  return result;
};

const getStorePromotions = async (userId: string, storeId?: string) => {
  return await prisma.vendorPromotion.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      store: { vendor: { userId } },
      isDeleted: false,
    },
  });
};

const getPromotionById = async (userId: string, id: string) => {
  const promotion = await prisma.vendorPromotion.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
  });
  if (!promotion)
    throw new ApiError(404, "Promotion not found or unauthorized");
  return promotion;
};

export const MarketingService = {
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getStoreCoupons,
  getCouponById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getStorePromotions,
  getPromotionById,
};
