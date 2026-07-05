import { Router } from "express";
import { sendSms } from "./sms.controller";

import { validateRequest } from "../../middlewares/validateRequest";
import { SmsValidation } from "./sms.validation";
const router = Router();

router.post(
    "/send-sms",
    validateRequest(SmsValidation.sendSmsSchema),
    sendSms
);

export const SmsRoutes = router;