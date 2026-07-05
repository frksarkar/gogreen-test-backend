import { redisClient } from "../config/redis.config";
import ApiError from "../errors/ApiError";

export const verifyUserOTP = async (email: string, otp: string) => {
  const redisKey = `otp:${email}`;
  const savedOtp = await redisClient.get(redisKey);
  if (!savedOtp) {
    throw new ApiError(401, "OTP expired & doesn't exist anymore");
  }
  if (String(savedOtp) !== String(otp)) {
    throw new ApiError(401, "OTP doesn't match");
  }
  redisClient.del([redisKey]);
  return true;
};
