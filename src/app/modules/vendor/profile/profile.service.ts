import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import { deleteImgFromCloudinary } from "../../../config/cloudinary.config";
import { generateSlug } from "../../../utils/generateSlug";
import { VendorStatus } from "@prisma/client";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const createVendor = async (userId: string, payload: any) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  const existingVendor = await prisma.vendor.findUnique({ where: { userId } });
  if (existingVendor) throw new ApiError(400, "User is already a vendor");

  const {
    shopName,
    shopDescription,
    phone,
    email,
    address,
    shopLogo,
    shopBanner,
    ...rest
  } = payload;
  const slug = await generateSlug(shopName, "store");

  const result = await prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.create({
      data: {
        userId,
        ...rest,
        wallet: { create: {} },
        limits: { create: {} },
        counter: { create: {} },
      },
    });
    const role = await prisma.role.findFirst({
      where: {
        systemLevel: "VENDOR",
      },
    });
    if (!role) throw new ApiError(404, "Vendor role not found");
    await tx.userRole.create({
      data: {
        user_id: userId,
        role_id: role?.id,
      },
    });
    const store = await tx.store.create({
      data: {
        shopName,
        shopDescription,
        phone,
        email,
        address,
        shopLogo,
        shopBanner,
        vendorId: vendor.id,
        slug,
      },
    });

    // Log vendor creation activity
    await tx.vendorActivityLog.create({
      data: {
        vendorId: vendor.id,
        storeId: store.id,
        action: VendorActivityActions.PROFILE_CREATED,
        details: `Vendor profile created with store: ${store.shopName}`,
      },
    });

    return { vendor, store };
  });

  return result;
};

const getAllVendors = async () => {
  const vendor = await prisma.vendor.findMany({
    where: { isDeleted: false },
    include: {
      user: true,
      store: true,
      wallet: true,
      counter: true,
      limits: true,
    },
  });

  if (!vendor) throw new ApiError(404, "Vendor not found");
  return vendor;
};

const getAllStoreByVendor = async (vendorId: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId, isDeleted: false },
    include: {
      store: true,
      wallet: true,
      counter: true,
      limits: true,
    },
  });

  if (!vendor) throw new ApiError(404, "Vendor not found");
  return vendor;
};

const getMyVendorProfile = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({
    where: { userId, isDeleted: false },
    include: {
      user: true,
      store: true,
      wallet: true,
      counter: true,
      limits: true,
    },
  });

  if (!vendor) throw new ApiError(404, "Vendor profile not found");
  return vendor;
};

const updateVendorProfile = async (userId: string, payload: any) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  if (payload.tradeLicense && vendor.tradeLicense) {
    await deleteImgFromCloudinary(vendor.tradeLicense);
  }
  if (payload.nidCopy && vendor.nidCopy) {
    await deleteImgFromCloudinary(vendor.nidCopy);
  }

  const updatedVendor = await prisma.vendor.update({
    where: { userId },
    data: payload,
  });

  // Log vendor profile update activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: vendor.id,
    action: VendorActivityActions.PROFILE_UPDATED,
    details: `Vendor profile updated`,
  });

  return updatedVendor;
};

const deleteVendor = async (userId: string, hardDelete = false) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  if (hardDelete) {
    if (vendor.tradeLicense) await deleteImgFromCloudinary(vendor.tradeLicense);
    if (vendor.nidCopy) await deleteImgFromCloudinary(vendor.nidCopy);

    return await prisma.$transaction(async (tx) => {
      await tx.store.deleteMany({ where: { vendorId: vendor.id } });

      // Log hard delete activity before deletion
      await tx.vendorActivityLog.create({
        data: {
          vendorId: vendor.id,
          action: VendorActivityActions.PROFILE_DELETED,
          details: `Vendor profile permanently deleted (hard delete)`,
        },
      });

      return await tx.vendor.delete({ where: { userId } });
    });
  }

  const deletedAt = new Date();

  return await prisma.$transaction(async (tx) => {
    // Soft delete all stores associated with this vendor
    await tx.store.updateMany({
      where: { vendorId: vendor.id },
      data: {
        isDeleted: true,
        deletedAt,
      },
    });

    // Log soft delete activity
    await tx.vendorActivityLog.create({
      data: {
        vendorId: vendor.id,
        action: VendorActivityActions.PROFILE_DELETED,
        details: `Vendor profile soft deleted`,
      },
    });

    // Soft delete the vendor
    return await tx.vendor.update({
      where: { userId },
      data: {
        isDeleted: true,
        deletedAt,
      },
    });
  });
};

// Admin Access
const updateVendorStatus = async (id: string, payload: any) => {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const updatedVendor = await prisma.vendor.update({
    where: { id },
    data: {
      status: payload.status as VendorStatus,
    },
  });

  // Log vendor status update activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: vendor.id,
    action: VendorActivityActions.STATUS_UPDATED,
    details: `Vendor status changed to ${payload.status}`,
  });

  return updatedVendor;
};

export const ProfileService = {
  createVendor,
  getAllVendors,
  getAllStoreByVendor,
  getMyVendorProfile,
  updateVendorProfile,
  deleteVendor,
  updateVendorStatus,
};
