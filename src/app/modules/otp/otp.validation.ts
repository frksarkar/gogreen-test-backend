import z from "zod";

const sendOTPSchema = z.object({
  email: z.email(),
});
const verifyOTPSchema = z.object({
  email: z.email(),
  otp: z.number(),
});
export const OTPSchema = {
  sendOTPSchema,
  verifyOTPSchema,
};
