import ApiError from "../../../errors/ApiError";
import { prisma } from "../../../shared/prisma";
import httpStatus from "http-status";
import bcryptjs from "bcryptjs";
const createNewEmployee = async (
  adminId: string,
  userId: string,
  roleId: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (!user.isVerified)
    throw new ApiError(httpStatus.BAD_REQUEST, "User not verified");
  if (!user.password)
    throw new ApiError(httpStatus.BAD_REQUEST, "User must have a password");
  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });
  if (!role) throw new ApiError(httpStatus.NOT_FOUND, "Role not found");
  if (role.isDeleted)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Role Deleted, Please restore role",
    );
  return await prisma.userRole.create({
    data: {
      user_id: userId,
      role_id: roleId,
      assigned_by: adminId,
    },
  });
};
const getAllEmployees = async () => {
  return await prisma.userRole.findMany({
    where: {
      assigned_by: {
        not: null,
      },
    },
  });
};
const deleteEmployee = async (id: string) => {
  const employee = await prisma.userRole.findUnique({
    where: {
      id,
    },
  });
  if (!employee)
    throw new ApiError(httpStatus.BAD_REQUEST, "Employee not found");
  return await prisma.userRole.delete({
    where: {
      id,
    },
  });
};
const loginEmployee = async (email: string, password: string) => {
  const employee = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!employee || !employee.password)
    throw new ApiError(httpStatus.BAD_REQUEST, "Employee not found");

  const hashedPassword = await bcryptjs.compare(
    password,
    employee.password as string,
  );
  if (!hashedPassword)
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Credentials");

  const userRole = await prisma.userRole.findFirst({
    where: {
      user_id: employee.id,
      assigned_by: {
        not: null,
      },
    },
  });
  if (!userRole)
    throw new ApiError(httpStatus.BAD_REQUEST, "Employee not found");

  return employee;
};
const getEmployeeById = async (id: string) => {
  const employee = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!employee)
    throw new ApiError(httpStatus.BAD_REQUEST, "Employee not found");
  return employee;
};
export const EmployeeService = {
  createNewEmployee,
  getAllEmployees,
  deleteEmployee,
  loginEmployee,
  getEmployeeById,
};
