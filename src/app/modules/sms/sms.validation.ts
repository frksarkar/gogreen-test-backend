import { z } from "zod";

const phoneRegex = /^(\+88|0088|88)?01[3-9]\d{8}$/;
const sendSmsSchema = z.object({
    phoneNumber: z.string().regex(phoneRegex, "Invalid phone number"),
    messageBody: z.string(),
    customCsmsId: z.string().optional(),
});
export const SmsValidation = {
    sendSmsSchema,
};