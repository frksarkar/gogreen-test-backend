import  httpStatus  from 'http-status';
import { Attribute } from "@prisma/client";
import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";

const createAttribute = async (payload: Attribute) => {
  const existing = await prisma.attribute.findFirst({
    where: { name: payload.name },
  });

  if (existing) throw new ApiError(httpStatus.NOT_FOUND, "Attribute already exists");

  return prisma.attribute.create({
    data: payload,
    select: {
      id:true,
      name: true,
      type: true,
      propertyType: true
    },
  });
};

const getAllAttributes = async () => {
  return prisma.attribute.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      type: true,
      propertyType: true
    },
  });
};

const getSingleAttribute = async (id: string) => {
  const attribute = await prisma.attribute.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      type: true,
      propertyType: true
    },
  });

  if (!attribute) throw new ApiError(404, "Attribute not found");

  return attribute;
};

const updateAttribute = async (id: string, payload: Attribute) => {
  const attribute = await prisma.attribute.findUnique({ where: { id } });
  if (!attribute) throw new ApiError(404, "Attribute not found");

  return prisma.attribute.update({
    where: { id },
    data: payload,
    select: {
      name: true,
      type: true,
      propertyType: true
    },
  });
};

const softDeleteAttribute = async (id: string) => {
  
  const attribute = await prisma.attribute.findUnique({
    where: { id },
  });

  if (!attribute || attribute.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Attribute not found");
  }

  
  const valueExists = await prisma.attributeValue.findFirst({
    where: {
      attributeId: id,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (valueExists) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Cannot delete attribute because it has values"
    );
  }

  
  return prisma.attribute.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

const restoreAttribute = async (id: string) => {
  await prisma.attribute.update({
    where: { id },
    data: { isDeleted: false, deletedAt: null },
  });
};
const hardDeleteAttribute = async (id: string) => {
  
  const attribute = await prisma.attribute.findUnique({
    where: { id },
  });

  if (!attribute) {
    throw new ApiError(httpStatus.NOT_FOUND, "Attribute not found");
  }

  
  const valueExists = await prisma.attributeValue.findFirst({
    where: {
      attributeId: id,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (valueExists) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Cannot delete attribute because it has values"
    );
  }

  
  const usedInCategory = await prisma.categoryProperty.findFirst({
    where: {
      attributeId: id,
      isDeleted: false,
    },
    select: { id: true },
  });

  if (usedInCategory) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Cannot delete attribute because it is used in categories"
    );
  }

  
  return prisma.attribute.delete({
    where: { id },
  });
};

export const AttributeService = {
  createAttribute,
  getAllAttributes,
  getSingleAttribute,
  updateAttribute,
  softDeleteAttribute,
  restoreAttribute,
  hardDeleteAttribute,
};
