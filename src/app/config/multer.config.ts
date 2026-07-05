import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { cloudinaryUpload } from "./cloudinary.config";
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: {
    public_id: (req, file) => {
      const filename = file.originalname
        .toLowerCase()
        .replace(/\s/g, "-")
        .replace(/\./g, "-")
        .replace(/[^a-z0-9\-\.]/g, "");
      const extension = file.originalname.split(".").pop();
      const uploadFileName =
        Math.random().toString(36).substring(2) +
        "-" +
        Date.now() +
        "-" +
        filename;
      return uploadFileName;
    },
  },
});

export const multerUpload = multer({
  storage,
});


