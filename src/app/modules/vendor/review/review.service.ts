import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";
import { RankService } from "../analytics/rank.service";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const createStoreReview = async (
  userId: string,
  storeId: string,
  payload: any,
) => {
  return await prisma.$transaction(async (tx) => {
    const review = await tx.vendorReview.create({
      data: { ...payload, userId, storeId },
    });

    // Get store to get vendorId for activity logging
    const store = await tx.store.findUnique({
      where: { id: storeId },
      select: { vendorId: true, shopName: true },
    });

    if (store) {
      // Log activity
      await VendorActivityService.createVendorActivityLog({
        vendorId: store.vendorId,
        storeId: storeId,
        action: VendorActivityActions.REVIEW_CREATED,
        details: `New ${payload.rating} star review received for store: ${store.shopName || storeId}`,
      });

      // Grant XP for positive reviews (4 or 5 stars)
      if (payload.rating >= 4) {
        await RankService.grantExperienceInternal(
          tx,
          store.vendorId,
          50, // XP amount for review
          "REVIEW",
          `Received ${payload.rating} star review from customer`,
        );
      }
    }

    return review;
  });
};

const getStoreReviews = async (storeId: string) => {
  return await prisma.vendorReview.findMany({
    where: { storeId, isDeleted: false },
    include: {
      user: {
        select: { name: true, profile_photo: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getReviewById = async (id: string) => {
  const review = await prisma.vendorReview.findFirst({
    where: { id, isDeleted: false },
    include: {
      user: {
        select: { name: true, profile_photo: true },
      },
    },
  });
  if (!review) throw new ApiError(404, "Review not found");
  return review;
};

const updateStoreReview = async (userId: string, id: string, payload: any) => {
  const review = await prisma.vendorReview.findFirst({
    where: { id, userId, isDeleted: false },
    include: {
      store: { select: { vendorId: true, shopName: true } },
    },
  });
  if (!review) throw new ApiError(404, "Review not found or unauthorized");

  const updatedReview = await prisma.vendorReview.update({
    where: { id },
    data: payload,
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    review.store.vendorId,
    review.storeId,
    VendorActivityActions.REVIEW_UPDATED,
    `Review updated for store: ${review.store.shopName || review.storeId} - Changes: ${JSON.stringify(Object.keys(payload))}`,
  );

  return updatedReview;
};

const deleteStoreReview = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const review = await prisma.vendorReview.findFirst({
    where: { id, userId, isDeleted: false },
    include: {
      store: { select: { vendorId: true, shopName: true } },
    },
  });
  if (!review) throw new ApiError(404, "Review not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorReview.delete({
      where: { id },
    });
  } else {
    result = await prisma.vendorReview.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.logVendorActivity(
    review.store.vendorId,
    review.storeId,
    VendorActivityActions.REVIEW_DELETED,
    `${hardDelete ? "Permanently deleted" : "Removed"} review for store: ${review.store.shopName || review.storeId}`,
  );

  return result;
};

export const ReviewService = {
  createStoreReview,
  getStoreReviews,
  getReviewById,
  updateStoreReview,
  deleteStoreReview,
};
