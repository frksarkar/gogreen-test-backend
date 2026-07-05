import { NextFunction, Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import { AuthService } from "./auth.service";
import sendResponse from "../../shared/sendResponse";
import { generateJwtToken } from "../../shared/generateJwtToken";
import ApiError from "../../errors/ApiError";
import config from "../../config";
import { AuthTokens, setAuthCookie } from "../../shared/setCookie";
import { User } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status";


const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ref } = req.query;
    const { input } = req.body;
    const { user, message } = await AuthService.register(input, ref as string);
    console.log(ref, input, user, message);
    sendResponse(res, {
      message: message,
      data: user,
      statusCode: 201,
      success: true,
    });
  },
);

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No refresh token received from the cookies",
      );
    }
    const tokenInfo = await AuthService.getNewAccessToken(refreshToken);
    setAuthCookie(res, tokenInfo);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Access Token created successfully!",
      data: tokenInfo,
      success: true,
    });
  },
);
const googleCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User;
    if (!user) {
      throw new ApiError(404, "User Not Found");
    }
    const accessToken = generateJwtToken(
      { email: user.email, id: user.id },
      config.jwt.access_secret,
      // config.jwt.access_expires,
      "1h",
    );
    const refreshToken = generateJwtToken(
      { email: user.email, id: user.id },
      config.jwt.refresh_secret,
      // config.jwt.refresh_expires,
      "30d",
    );
    const authTokens: AuthTokens = {
      accessToken,
      refreshToken,
    };
    setAuthCookie(res, authTokens);
    res.redirect(config.frontend_url);
  },
);
const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged out successfully!",
    data: null,
  });
});
const addPassword = catchAsync(async (req: Request, res: Response) => {
  const { password } = req.body;
  const { id } = req.user as JwtPayload;
  const result = await AuthService.addPassword(id as string, password);
  sendResponse(res, {
    message: "Password updated successfully",
    data: result,
    statusCode: 200,
    success: true,
  });
});

const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.login(
      email as string,
      password as string,
    );
    const tokenInfo: AuthTokens = {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
    setAuthCookie(res, tokenInfo);
    sendResponse(res, {
      message: "Login successful",
      data: user,
      statusCode: 200,
      success: true,
    });
  },
);


const forgetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    await AuthService.forgetPassword(email as string);

    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Email sent successfully!",
      data: null,
    });
  },
);


const generateResetToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;
    const { resetToken } = await AuthService.generateResetToken(
      email as string,
      otp as string,
    );
    res.cookie("resetToken", resetToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Reset token generated successfully!",
      data: null,
    });
  },
);


const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { newPassword } = req.body;
    const resetToken = req.cookies.resetToken;
    const result = await AuthService.resetPassword(
      newPassword as string,
      resetToken as string,
    );
    sendResponse(res, {
      data: result,
      message: "Password updated successfully",
      statusCode: 200,
      success: true,
    });
  },
);


export const AuthController = {
  register,
  googleCallback,
  logout,
  login,
  addPassword,
  forgetPassword,
  generateResetToken,
  resetPassword,
  getNewAccessToken,
};
