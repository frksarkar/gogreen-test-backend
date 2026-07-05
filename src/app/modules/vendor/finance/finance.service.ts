import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";
import { PayoutStatus } from "@prisma/client";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const getVendorWallet = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  return await prisma.vendorWallet.findUnique({
    where: { vendorId: vendor.id },
    include: { transactions: { take: 10, orderBy: { createdAt: "desc" } } },
  });
};

const requestPayout = async (
  userId: string,
  payload: { amount: number; method: string },
) => {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: { wallet: true },
  });
  if (!vendor || !vendor.wallet)
    throw new ApiError(404, "Vendor wallet not found");

  if (vendor.wallet.currentBalance < payload.amount) {
    throw new ApiError(400, "Insufficient balance");
  }

  return await prisma.$transaction(async (tx) => {
    const payout = await tx.vendorPayout.create({
      data: {
        vendorId: vendor.id,
        amount: payload.amount,
        method: payload.method,
        status: "PENDING",
      },
    });

    await tx.vendorWallet.update({
      where: { vendorId: vendor.id },
      data: {
        currentBalance: { decrement: payload.amount },
        pendingBalance: { increment: payload.amount },
      },
    });

    // Log payout request activity
    await tx.vendorActivityLog.create({
      data: {
        vendorId: vendor.id,
        action: VendorActivityActions.PAYOUT_REQUESTED,
        details: `Payout requested: ${payload.amount} via ${payload.method}`,
      },
    });

    return payout;
  });
};

const getVendorPayouts = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  return await prisma.vendorPayout.findMany({
    where: { vendorId: vendor.id, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
};

const getPayoutById = async (userId: string, id: string) => {
  const payout = await prisma.vendorPayout.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
  });
  if (!payout)
    throw new ApiError(404, "Payout record not found or unauthorized");
  return payout;
};

const deleteVendorPayout = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const payout = await prisma.vendorPayout.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
  });
  if (!payout)
    throw new ApiError(404, "Payout record not found or unauthorized");

  return await prisma.$transaction(async (tx) => {
    if (payout.status === "PENDING") {
      // Refund the wallet if deleting a pending payout
      await tx.vendorWallet.update({
        where: { vendorId: payout.vendorId },
        data: {
          pendingBalance: { decrement: payout.amount },
          currentBalance: { increment: payout.amount },
        },
      });
    }

    let result;
    if (hardDelete) {
      result = await tx.vendorPayout.delete({ where: { id } });
    } else {
      result = await tx.vendorPayout.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
      });
    }

    // Log payout deletion activity
    await tx.vendorActivityLog.create({
      data: {
        vendorId: payout.vendorId,
        action: VendorActivityActions.PAYOUT_DELETED,
        details: `Payout ${hardDelete ? "hard deleted" : "soft deleted"}: ${payout.amount} (ID: ${payout.id})`,
      },
    });

    return result;
  });
};

const updateVendorPayout = async (
  userId: string,
  id: string,
  payload: { amount?: number; method?: string },
) => {
  const payout = await prisma.vendorPayout.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
    include: { vendor: { include: { wallet: true } } },
  });

  if (!payout)
    throw new ApiError(404, "Payout record not found or unauthorized");
  if (payout.status !== "PENDING")
    throw new ApiError(400, "Only pending payouts can be updated");

  const { amount, method } = payload;

  return await prisma.$transaction(async (tx) => {
    if (amount !== undefined && amount !== payout.amount) {
      if (!payout.vendor.wallet)
        throw new ApiError(404, "Vendor wallet not found");

      const diff = amount - payout.amount;
      if (payout.vendor.wallet.currentBalance < diff) {
        throw new ApiError(
          400,
          "Insufficient balance to increase payout amount",
        );
      }

      await tx.vendorWallet.update({
        where: { vendorId: payout.vendorId },
        data: {
          currentBalance: { decrement: diff },
          pendingBalance: { increment: diff },
        },
      });
    }

    const updatedPayout = await tx.vendorPayout.update({
      where: { id },
      data: { amount, method },
    });

    // Log payout update activity
    await tx.vendorActivityLog.create({
      data: {
        vendorId: payout.vendorId,
        action: VendorActivityActions.PAYOUT_UPDATED,
        details: `Payout updated: ${payout.amount} → ${amount || payout.amount}, method: ${method || payout.method} (ID: ${payout.id})`,
      },
    });

    return updatedPayout;
  });
};

