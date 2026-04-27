import { v2 as cloudinary } from "cloudinary";

// CLOUDINARY_URL env var auto-configures cloudinary
// Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
cloudinary.config();

export default cloudinary;
