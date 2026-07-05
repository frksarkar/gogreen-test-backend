import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const addShippingRate = async (userId: string, payload: any) => {
  const { storeId, ...rest } = payload;
  if (!storeId) throw new ApiError(400, "StoreId is required");

  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
    include: { vendor: true },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  const rate = await prisma.vendorShippingRate.create({
    data: { ...rest, storeId },
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: store.vendor.id,
    storeId,
    action: VendorActivityActions.SHIPPING_RATE_CREATED,
    details: `Shipping rate created: ${rate.id}`,
  });

  return rate;
};

const updateShippingRate = async (userId: string, id: string, payload: any) => {
  const rate = await prisma.vendorShippingRate.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!rate) throw new ApiError(404, "Shipping rate not found or unauthorized");

  const updatedRate = await prisma.vendorShippingRate.update({
    where: { id },
    data: payload,
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: rate.store.vendor.id,
    storeId: rate.storeId,
    action: VendorActivityActions.SHIPPING_RATE_UPDATED,
    details: `Shipping rate updated: ${rate.id}`,
  });

  return updatedRate;
};

const deleteShippingRate = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const rate = await prisma.vendorShippingRate.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!rate) throw new ApiError(404, "Shipping rate not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.vendorShippingRate.delete({ where: { id } });
  } else {
    result = await prisma.vendorShippingRate.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: rate.store.vendor.id,
    storeId: rate.storeId,
    action: VendorActivityActions.SHIPPING_RATE_DELETED,
    details: `Shipping rate ${hardDelete ? "hard deleted" : "soft deleted"}: ${rate.id}`,
  });

  return result;
};

const getStoreShippingRates = async (userId: string, storeId?: string) => {
  return await prisma.vendorShippingRate.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      store: { vendor: { userId } },
      isDeleted: false,
    },
  });
};

const getShippingRateById = async (userId: string, id: string) => {
  const rate = await prisma.vendorShippingRate.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
  });
  if (!rate) throw new ApiError(404, "Shipping rate not found or unauthorized");
  return rate;
};

const createShippingTemplate = async (userId: string, payload: any) => {
  const { storeId, shippingRates, ...rest } = payload;
  if (!storeId) throw new ApiError(400, "StoreId is required");

  const store = await prisma.store.findFirst({
    where: { id: storeId, vendor: { userId } },
    include: { vendor: true },
  });
  if (!store) throw new ApiError(404, "Store not found or unauthorized");

  const zonesData = shippingRates?.map((rate: any) => ({
    storeId,
    name: rate.shippingMethod,
    rate: rate.rate,
    type: "DOMESTIC",
    status: "ACTIVE",
  }));

  const result = await prisma.shippingTemplate.create({
    data: {
      ...rest,
      storeId,
      zones: zonesData ? { create: zonesData } : undefined,
    },
    include: {
      zones: {
        where: { isDeleted: false },
      },
    },
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: store.vendor.id,
    storeId,
    action: VendorActivityActions.SHIPPING_TEMPLATE_CREATED,
    details: `Shipping template created: ${result.name || result.id}`,
  });

  return {
    ...result,
    shippingRates: result.zones.map((zone) => ({
      shippingMethod: zone.name,
      rate: zone.rate,
    })),
  };
};

const updateShippingTemplate = async (
  userId: string,
  id: string,
  payload: any,
) => {
  const { shippingRates, ...rest } = payload;
  const template = await prisma.shippingTemplate.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!template)
    throw new ApiError(404, "Shipping template not found or unauthorized");

  const updateData: any = { ...rest };

  if (shippingRates) {
    updateData.zones = {
      deleteMany: {},
      create: shippingRates.map((rate: any) => ({
        storeId: template.storeId,
        name: rate.shippingMethod,
        rate: rate.rate,
        type: "DOMESTIC",
        status: "ACTIVE",
      })),
    };
  }

  const result = await prisma.shippingTemplate.update({
    where: { id },
    data: updateData,
    include: {
      zones: {
        where: { isDeleted: false },
      },
    },
  });

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: template.store.vendor.id,
    storeId: template.storeId,
    action: VendorActivityActions.SHIPPING_TEMPLATE_UPDATED,
    details: `Shipping template updated: ${template.name || template.id}`,
  });

  return {
    ...result,
    shippingRates: result.zones.map((zone) => ({
      shippingMethod: zone.name,
      rate: zone.rate,
    })),
  };
};

const deleteShippingTemplate = async (
  userId: string,
  id: string,
  hardDelete = false,
) => {
  const template = await prisma.shippingTemplate.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: { store: { include: { vendor: true } } },
  });
  if (!template)
    throw new ApiError(404, "Shipping template not found or unauthorized");

  let result;
  if (hardDelete) {
    result = await prisma.shippingTemplate.delete({ where: { id } });
  } else {
    result = await prisma.shippingTemplate.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.createVendorActivityLog({
    vendorId: template.store.vendor.id,
    storeId: template.storeId,
    action: VendorActivityActions.SHIPPING_TEMPLATE_DELETED,
    details: `Shipping template ${hardDelete ? "hard deleted" : "soft deleted"}: ${template.name || template.id}`,
  });

  return result;
};

const getShippingTemplates = async (userId: string, storeId?: string) => {
  const result = await prisma.shippingTemplate.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      store: { vendor: { userId } },
      isDeleted: false,
    },
    include: {
      zones: {
        where: { isDeleted: false },
      },
    },
  });

  return result.map((template) => ({
    ...template,
    shippingRates: template.zones.map((zone) => ({
      shippingMethod: zone.name,
      rate: zone.rate,
    })),
  }));
};

const getShippingTemplateById = async (userId: string, id: string) => {
  const template = await prisma.shippingTemplate.findFirst({
    where: { id, store: { vendor: { userId } }, isDeleted: false },
    include: {
      zones: {
        where: { isDeleted: false },
      },
    },
  });

  if (!template)
    throw new ApiError(404, "Shipping template not found or unauthorized");

  return {
    ...template,
    shippingRates: template.zones.map((zone) => ({
      shippingMethod: zone.name,
      rate: zone.rate,
    })),
  };
};

export const LogisticsService = {
  addShippingRate,
  updateShippingRate,
  deleteShippingRate,
  getStoreShippingRates,
  getShippingRateById,
  createShippingTemplate,
  updateShippingTemplate,
  deleteShippingTemplate,
  getShippingTemplates,
  getShippingTemplateById,
};