const getVendorTransactions = async (userId: string, storeId?: string) => {
  return await prisma.vendorTransaction.findMany({
    where: {
      vendor: { userId },
      ...(storeId ? { storeId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      store: { select: { shopName: true } },
    },
  });
};

const addVendorPayoutMethod = async (userId: string, payload: any) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const payoutMethod = await prisma.vendorPayoutMethod.create({
    data: { ...payload, vendorId: vendor.id },
  });

  // Log payout method addition activity
  await prisma.vendorActivityLog.create({
    data: {
      vendorId: vendor.id,
      action: VendorActivityActions.PAYOUT_METHOD_ADDED,
      details: `Payout method added: ${payload.method || "Unknown method"} (ID: ${payoutMethod.id})`,
    },
  });

  return payoutMethod;
};

const getVendorPayoutMethods = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  return await prisma.vendorPayoutMethod.findMany({
    where: { vendorId: vendor.id, isDeleted: false },
  });
};

const getPayoutMethodById = async (userId: string, id: string) => {
  const method = await prisma.vendorPayoutMethod.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
  });
  if (!method)
    throw new ApiError(404, "Payout method not found or unauthorized");
  return method;
};

const updateVendorPayoutMethod = async (
  userId: string,
  id: string,
  payload: any,
) => {
  const method = await prisma.vendorPayoutMethod.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
  });
  if (!method)
    throw new ApiError(404, "Payout method not found or unauthorized");

  const updatedMethod = await prisma.vendorPayoutMethod.update({
    where: { id },
    data: payload,
  });

  // Log payout method update activity
  await prisma.vendorActivityLog.create({
    data: {
      vendorId: method.vendorId,
      action: VendorActivityActions.PAYOUT_METHOD_UPDATED,
      details: `Payout method updated (ID: ${method.id})`,
    },
  });

  return updatedMethod;
};

// Admin Access
const getAllPayouts = async () => {
  return await prisma.vendorPayout.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vendor: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
};

const updatePayoutStatus = async (
  id: string,
  payload: { status: PayoutStatus; failedReason?: string },
) => {
  const payout = await prisma.vendorPayout.findUnique({
    where: { id },
  });

  if (!payout) throw new ApiError(404, "Payout record not found");
  if (payout.status !== "PENDING") {
    throw new ApiError(400, `Payout is already ${payout.status}`);
  }

  return await prisma.$transaction(async (tx) => {
    const updatedPayout = await tx.vendorPayout.update({
      where: { id },
      data: {
        status: payload.status,
        failedReason: payload.failedReason,
        processedAt: new Date(),
        ...(payload.status === "COMPLETED" ? { completedAt: new Date() } : {}),
      },
    });

    if (payload.status === "COMPLETED") {
      // Finalize the withdrawal in wallet
      await tx.vendorWallet.update({
        where: { vendorId: payout.vendorId },
        data: {
          pendingBalance: { decrement: payout.amount },
          totalWithdrawn: { increment: payout.amount },
        },
      });
    } else if (payload.status === "FAILED") {
      // Revert the amount to current balance
      await tx.vendorWallet.update({
        where: { vendorId: payout.vendorId },
        data: {
          pendingBalance: { decrement: payout.amount },
          currentBalance: { increment: payout.amount },
        },
      });
    }

    return updatedPayout;
  });
};

const deleteVendorPayoutMethod = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const payoutMethod = await prisma.vendorPayoutMethod.findFirst({
    where: { id, vendor: { userId }, isDeleted: false },
  });
  if (!payoutMethod)
    throw new ApiError(404, "Payout method not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorPayoutMethod.delete({ where: { id } });
  } else {
    result = await prisma.vendorPayoutMethod.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log payout method deletion activity
  await prisma.vendorActivityLog.create({
    data: {
      vendorId: payoutMethod.vendorId,
      action: VendorActivityActions.PAYOUT_METHOD_DELETED,
      details: `Payout method ${hardDelete ? "hard deleted" : "soft deleted"} (ID: ${payoutMethod.id})`,
    },
  });

  return result;
};

export const FinanceService = {
  getVendorWallet,
  requestPayout,
  getVendorPayouts,
  getPayoutById,
  deleteVendorPayout,
  updateVendorPayout,
  getVendorTransactions,
  addVendorPayoutMethod,
  getVendorPayoutMethods,
  getPayoutMethodById,
  updateVendorPayoutMethod,
  deleteVendorPayoutMethod,
  getAllPayouts,
  updatePayoutStatus,
};
