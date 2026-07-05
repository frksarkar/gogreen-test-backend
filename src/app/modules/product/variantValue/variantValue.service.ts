import  httpStatus  from 'http-status';
import { prisma } from "../../../shared/prisma";
import ApiError from "../../../errors/ApiError";


type CreateVariantValuePayload = {
  attributeId: string;
  variantId: string;
};

const createVariantValue = async (payload: CreateVariantValuePayload) => {
  const { attributeId, variantId } = payload;

 
  const attribute = await prisma.attribute.findUnique({
    where: { id: attributeId },
  });

  if (!attribute) {
    throw new ApiError(httpStatus.NOT_FOUND, "Attribute not found");
  }

 
  if (attribute.propertyType === "MAIN_VARIANT") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Main Variant cannot be assigned as attribute"
    );
  }
  if (attribute.propertyType !== "VARIANT") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Your Property type is no variant"
    );
  }


  const mainVariant = await prisma.attribute.findUnique({
    where: { id: variantId },
  });

  if (!mainVariant) {
    throw new ApiError(httpStatus.NOT_FOUND, "Variant not found");
  }


  if (mainVariant.propertyType !== "MAIN_VARIANT") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Variant must be of type MAIN_VARIANT"
    );
  }


  const existing = await prisma.assignVariantValue.findFirst({
    where: {
      attributeId,
      variantId,
      isDeleted: false,
    },
  });

  if (existing) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Attribute already assigned to this variant"
    );
  }


  const result = await prisma.assignVariantValue.create({
    data: {
      attributeId,
      variantId,
    },
    include: {
      attribute: {
        select: {
          id: true,
          name: true,
          type: true,
          propertyType: true,
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          propertyType: true,
        },
      },
    },
  });

  return result;
};

const getAllVariantValue = async () => {
  const variants = await prisma.attribute.findMany({
    where: {
      propertyType: "MAIN_VARIANT",
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      variantLinks: {
        where: { isDeleted: false },
        select: {
          id: true,
          attribute: {
            select: {
              id: true,
              name: true,
              type: true,
              propertyType: true,
            },
          },
        },
      },
    },
  });

  const formatted = variants.map((variant) => ({
    variant: {
      id: variant.id,
      name: variant.name,
      values: variant.variantLinks.map((link) => ({
        assignId: link.id,
        attributeId: link.attribute.id,
        name: link.attribute.name,
        type: link.attribute.type,
      })),
    },
  }));

  return formatted;
};

const getSingleVariantValue = async (id: string) => {
  const variant = await prisma.attribute.findFirst({
    where: {
      id,
      propertyType: "MAIN_VARIANT",
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      variantLinks: {
        where: { isDeleted: false },
        select: {
          attribute: {
            select: {
              id: true,
              name: true,
              values: {
                where: { isDeleted: false },
                select: {
                  id: true,
                  value: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!variant) {
    throw new ApiError(httpStatus.NOT_FOUND, "Variant not found");
  }

  const formatted = {
    variant: {
      id: variant.id,
      name: variant.name,
      values: variant.variantLinks.flatMap((link) =>
        link.attribute.values.map((val) => ({
          id: val.id,
          name: val.value,
        }))
      ),
    },
  };

  return formatted;
};

type UpdateVariantValuePayload = {
  attributeId?: string;
  variantId?: string;
};

const updateVariantValue = async (
  id: string,
  payload: UpdateVariantValuePayload
) => {

  // 1️⃣ Check existing relation
  const existing = await prisma.assignVariantValue.findFirst({
    where: { id },
  });

  if (!existing || existing.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Variant assignment not found");
  }

  const attributeId = payload.attributeId ?? existing.attributeId;
  const variantId = payload.variantId ?? existing.variantId;

  // 2️⃣ Validate attribute
  const attribute = await prisma.attribute.findUnique({
    where: { id: attributeId },
  });

  if (!attribute) {
    throw new ApiError(httpStatus.NOT_FOUND, "Attribute not found");
  }

  if (attribute.propertyType !== "VARIANT") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Attribute must be of type VARIANT"
    );
  }

  // 3️⃣ Validate variant
  const variant = await prisma.attribute.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new ApiError(httpStatus.NOT_FOUND, "Variant not found");
  }

  if (variant.propertyType !== "MAIN_VARIANT") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Variant must be of type MAIN_VARIANT"
    );
  }

  // 4️⃣ Prevent duplicate relation
  const duplicate = await prisma.assignVariantValue.findFirst({
    where: {
      attributeId,
      variantId,
      id: { not: id },
      isDeleted: false,
    },
  });

  if (duplicate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Attribute already assigned to this variant"
    );
  }

  // 5️⃣ Update
  const updated = await prisma.assignVariantValue.update({
    where: { id },
    data: {
      attributeId,
      variantId,
    },
    include: {
      attribute: {
        select: {
          id: true,
          name: true,
          type: true,
          propertyType: true,
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          propertyType: true,
        },
      },
    },
  });

  return updated;
};

const softDeleteVariantValue = async (id: string) => {
  const existing = await prisma.assignVariantValue.findFirst({
    where: { id },
  });

  if (!existing || existing.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, "Variant assignment not found");
  }

  return prisma.assignVariantValue.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });
};

const restoreVariantValue = async (id: string) => {
  const existing = await prisma.assignVariantValue.findFirst({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Variant assignment not found");
  }

  if (!existing.isDeleted) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Variant assignment is not deleted"
    );
  }

  return prisma.assignVariantValue.update({
    where: { id },
    data: {
      isDeleted: false,
    },
  });
};

const hardDeleteVariantValue = async (id: string) => {
  const existing = await prisma.assignVariantValue.findFirst({
    where: { id },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Variant assignment not found");
  }

  await prisma.assignVariantValue.delete({
    where: { id },
  });

  return {
    message: "Variant assignment permanently deleted",
  };
};

export const VariantValueService = {
  createVariantValue,
  getAllVariantValue,
  getSingleVariantValue,
  updateVariantValue,
  softDeleteVariantValue,
  restoreVariantValue,
  hardDeleteVariantValue,
};