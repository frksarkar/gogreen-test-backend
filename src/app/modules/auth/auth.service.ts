import bcryptjs from "bcryptjs";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import config from "../../config";
import ApiError from "../../errors/ApiError";
import { referralQueue } from "../../queues/referral.queue";
import {
  createNewAccessTokenWithRefreshToken,
  generateJwtToken,
} from "../../shared/generateJwtToken";
import { prisma } from "../../shared/prisma";
import { createReferralCode } from "../../utils/createReferralCode";
import { verifyUserOTP } from "../../utils/verifyOTP";
import { OTPService } from "../otp/otp.service";

const register = async (
  input: string,
  ref: string,
): Promise<{ user: any; message: string }> => {
  const phoneRegex = /^((\+8801|8801|01)[3-9]\d{8})$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (phoneRegex.test(input)) {
    // phone logic
    return { user: { name: null }, message: "Phone logic is yet to add" };
  }
  if (!emailRegex.test(input)) {
    return { user: null, message: "Invalid email address" };
  }

  const email = input;
  let user = await prisma.user.findUnique({
    where: { email },
  });

  // Scenario 1: User exists, just send OTP
  if (user) {
    if (user.password) {
      return { user: null, message: "Please login with password" };
    } else {
      await OTPService.sendOTP(email);
      return { user, message: "Check your email to verify OTP & Login" };
    }
  }
  const newUser = await prisma.$transaction(async (tnx) => {
    const createdUser = await tnx.user.create({
      data: {
        email,
        referral_code: createReferralCode(email),
      },
    });

    const role = await prisma.role.findFirst({
      where: {
        systemLevel: "CUSTOMER",
      },
    });
    if (!role) {
      throw new ApiError(httpStatus.NOT_FOUND, "Role not found");
    }
    await tnx.userRole.create({
      data: {
        user_id: createdUser.id,
        role_id: role.id,
      },
    });

    if (ref) {
      // await referralQueue.add("referral-chain" as const, {
      //   user_id: createdUser.id,
      //   refCode: ref,
      // });
      await referralQueue.add("referral-chain", {
        user_id: createdUser.id,
        refCode: ref,
      });
    }

    return createdUser; // Return the user object to the outer scope
  });

  // Scenario 2 Continued: Send OTP AFTER the transaction is committed
  await OTPService.sendOTP(email);

  return {
    user: newUser,
    message: "Check your email to verify OTP",
  };
};

const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken =
    await createNewAccessTokenWithRefreshToken(refreshToken);
  return { accessToken: newAccessToken };
};

const addPassword = async (id: string, password: string) => {
  const userExists = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  if (!userExists) {
    throw new ApiError(404, "User not found");
  }

  const hashedPassword = await bcryptjs.hash(
    password,
    config.bcrypt_salt_round,
  );
  return await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      password: hashedPassword,
    },
  });
};
const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      email: true,
      password: true,
      id: true,
      userRoles: {
        select: {
          role: {
            select: {
              systemLevel: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!user.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a password");
  }
  const isPasswordCorrect = await bcryptjs.compare(
    password,
    user.password as string,
  );
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credentials");
  }
  const accessToken = generateJwtToken(
    {
      id: user.id,
      email: user.email,
      role: user.userRoles.map((item) => item.role.systemLevel),
    },

    config.jwt.access_secret,

    // config.jwt.access_expires,
    "3h",
  );
  const refreshToken = generateJwtToken(
    { id: user.id, email: user.email },
    config.jwt.refresh_secret,
    // config.jwt.refresh_expires,
    "30d",
  );
  return {
    user,
    accessToken,
    refreshToken,
  };
};
const forgetPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (!user.isVerified) {
    throw new ApiError(401, "User is not verified");
  }
  if (user.email) {
    await OTPService.sendOTP(user.email);
  }
  return true;
};

const generateResetToken = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isVerified = await verifyUserOTP(email, otp);
  const resetToken = generateJwtToken(
    { email: user.email, purpose: "password_reset" },
    config.jwt.access_secret,
    "10m",
  );
  return { resetToken };
};
interface IResetPassword {
  userId: string;
  email: string;
  purpose: string;
}
const resetPassword = async (newPassword: string, token: string) => {
  const decodedToken = jwt.verify(
    token,
    config.jwt.access_secret,
  ) as IResetPassword;

  if (!decodedToken) {
    throw new ApiError(401, "Invalid token");
  }
  if (decodedToken.purpose !== "password_reset") {
    throw new ApiError(401, "The token is not for resetting password");
  }
  const hashedPassword = await bcryptjs.hash(
    newPassword,
    config.bcrypt_salt_round,
  );
  const user = await prisma.user.update({
    where: {
      email: decodedToken.email,
    },
    data: {
      password: hashedPassword,
    },
  });
  return true;
};
export const AuthService = {
  register,
  addPassword,
  login,
  forgetPassword,
  generateResetToken,
  resetPassword,
  getNewAccessToken,
};
