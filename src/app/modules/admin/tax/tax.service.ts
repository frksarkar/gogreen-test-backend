import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import httpStatus from "http-status";
const createTax = async (data: any) => {
  const taxExists = await prisma.tax.findMany();

  if (taxExists.length > 0)
    throw new ApiError(httpStatus.BAD_REQUEST, "A Tax already exists");
  const tax = await prisma.tax.create({
    data,
  });
  return tax;
};
const getTax = async (id: string) => {
  return await prisma.tax.findUnique({
    where: { id },
  });
};
const updateTax = async (id: string, data: any) => {
  const tax = await prisma.tax.findUnique({
    where: { id },
  });
  if (!tax) throw new ApiError(httpStatus.BAD_REQUEST, "Tax not found");
  return await prisma.tax.update({
    where: {
      id,
    },
    data: {
      ...data,
    },
  });
};
const deleteTax = async (id: string) => {
  const tax = await prisma.tax.findUnique({
    where: { id },
  });
  if (!tax) throw new ApiError(httpStatus.BAD_REQUEST, "Tax not found");
  return await prisma.tax.delete({
    where: {
      id,
    },
  });
};
const getAllTax = async () => {
  return await prisma.tax.findMany();
};
export const TaxService = {
  createTax,
  getTax,
  updateTax,
  deleteTax,
  getAllTax,
};
