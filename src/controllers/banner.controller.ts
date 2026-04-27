import { Request, Response } from "express";
import prisma from "../config/database";
import { uploadToCloudinary } from "../utils/cloudinary";

export const getBanners = async (_req: Request, res: Response) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return res.status(200).json({ success: true, data: banners });
  } catch (error: any) {
    console.error("GET BANNERS ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createBanner = async (req: Request, res: Response) => {
  try {
    const { title, subtitle, bgGradient, contentColor, linkUrl, isActive, showText } = req.body;
    
    // Check limit of 5 active manual banners
    if (isActive === "true" || isActive === true) {
      const activeCount = await prisma.banner.count({ where: { isActive: true } });
      if (activeCount >= 5) {
        return res.status(400).json({ 
          success: false, 
          message: "Maksimal 5 banner aktif diperbolehkan. Matikan banner lain terlebih dahulu." 
        });
      }
    }

    let imageUrl = null;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle,
        imageUrl,
        bgGradient,
        contentColor: contentColor || "text-white",
        linkUrl,
        showText: showText === "false" || showText === false ? false : true,
        isActive: isActive === "true" || isActive === true,
      },
    });

    return res.status(201).json({ success: true, data: banner });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, subtitle, bgGradient, contentColor, linkUrl, isActive, showText } = req.body;

    // If trying to activate, check limit
    if (isActive === "true" || isActive === true) {
      const currentBanner = await prisma.banner.findUnique({ where: { id } });
      if (currentBanner && !currentBanner.isActive) {
        const activeCount = await prisma.banner.count({ where: { isActive: true } });
        if (activeCount >= 5) {
          return res.status(400).json({ 
            success: false, 
            message: "Maksimal 5 banner aktif diperbolehkan." 
          });
        }
      }
    }

    let imageUrl = undefined;
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        subtitle,
        imageUrl,
        bgGradient,
        contentColor,
        linkUrl,
        showText: showText !== undefined ? (showText === "true" || showText === true) : undefined,
        isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : undefined,
      },
    });

    return res.status(200).json({ success: true, data: banner });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    return res.status(200).json({ success: true, message: "Banner berhasil dihapus" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllBannersAdmin = async (_req: Request, res: Response) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, data: banners });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Kept for UI compatibility but simplified
export const getActiveDiscounts = async (_req: Request, res: Response) => {
  return res.status(200).json({ success: true, data: [] });
};
