import { NextFunction, Request, Response } from "express";
import { HttpStatusCode } from "axios";
import ApiError from "../errors/ApiError";

export const roleGuard = (roles: string[]) => {
  return (req: Request, _: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(HttpStatusCode.Unauthorized, "Unauthorized");
      }

      const userRoles: string[] = Array.isArray(req.user.role)
        ? req.user.role
        : [req.user.role].filter((r): r is string => r !== undefined);

      const hasAccess = userRoles.some((r) => roles.includes(r));

      if (!hasAccess) {
        throw new ApiError(HttpStatusCode.Forbidden, "Forbidden");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
