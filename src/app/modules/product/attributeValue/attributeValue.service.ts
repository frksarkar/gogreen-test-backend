import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";
import  httpStatus  from 'http-status';
type UpdateAttributeValue = {
  value?: string;
  attributeId?: string;
};

const createValue = async (payload: any) => {
  const attribute = await prisma.attribute.findUnique({
    where: { id: payload.attributeId },
  });

  if (!attribute) throw new ApiError(httpStatus.NOT_FOUND, "Attribute not found");

  const existing = await prisma.attributeValue.findFirst({
    where: { value: payload.value },
  });

  if (existing) throw new ApiError(httpStatus.NOT_FOUND, "Attribute Value already exists");

  return prisma.attributeValue.create({
    data: payload,
    select: {
      attributeId: true,
      value: true,
    },
  });
};

const getAllValues = async () => {
  return prisma.attribute.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      values: {
        select: {
          id: true,
          value: true,
        },
      },
    },
  });
};

const getSingleValue = async (id: string) => {
  const value = await prisma.attributeValue.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: {
      id: true,
      value: true,
    },
  });
  if (!value) throw new ApiError(httpStatus.NOT_FOUND, "Attribute value not found");
  return value;
};

const updateValue = async (id: string, payload: UpdateAttributeValue) => {
  const existingValue = await prisma.attributeValue.findUnique({
    where: { id },
  });

  if (!existingValue || existingValue.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Attribute value not found");
  }

  // If attributeId is being updated → validate it exists
  if (payload.attributeId) {
    const attribute = await prisma.attribute.findUnique({
      where: { id: payload.attributeId },
    });

    if (!attribute) {
      throw new ApiError(httpStatus.NOT_FOUND, "New attribute not found");
    }
  }

  // Prevent duplicate value under same attribute
  if (payload.value) {
    const duplicate = await prisma.attributeValue.findFirst({
      where: {
        value: payload.value,
        attributeId: payload.attributeId || existingValue.attributeId,
        NOT: { id },
      },
    });

    if (duplicate) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Attribute value already exists for this attribute",
      );
    }
  }

  return prisma.attributeValue.update({
    where: { id },
    data: payload,
    select: {
      id: true,
      attributeId: true,
      value: true,
    },
  });
};

const softDeleteValue = async (id: string) => {
  await prisma.attributeValue.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const restoreValue = async (id: string) => {
  await prisma.attributeValue.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  });
};
const hardDeleteAttributeValue = async (id: string) => {
  const value = await prisma.attributeValue.findUnique({
    where: { id },
  });

  if (!value) {
    throw new ApiError(httpStatus.NOT_FOUND, "Attribute value not found");
  }

  // Check if this value is used in variants
  const usedInVariant = await prisma.selectPropertyValue.findFirst({
    where: {
      attributeValueId: id,
    },
  });

  if (usedInVariant) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Cannot delete attribute value because it is used in product variants",
    );
  }

  await prisma.attributeValue.delete({
    where: { id },
  });

  return null;
};

export const AttributeValueService = {
  createValue,
  getAllValues,
  getSingleValue,
  updateValue,
  softDeleteValue,
  restoreValue,
  hardDeleteAttributeValue,
};

