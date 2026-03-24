import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier"; // Optional: npm install streamifier

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

export const uploadToCloudinary = (fileBuffer: Buffer): Promise<any> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "payment_proofs" },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        // Write the buffer to the stream
        uploadStream.end(fileBuffer);
    });
};