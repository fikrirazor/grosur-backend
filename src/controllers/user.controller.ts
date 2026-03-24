import { Request, Response } from "express";
import prisma from "../config/database";
import { uploadToCloudinary } from "../utils/cloudinary";

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updateData = await buildProfileUpdateData(req);

    const updatedUser = await executeProfileUpdate(userId, updateData);
    return res.status(200).json({ message: "Profil berhasil diperbarui", data: updatedUser });

  } catch (error: any) {
    if (error.statusCode === 400) return res.status(400).json({ message: error.message });
    return res.status(500).json({ message: "Gagal memperbarui profil" });
  }
};

/* --- REFACTORED HELPERS (To pass <15 lines rule) --- */

const buildProfileUpdateData = async (req: Request) => {
  const data: any = {};
  if (req.body.name) data.name = req.body.name;

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