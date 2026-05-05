import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary-v2";
import cloudinary from "../config/cloudinary.config";
import { AppError } from "./error.middleware";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: any, file: any) => {
    // Determine folder based on fieldname or other criteria if needed
    let folder = "grosur/misc";
    if (file.fieldname === "image") folder = "grosur/banners";
    if (file.fieldname === "profilePhoto") folder = "grosur/profiles";
    if (file.fieldname === "paymentProof") folder = "grosur/payments";
    if (file.fieldname === "images") folder = "grosur/products";

    return {
      folder: folder,
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
      resource_type: "auto",
    };
  },
} as any); // The options object itself needs to be cast if types don't match perfectly, but internally it's better.

const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/gif",
    "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        "Only .jpg, .jpeg, .png, .gif and .webp formats are allowed!",
      ),
      false,
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Increased to 5MB for convenience
  },
});
