/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import config from "../../config";
import catchAsync from "../../shared/catchAsync";
import { generateJwtToken } from "../../shared/generateJwtToken";
import sendResponse from "../../shared/sendResponse";
import { AuthTokens, setAuthCookie } from "../../shared/setCookie";
import { OTPService } from "./otp.service";
const sendOTP = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    await OTPService.sendOTP(email);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "OTP sent successfully!",
      data: null,
    });
  },
);
const verifyOTP = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const result = await OTPService.verifyOTP(res, email, otp);


    const accessToken = generateJwtToken(
      {
        id: result.id,
        email: result.email,
        role: result.userRoles.map((item) => item.role.systemLevel),
      },
      config.jwt.access_secret,
      // config.jwt.access_expires,
      "1d",
    );
    const refreshToken = generateJwtToken(
      { id: result.id, email: result.email },
      config.jwt.refresh_secret,
      // config.jwt.refresh_expires,
      "30d",
    );
    const authTokens: AuthTokens = {
      accessToken,
      refreshToken,
    };
    setAuthCookie(res, authTokens);
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "OTP verified successfully!",
      data: null,
    });
  },
);
export const OTPController = {
  sendOTP,
  verifyOTP,
};
