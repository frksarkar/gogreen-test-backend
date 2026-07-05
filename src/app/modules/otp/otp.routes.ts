import { Router } from "express";
import { OTPController } from "./otp.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { OTPSchema } from "./otp.validation";

const router = Router();

router.post(
  "/send",
  validateRequest(OTPSchema.sendOTPSchema),
  OTPController.sendOTP,
);
router.post(
  "/verify",
  validateRequest(OTPSchema.verifyOTPSchema),
  OTPController.verifyOTP,
);

export const OTPRouter = router;
