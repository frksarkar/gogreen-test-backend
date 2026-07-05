import z from "zod";



export type ReferralJobName = "referral-chain";

const registerSchema = z.object({
  input: z.string(),
});

const loginSchema = z.object({
  email: z.string(),
  password: z.string().min(8).max(36),
});

const addPasswordSchema = z.object({
  password: z.string().min(8).max(36),
});

const forgetPasswordSchema = z.object({
  email: z.email(),
});
const generateResetTokenSchema = z.object({
  email: z.email(),
  otp: z.number(),
});
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(36),
});

export const AuthSchema = {
  registerSchema,
  loginSchema,
  addPasswordSchema,
  forgetPasswordSchema,
  generateResetTokenSchema,
  resetPasswordSchema,
};
