import { v2 as cloudinary } from "cloudinary";
import config from "../config/env";

cloudinary.config({
    cloudinary_url: config.cloudinary.url,
});

export const uploadToCloudinary = (fileBuffer: Buffer, folder: string = "profile_photos"): Promise<any> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        // Write the buffer to the stream
        uploadStream.end(fileBuffer);
    });
};
