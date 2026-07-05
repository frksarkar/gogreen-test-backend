import { NextFunction, Request, Response } from "express";
import { multerUpload } from "./multer.config";

export const uploadProductImages = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const upload = multerUpload.any();

  upload(req, res, function (err) {
    if (err) return next(err);

    const files = (req.files as Express.Multer.File[]) || [];

    const grouped: Record<string, Express.Multer.File[]> = {};

    files.forEach((file) => {
      if (!grouped[file.fieldname]) grouped[file.fieldname] = [];
      grouped[file.fieldname].push(file);
    });

    req.files = grouped; // override shape

    next();
  });
};