import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const createVendorPolicy = async (userId: string, payload: any) => {
  const { storeId, ...rest } = payload;
  if (!storeId) throw new ApiError(400, "StoreId is required");

  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
    include: { vendor: true },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  const policy = await prisma.vendorPolicy.create({
    data: { ...rest, storeId },
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: store.vendor.id,
    storeId,
    action: VendorActivityActions.POLICY_CREATED,
    details: `Policy created: ${policy.type || policy.id}`,
  });

  return policy;
};

const updateVendorPolicy = async (userId: string, id: string, payload: any) => {
  const policy = await prisma.vendorPolicy.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!policy) throw new ApiError(404, "Policy not found or unauthorized");

  const updatedPolicy = await prisma.vendorPolicy.update({
    where: { id },
    data: payload,
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: policy.store.vendor.id,
    storeId: policy.storeId,
    action: VendorActivityActions.POLICY_UPDATED,
    details: `Policy updated: ${policy.type || policy.id}`,
  });

  return updatedPolicy;
};

const deleteVendorPolicy = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const policy = await prisma.vendorPolicy.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!policy) throw new ApiError(404, "Policy not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorPolicy.delete({ where: { id } });
  } else {
    result = await prisma.vendorPolicy.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: policy.store.vendor.id,
    storeId: policy.storeId,
    action: VendorActivityActions.POLICY_DELETED,
    details: `Policy ${hardDelete ? "hard deleted" : "soft deleted"}: ${policy.type || policy.id}`,
  });

  return result;
};

const getStorePolicies = async (userId: string, storeId?: string) => {
  return await prisma.vendorPolicy.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      store: { vendor: { userId } },
      isDeleted: false,
    },
  });
};

const getPolicyById = async (userId: string, id: string) => {
  const policy = await prisma.vendorPolicy.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
  });
  if (!policy) throw new ApiError(404, "Policy not found or unauthorized");
  return policy;
};

export const PoliciesService = {
  createVendorPolicy,
  updateVendorPolicy,
  deleteVendorPolicy,
  getStorePolicies,
  getPolicyById,
};
