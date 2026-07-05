import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const addShippingZone = async (userId: string, payload: any) => {
  const { storeId, ...rest } = payload;
  if (!storeId) throw new ApiError(400, "StoreId is required");

  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
    include: { vendor: true },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  const zone = await prisma.vendorShippingZone.create({
    data: { ...rest, storeId },
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: store.vendor.id,
    storeId,
    action: VendorActivityActions.SHIPPING_ZONE_CREATED,
    details: `Shipping zone created: ${zone.name || zone.id}`,
  });

  return zone;
};

const getStoreShippingZones = async (userId: string, storeId?: string) => {
  return await prisma.vendorShippingZone.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      store: { vendor: { userId } },
      isDeleted: false,
    },
  });
};

const getShippingZoneById = async (userId: string, id: string) => {
  const zone = await prisma.vendorShippingZone.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
  });
  if (!zone) throw new ApiError(404, "Shipping zone not found or unauthorized");
  return zone;
};

const updateShippingZone = async (userId: string, id: string, payload: any) => {
  const zone = await prisma.vendorShippingZone.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!zone) throw new ApiError(404, "Shipping zone not found or unauthorized");

  const updatedZone = await prisma.vendorShippingZone.update({
    where: { id },
    data: payload,
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: zone.store.vendor.id,
    storeId: zone.storeId,
    action: VendorActivityActions.SHIPPING_ZONE_UPDATED,
    details: `Shipping zone updated: ${zone.name || zone.id}`,
  });

  return updatedZone;
};

const deleteShippingZone = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const zone = await prisma.vendorShippingZone.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!zone) throw new ApiError(404, "Shipping zone not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorShippingZone.delete({ where: { id } });
  } else {
    result = await prisma.vendorShippingZone.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: zone.store.vendor.id,
    storeId: zone.storeId,
    action: VendorActivityActions.SHIPPING_ZONE_DELETED,
    details: `Shipping zone ${hardDelete ? "hard deleted" : "soft deleted"}: ${zone.name || zone.id}`,
  });

  return result;
};

export const ShippingZoneService = {
  addShippingZone,
  updateShippingZone,
  deleteShippingZone,
  getStoreShippingZones,
  getShippingZoneById,
};
