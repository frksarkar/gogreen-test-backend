import { Request } from "express";

export const getIdParam = (req: Request): string => {
  return req.params.id as string;
};
