import z from "zod";

const createNewEmployeeSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
});
const loginEmployeeSchema = z.object({
  email: z.string(),
  password: z.string(),
});
export const EmployeeZodValidation = {
  createNewEmployeeSchema,
  loginEmployeeSchema,
};
