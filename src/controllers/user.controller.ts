import { Request, Response } from "express";
import prisma from "../config/database";
import { uploadToCloudinary } from "../utils/cloudinary";

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updateData = await buildProfileUpdateData(req);

    if (Object.keys(updateData).length === 0) {
      console.log(`ℹ️ User ${userId} attempted to update profile with no data.`);
      return res.status(400).json({ message: "Tidak ada data yang diperbarui" });
    }

    const updatedUser = await executeProfileUpdate(userId, updateData);
    console.log(`✅ User ${userId} profile updated successfully.`);

    // Map database 'photo' field to 'profilePicture' for frontend consistency
    const responseData = {
      ...updatedUser,
      profilePicture: updatedUser.photo
    };
    // @ts-ignore (Remove photo if it's already in profilePicture, optional)
    delete responseData.photo;

    return res.status(200).json({ message: "Profil berhasil diperbarui", data: responseData });

  } catch (error: any) {
    console.error("❌ Profile Update Error Details:", {
      message: error.message,
      stack: error.stack,
      userId: (req as any).user?.id
    });
    if (error.statusCode === 400) return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: `Gagal memperbarui profil: ${error.message || "Internal Server Error"}` });
  }
};

/* --- REFACTORED HELPERS (To pass <15 lines rule) --- */

const buildProfileUpdateData = async (req: Request) => {
  const data: any = {};
  if (req.body && req.body.name) data.name = req.body.name;

  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.buffer);
    data.photo = uploadResult.secure_url;
  }
  return data;
};

const executeProfileUpdate = async (id: string, data: any) => {
  return await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, photo: true }
  });
};