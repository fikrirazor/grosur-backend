import { Request, Response } from "express";
import prisma from "../config/database";
import { uploadToCloudinary } from "../utils/cloudinary";

export const getBanners = async (_req: Request, res: Response) => {
  try {
    const now = new Date();

    // 1. Fetch 2 newest active discounts
    const activeDiscounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        product: {
          include: { images: { take: 1 } }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    });

    // 2. Fetch banners linked to these specific discounts
    const discountIds = activeDiscounts.map(d => d.id);
    const manualDiscountBanners = await prisma.banner.findMany({
      where: {
        isActive: true,
        discountId: { in: discountIds }
      }
    });

    // 3. Construct the 2 discount banners (Virtual or Custom)
    const finalDiscountBanners = activeDiscounts.map(discount => {
      const manualOverride = manualDiscountBanners.find(b => b.discountId === discount.id);
      
      if (manualOverride) return manualOverride;

      // Virtual Banner Generation
      let title = "Promo Spesial!";
      if (discount.type === "PERCENT") title = `Diskon ${discount.value}%!`;
      if (discount.type === "NOMINAL") title = `Potongan Rp ${Number(discount.value).toLocaleString()}!`;
      if (discount.type === "B1G1") title = "Beli 1 Gratis 1!";

      return {
        id: `virtual-${discount.id}`,
        title,
        subtitle: discount.product ? `Khusus untuk ${discount.product.name}` : "Hanya di Grosur Terdekatmu",
        imageUrl: discount.product?.images[0]?.url || null,
        bgGradient: "bg-gradient-to-r from-orange-500 to-yellow-400",
        contentColor: "text-white",
        linkUrl: discount.product ? `/products/${discount.product.slug}` : "#",
        isActive: true,
        discountId: discount.id
      };
    });

    // 4. Fetch up to 3 additional manual active banners (not linked to discounts)
    const manualBanners = await prisma.banner.findMany({
      where: { 
        isActive: true,
        discountId: null
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const combinedBanners = [...finalDiscountBanners, ...manualBanners];
    
    return res.status(200).json({ success: true, data: combinedBanners });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createBanner = async (req: Request, res: Response) => {
  try {
    const { title, subtitle, bgGradient, contentColor, linkUrl, isActive, discountId } = req.body;
    
    // Limit check for manual banners (non-discount)
    if ((isActive === "true" || isActive === true) && !discountId) {
      const activeCount = await prisma.banner.count({ where: { isActive: true, discountId: null } });
      if (activeCount >= 3) {
        return res.status(400).json({ 
          success: false, 
          message: "Maksimal 3 banner manual (non-diskon) aktif diperbolehkan. Matikan banner lain terlebih dahulu." 
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
        discountId: discountId || null,
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
    const { title, subtitle, bgGradient, contentColor, linkUrl, isActive, discountId } = req.body;

    if ((isActive === "true" || isActive === true) && !discountId) {
      const currentBanner = await prisma.banner.findUnique({ where: { id } });
      if (currentBanner && !currentBanner.isActive) {
        const activeCount = await prisma.banner.count({ where: { isActive: true, discountId: null } });
        if (activeCount >= 3) {
          return res.status(400).json({ success: false, message: "Maksimal 3 banner manual aktif diperbolehkan." });
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
        discountId: discountId !== undefined ? (discountId || null) : undefined,
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

export const getActiveDiscounts = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const discounts = await prisma.discount.findMany({
      where: { 
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { product: true },
      orderBy: { createdAt: "desc" }
    });
    return res.status(200).json({ success: true, data: discounts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

