import { prisma } from "../../../shared/prisma";
import { deleteImgFromCloudinary } from "../../../config/cloudinary.config";
import ApiError from "../../../errors/ApiError";
import { DocumentStatus } from "@prisma/client";
import {
  VendorActivityService,
  VendorActivityActions,
} from "../activity/activity.service";

const uploadDocument = async (userId: string, payload: any) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const document = await prisma.vendorDocument.create({
    data: { ...payload, vendorId: vendor.id },
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    vendor.id,
    undefined,
    VendorActivityActions.DOCUMENT_UPLOADED,
    `Uploaded document: ${payload.documentType || "Unknown type"} - ${payload.title || "Untitled"}`,
  );

  return document;
};

const getVendorDocuments = async (userId: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  return await prisma.vendorDocument.findMany({
    where: { vendorId: vendor.id, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
};

const getDocumentById = async (userId: string, id: string) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const document = await prisma.vendorDocument.findFirst({
    where: { id, vendorId: vendor.id, isDeleted: false },
  });
  if (!document) throw new ApiError(404, "Document not found or unauthorized");
  return document;
};

const deleteVendorDocument = async (
  userId: string,
  documentId: string,
  hardDelete = false,
) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const document = await prisma.vendorDocument.findFirst({
    where: { id: documentId, vendorId: vendor.id, isDeleted: false },
  });
  if (!document) throw new ApiError(404, "Document not found");

  let result;
  if (hardDelete) {
    if (document.fileUrl) {
      await deleteImgFromCloudinary(document.fileUrl);
    }
    result = await prisma.vendorDocument.delete({
      where: { id: documentId, vendorId: vendor.id },
    });
  } else {
    result = await prisma.vendorDocument.update({
      where: { id: documentId },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  // Log activity
  await VendorActivityService.logVendorActivity(
    vendor.id,
    undefined,
    VendorActivityActions.DOCUMENT_DELETED,
    `${hardDelete ? "Permanently deleted" : "Removed"} document: ${document.documentType || "Unknown"}`,
  );

  return result;
};

const updateVendorDocument = async (
  userId: string,
  id: string,
  payload: any,
) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId } });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  const document = await prisma.vendorDocument.findFirst({
    where: { id, vendorId: vendor.id, isDeleted: false },
  });
  if (!document) throw new ApiError(404, "Document not found or unauthorized");

  const updatedDocument = await prisma.vendorDocument.update({
    where: { id },
    data: payload,
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    vendor.id,
    undefined,
    VendorActivityActions.DOCUMENT_UPDATED,
    `Updated document: ${document.documentType || "Unknown"} - Changes: ${JSON.stringify(Object.keys(payload))}`,
  );

  return updatedDocument;
};

// Admin Access
const getAllDocuments = async () => {
  return await prisma.vendorDocument.findMany({
    where: { isDeleted: false },
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

const updateDocumentStatus = async (
  id: string,
  payload: { status: DocumentStatus },
) => {
  const document = await prisma.vendorDocument.findUnique({
    where: { id },
  });
  if (!document) throw new ApiError(404, "Document not found");

  const updatedDocument = await prisma.vendorDocument.update({
    where: { id },
    data: { status: payload.status },
  });

  // Log activity
  await VendorActivityService.logVendorActivity(
    document.vendorId,
    undefined,
    VendorActivityActions.DOCUMENT_STATUS_CHANGED,
    `Document status changed to: ${payload.status}`,
  );

  return updatedDocument;
};

export const ComplianceService = {
  uploadDocument,
  getVendorDocuments,
  getDocumentById,
  deleteVendorDocument,
  updateVendorDocument,
  getAllDocuments,
  updateDocumentStatus,
};
