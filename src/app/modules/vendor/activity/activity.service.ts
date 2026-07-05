import { prisma } from "../../../shared/prisma";
import { Request } from "express";

export interface CreateActivityLogParams {
  vendorId: string;
  storeId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

const createVendorActivityLog = async (params: CreateActivityLogParams) => {
  return await prisma.vendorActivityLog.create({
    data: {
      vendorId: params.vendorId,
      storeId: params.storeId,
      action: params.action,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
};

const logVendorActivity = async (
  vendorId: string,
  storeId: string | undefined,
  action: string,
  details: string | undefined,
  req?: Request,
) => {
  const ipAddress = req?.ip || req?.socket?.remoteAddress;
  const userAgent = req?.headers["user-agent"];

  return await createVendorActivityLog({
    vendorId,
    storeId,
    action,
    details,
    ipAddress,
    userAgent,
  });
};

const getVendorActivityLogs = async (
  vendorId: string,
  storeId?: string,
  limit: number = 50,
) => {
  return await prisma.vendorActivityLog.findMany({
    where: {
      vendorId,
      ...(storeId ? { storeId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      store: { select: { shopName: true } },
    },
  });
};

export const VendorActivityActions = {
  // Profile actions
  PROFILE_CREATED: "PROFILE_CREATED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  PROFILE_DELETED: "PROFILE_DELETED",
  STATUS_UPDATED: "STATUS_UPDATED",

  // Store actions
  STORE_CREATED: "STORE_CREATED",
  STORE_UPDATED: "STORE_UPDATED",
  STORE_DELETED: "STORE_DELETED",

  // Product actions
  PRODUCT_CREATED: "PRODUCT_CREATED",
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  PRODUCT_DELETED: "PRODUCT_DELETED",

  // Order actions
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_UPDATED: "ORDER_UPDATED",
  ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",

  // Finance actions
  PAYOUT_REQUESTED: "PAYOUT_REQUESTED",
  PAYOUT_UPDATED: "PAYOUT_UPDATED",
  PAYOUT_DELETED: "PAYOUT_DELETED",
  PAYOUT_STATUS_CHANGED: "PAYOUT_STATUS_CHANGED",
  PAYOUT_METHOD_ADDED: "PAYOUT_METHOD_ADDED",
  PAYOUT_METHOD_UPDATED: "PAYOUT_METHOD_UPDATED",
  PAYOUT_METHOD_DELETED: "PAYOUT_METHOD_DELETED",
  TRANSACTION_CREATED: "TRANSACTION_CREATED",

  // Marketing actions
  COUPON_CREATED: "COUPON_CREATED",
  COUPON_UPDATED: "COUPON_UPDATED",
  COUPON_DELETED: "COUPON_DELETED",
  PROMOTION_CREATED: "PROMOTION_CREATED",
  PROMOTION_UPDATED: "PROMOTION_UPDATED",
  PROMOTION_DELETED: "PROMOTION_DELETED",

  // Staff actions
  STAFF_ADDED: "STAFF_ADDED",
  STAFF_UPDATED: "STAFF_UPDATED",
  STAFF_REMOVED: "STAFF_REMOVED",

  // Compliance actions
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_UPDATED: "DOCUMENT_UPDATED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
  DOCUMENT_STATUS_CHANGED: "DOCUMENT_STATUS_CHANGED",

  // Support actions
  TICKET_CREATED: "TICKET_CREATED",
  TICKET_UPDATED: "TICKET_UPDATED",
  TICKET_DELETED: "TICKET_DELETED",

  // Review actions
  REVIEW_CREATED: "REVIEW_CREATED",
  REVIEW_UPDATED: "REVIEW_UPDATED",
  REVIEW_DELETED: "REVIEW_DELETED",

  // Social actions
  SOCIAL_UPDATED: "SOCIAL_UPDATED",
  SOCIAL_DELETED: "SOCIAL_DELETED",

  // Policy actions
  POLICY_CREATED: "POLICY_CREATED",
  POLICY_UPDATED: "POLICY_UPDATED",
  POLICY_DELETED: "POLICY_DELETED",

  // Shipping actions
  SHIPPING_ZONE_CREATED: "SHIPPING_ZONE_CREATED",
  SHIPPING_ZONE_UPDATED: "SHIPPING_ZONE_UPDATED",
  SHIPPING_ZONE_DELETED: "SHIPPING_ZONE_DELETED",
  SHIPPING_RATE_CREATED: "SHIPPING_RATE_CREATED",
  SHIPPING_RATE_UPDATED: "SHIPPING_RATE_UPDATED",
  SHIPPING_RATE_DELETED: "SHIPPING_RATE_DELETED",
  SHIPPING_TEMPLATE_CREATED: "SHIPPING_TEMPLATE_CREATED",
  SHIPPING_TEMPLATE_UPDATED: "SHIPPING_TEMPLATE_UPDATED",
  SHIPPING_TEMPLATE_DELETED: "SHIPPING_TEMPLATE_DELETED",

  // Holiday actions
  HOLIDAY_CREATED: "HOLIDAY_CREATED",
  HOLIDAY_UPDATED: "HOLIDAY_UPDATED",
  HOLIDAY_DELETED: "HOLIDAY_DELETED",

  // Follower actions
  FOLLOWER_ADDED: "FOLLOWER_ADDED",
  FOLLOWER_REMOVED: "FOLLOWER_REMOVED",

  // Rank actions
  RANK_UPGRADE: "RANK_UPGRADE",
  EXPERIENCE_GRANTED: "EXPERIENCE_GRANTED",

  // Commission actions
  COMMISSION_UPDATED: "COMMISSION_UPDATED",
  COMMISSION_DELETED: "COMMISSION_DELETED",

  // Usage actions
  USAGE_LIMIT_UPDATED: "USAGE_LIMIT_UPDATED",
  USAGE_COUNTER_UPDATED: "USAGE_COUNTER_UPDATED",

  // Login/Security actions
  LOGIN: "LOGIN",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  SETTINGS_UPDATED: "SETTINGS_UPDATED",
};

export const VendorActivityService = {
  createVendorActivityLog,
  logVendorActivity,
  getVendorActivityLogs,
  VendorActivityActions,
};
