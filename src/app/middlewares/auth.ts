import { NextFunction, Request, Response } from "express";
import ApiError from "../errors/ApiError";
import { verifyJwtToken } from "../shared/verifyJwtToken";
import config from "../config";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../shared/prisma";
import httpStatus from "http-status";
export const auth =
  () => async (req: Request, _: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;
    // console.log("ACCESS TOKEN:", accessToken);
    try {
      if (!accessToken) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
      }
      const verifiedToken = verifyJwtToken(
        accessToken,
        config.jwt.access_secret,
      ) as JwtPayload;

      const userExists = await prisma.user.findUnique({
        where: {
          email: verifiedToken.email,
        },
      });

      if (!userExists)
        throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");

      req.user = verifiedToken;
      next();
    } catch (error) {
      console.log(error);
      next(error);
    }
  };
