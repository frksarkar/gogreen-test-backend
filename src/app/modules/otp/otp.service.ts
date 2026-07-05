import crypto from "crypto";
import { Response } from "express";
import { redisClient } from "../../config/redis.config";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import { sendMail } from "../../utils/transporter";
import { verifyUserOTP } from "../../utils/verifyOTP";
const OTP_EXPIRATION = 5 * 60;
const generateOTP = (length = 6) => {
  const otp = crypto.randomInt(10 ** (length - 1), 1000000);
  return otp;
};
const sendOTP = async (email: string) => {
  const otp = generateOTP();
  const redisKey = `otp:${email}`;
  // await redisClient.set(redisKey, otp, {
  //   expiration: {
  //     type: "EX",
  //     value: OTP_EXPIRATION,
  //   },
  // });
  await redisClient.set(redisKey, otp, "EX", OTP_EXPIRATION);
  await sendMail({
    to: email,
    subject: "OTP for Go Green",
    templateName: "otp",
    templateData: {
      otp,
      date: new Date().toDateString(),
    },
  });
};

const verifyOTP = async (res: Response, email: string, otp: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      email: true,
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
    throw new ApiError(404, "User Not Found");
  }

  const isVerified = await verifyUserOTP(email, otp);
  if (!isVerified) {
    throw new ApiError(401, "Invalid OTP");
  }

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      isVerified: true,
    },
  });
  return user;
};
export const OTPService = {
  sendOTP,
  verifyOTP,
};
