import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import config from ".";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
import stream from "stream";
cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret,
});
export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string,
): Promise<UploadApiResponse | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      const publicId = `pdf/${fileName}-${Date.now()}`;
      const bufferStream = new stream.PassThrough();
      bufferStream.end();
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "raw",
            public_id: publicId,
            folder: "pdf",
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          },
        )
        .end(buffer);
    });
  } catch (error: any) {
    throw new ApiError(401, "Error uploading file", error.message);
  }
};

export const deleteImgFromCloudinary = async (url: string) => {
  try {
    const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;
    const match = url.match(regex);
    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error: any) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cloudinary image deletion failed",
      error.message,
    );
  }
};
export const cloudinaryUpload = cloudinary;
