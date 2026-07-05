import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import config from "../config";
import { prisma } from "./prisma";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
export const generateJwtToken = (
  payload: any,
  secret: string,
  expiresIn: string,
) => {
  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: expiresIn,
  } as SignOptions);

  return token;
};
export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string,
) => {
  const verifiedRefreshToken = jwt.verify(
    refreshToken,
    config.jwt.refresh_secret,
  ) as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: verifiedRefreshToken.id },
    select: {
      id: true,
      email: true,
      userRoles: {
        select: {
          role: {
            select: { systemLevel: true },
          },
        },
      },
    },
  });

  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, "User not found");

  const newAccessToken = generateJwtToken(
    {
      id: user.id,
      email: user.email,
      role: user.userRoles.map((item) => item.role.systemLevel),
    },
    config.jwt.access_secret,
    "1h",
  );
  return newAccessToken;
};
