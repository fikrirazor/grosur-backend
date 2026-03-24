import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { uploadToCloudinary } from "../utils/cloudinary";

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name } = req.body;

    let photoUrl;

    // 1. If a file is attached, upload it to Cloudinary
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      photoUrl = uploadResult.secure_url;
    }

    // 2. Prepare the data payload safely
    const updateData: any = {};
    if (name) updateData.name = name;
    if (photoUrl) updateData.profilePicture = photoUrl;

    // 3. Update the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      // Exclude sensitive data like passwords from the response
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        profilePicture: true
      }
    });

    return res.status(200).json({
      message: "Profil berhasil diperbarui",
      data: updatedUser
    });
  } catch (error: any) {
    console.error("UPDATE_PROFILE_ERROR:", error);
    // Handle the specific Multer error we created earlier
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Gagal memperbarui profil" });
  }
};