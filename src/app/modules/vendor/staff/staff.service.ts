import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const addVendorStaff = async (
  userId: string,
  storeId: string,
  staffEmail: string,
  role: string,
) => {
  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  const staffUser = await prisma.user.findUnique({
    where: { email: staffEmail },
  });
  if (!staffUser) throw new ApiError(404, "User with this email not found");

  const staff = await prisma.vendorStaff.create({
    data: {
      vendorId: store.vendorId,
      storeId: store.id,
      userId: staffUser.id,
      role,
    },
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    store.vendorId,
    store.id,
    VendorActivityActions.STAFF_ADDED,
    `Added staff member ${staffUser.name} (${staffUser.email}) with role: ${role}`,
  );

  return staff;
};

const getVendorStaff = async (userId: string, storeId?: string) => {
  return await prisma.vendorStaff.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      store: { vendor: { userId } },
      isDeleted: false,
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      store: { select: { shopName: true } },
    },
  });
};

const getStaffById = async (userId: string, id: string) => {
  const staff = await prisma.vendorStaff.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      store: { select: { shopName: true } },
    },
  });
  if (!staff) throw new ApiError(404, "Staff member not found or unauthorized");
  return staff;
};

const updateVendorStaff = async (
  userId: string,
  id: string,
  updateData: { role?: string },
) => {
  const staff = await prisma.vendorStaff.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: {
      user: { select: { name: true, email: true } },
      store: { select: { vendorId: true } },
    },
  });
  if (!staff) throw new ApiError(404, "Staff member not found or unauthorized");

  const updatedStaff = await prisma.vendorStaff.update({
    where: { id },
    data: updateData,
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    staff.store.vendorId,
    staff.storeId,
    VendorActivityActions.STAFF_UPDATED,
    `Updated staff member ${staff.user.name} (${staff.user.email}): ${JSON.stringify(updateData)}`,
  );

  return updatedStaff;
};

const removeVendorStaff = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const staff = await prisma.vendorStaff.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: {
      user: { select: { name: true, email: true } },
      store: { select: { vendorId: true } },
    },
  });
  if (!staff) throw new ApiError(404, "Staff member not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorStaff.delete({ where: { id } });
  } else {
    result = await prisma.vendorStaff.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.logVendorActivity(
    staff.store.vendorId,
    staff.storeId,
    VendorActivityActions.STAFF_REMOVED,
    `${hardDelete ? "Permanently deleted" : "Removed"} staff member ${staff.user.name} (${staff.user.email})`,
  );

  return result;
};

export const StaffService = {
  addVendorStaff,
  getVendorStaff,
  getStaffById,
  updateVendorStaff,
  removeVendorStaff,
};
