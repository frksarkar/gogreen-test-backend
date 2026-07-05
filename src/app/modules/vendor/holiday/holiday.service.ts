import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const createVendorHoliday = async (userId: string, payload: any) => {
  const { storeId, ...rest } = payload;
  if (!storeId) throw new ApiError(400, "StoreId is required");

  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
    include: { vendor: true },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  // Validate date range
  if (new Date(rest.startDate) >= new Date(rest.endDate)) {
    throw new ApiError(400, "Start date must be before end date");
  }

  const holiday = await prisma.vendorHoliday.create({
    data: { ...rest, storeId },
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: store.vendor.id,
    storeId,
    action: VendorActivityActions.HOLIDAY_CREATED,
    details: `Holiday created: ${holiday.startDate.toISOString().split("T")[0]} to ${holiday.endDate.toISOString().split("T")[0]}`,
  });

  return holiday;
};

const getStoreHolidays = async (userId: string, storeId?: string) => {
  return await prisma.vendorHoliday.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      store: { vendor: { userId } },
      isDeleted: false,
    },
    orderBy: { startDate: "asc" },
  });
};

const getHolidayById = async (userId: string, id: string) => {
  const holiday = await prisma.vendorHoliday.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
  });
  if (!holiday) throw new ApiError(404, "Holiday not found or unauthorized");
  return holiday;
};

const updateVendorHoliday = async (
  userId: string,
  id: string,
  payload: any,
) => {
  const holiday = await prisma.vendorHoliday.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!holiday) throw new ApiError(404, "Holiday not found or unauthorized");

  // Validate date range if dates are being updated
  const finalStartDate = payload.startDate
    ? new Date(payload.startDate)
    : holiday.startDate;
  const finalEndDate = payload.endDate
    ? new Date(payload.endDate)
    : holiday.endDate;

  if (finalStartDate >= finalEndDate) {
    throw new ApiError(400, "Start date must be before end date");
  }

  const updatedHoliday = await prisma.vendorHoliday.update({
    where: { id },
    data: payload,
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: holiday.store.vendor.id,
    storeId: holiday.storeId,
    action: VendorActivityActions.HOLIDAY_UPDATED,
    details: `Holiday updated: ${updatedHoliday.id}`,
  });

  return updatedHoliday;
};

const deleteVendorHoliday = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const holiday = await prisma.vendorHoliday.findFirst({
    where: { id, store: { vendor: { userId } } },
    include: { store: { include: { vendor: true } } },
  });
  if (!holiday) throw new ApiError(404, "Holiday not found or unauthorized");

  if (hardDelete) {
    await prisma.vendorHoliday.delete({ where: { id } });
  } else {
    await prisma.vendorHoliday.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: holiday.store.vendor.id,
    storeId: holiday.storeId,
    action: VendorActivityActions.HOLIDAY_DELETED,
    details: `Holiday ${hardDelete ? "permanently deleted" : "soft deleted"}: ${holiday.id}`,
  });

  return {
    message: `Holiday ${hardDelete ? "permanently deleted" : "soft deleted"} successfully`,
  };
};

const getActiveStoreHolidays = async (storeId: string) => {
  const now = new Date();
  return await prisma.vendorHoliday.findMany({
    where: {
      storeId,
      isDeleted: false,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { startDate: "asc" },
  });
};

export const HolidayService = {
  createVendorHoliday,
  getStoreHolidays,
  getHolidayById,
  updateVendorHoliday,
  deleteVendorHoliday,
  getActiveStoreHolidays,
};
