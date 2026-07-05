import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import httpStatus from "http-status";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const getVendorCommission = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const commission = await prisma.vendorCommission.findUnique({
    where: { vendorId: vendor.id },
  });

  // If no custom commission exists, return default/global commission
  if (!commission) {
    return {
      vendorId: vendor.id,
      commissionRate: 10.0, // Default global commission rate
      isGlobal: true,
    };
  }

  return commission;
};

const createOrUpdateVendorCommission = async (
  userId: string,
  payload: { commissionRate: number; isGlobal?: boolean },
) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  if (payload.commissionRate < 0 || payload.commissionRate > 100) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Commission rate must be between 0 and 100",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const commission = await tx.vendorCommission.upsert({
      where: { vendorId: vendor.id },
      update: {
        commissionRate: payload.commissionRate,
        isGlobal: payload.isGlobal ?? false,
      },
      create: {
        vendorId: vendor.id,
        commissionRate: payload.commissionRate,
        isGlobal: payload.isGlobal ?? false,
      },
    });

    // Log commission update activity
    await VendorActivityService.logVendorActivity(
      vendor.id,
      undefined,
      VendorActivityActions.COMMISSION_UPDATED,
      `Commission rate set to ${payload.commissionRate}%`,
    );

    return commission;
  });

  return result;
};

const deleteVendorCommission = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const commission = await prisma.vendorCommission.findUnique({
    where: { vendorId: vendor.id },
  });

  if (!commission) {
    throw new ApiError(404, "No custom commission found for this vendor");
  }

  const result = await prisma.$transaction(async (tx) => {
    const deletedCommission = await tx.vendorCommission.delete({
      where: { vendorId: vendor.id },
    });

    // Log commission deletion activity
    await VendorActivityService.logVendorActivity(
      vendor.id,
      undefined,
      VendorActivityActions.COMMISSION_DELETED,
      "Custom commission rate removed, vendor will use global rate",
    );

    return deletedCommission;
  });

  return result;
};

// Admin functions
const getAllVendorCommissions = async () => {
  const commissions = await prisma.vendorCommission.findMany({
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return commissions;
};

const getVendorCommissionById = async (vendorId: string) => {
  const commission = await prisma.vendorCommission.findUnique({
    where: { vendorId },
    include: {
      vendor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!commission) {
    // Return default commission structure if not found
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!vendor) throw new ApiError(404, "Vendor not found");

    return {
      vendorId,
      commissionRate: 10.0,
      isGlobal: true,
      vendor,
    };
  }

  return commission;
};

const updateVendorCommissionByAdmin = async (
  vendorId: string,
  payload: { commissionRate: number; isGlobal?: boolean },
) => {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  if (payload.commissionRate < 0 || payload.commissionRate > 100) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Commission rate must be between 0 and 100",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const commission = await tx.vendorCommission.upsert({
      where: { vendorId },
      update: {
        commissionRate: payload.commissionRate,
        isGlobal: payload.isGlobal ?? false,
      },
      create: {
        vendorId,
        commissionRate: payload.commissionRate,
        isGlobal: payload.isGlobal ?? false,
      },
    });

    // Log commission update activity
    await VendorActivityService.logVendorActivity(
      vendorId,
      undefined,
      VendorActivityActions.COMMISSION_UPDATED,
      `Admin updated commission rate to ${payload.commissionRate}%`,
    );

    return commission;
  });

  return result;
};

const deleteVendorCommissionByAdmin = async (vendorId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const commission = await prisma.vendorCommission.findUnique({
    where: { vendorId },
  });

  if (!commission) {
    throw new ApiError(404, "No custom commission found for this vendor");
  }

  const result = await prisma.$transaction(async (tx) => {
    const deletedCommission = await tx.vendorCommission.delete({
      where: { vendorId },
    });

    // Log commission deletion activity
    await VendorActivityService.logVendorActivity(
      vendorId,
      undefined,
      VendorActivityActions.COMMISSION_DELETED,
      "Admin removed custom commission rate",
    );

    return deletedCommission;
  });

  return result;
};

export const CommissionService = {
  getVendorCommission,
  createOrUpdateVendorCommission,
  deleteVendorCommission,
  getAllVendorCommissions,
  getVendorCommissionById,
  updateVendorCommissionByAdmin,
  deleteVendorCommissionByAdmin,
};
