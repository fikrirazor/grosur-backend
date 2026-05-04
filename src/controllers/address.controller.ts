import { Request, Response } from "express";
import prisma from "../config/database";
// Note: Assuming getCoordinates is safely handling API errors and returning { latitude: null, longitude: null } on fail
import { getCoordinates } from "../services/location.service";

export const getMyAddresses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });
    return res.status(200).json({ data: addresses });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { detail, city, province } = req.body;

    // 1. Set default coordinates to null
    let latitude = null;
    let longitude = null;

    // 2. Wrap the 3rd-party API call in its own safety net
    try {
      const coords = await getCoordinates(`${detail}, ${city}, ${province}`);
      latitude = coords.latitude;
      longitude = coords.longitude;
    } catch (geoError) {
      // If OpenCage fails, just warn us, but DON'T crash!
      console.warn(
        `⚠️ Geocoding API failed. Saving address without coordinates.`,
      );
    }

    const payload = { ...req.body, userId, latitude, longitude };

    const newAddress = await processAddressTransaction(userId, payload);
    return res
      .status(201)
      .json({ message: "Alamat berhasil ditambahkan", data: newAddress });
  } catch (error) {
    console.error("🚨 ADD ADDRESS ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Use updateMany to ensure the user actually owns this address before updating
    await prisma.address.updateMany({
      where: { id, userId },
      data: req.body,
    });
    return res.status(200).json({ message: "Alamat berhasil diperbarui" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await prisma.address.deleteMany({ where: { id, userId } });
    return res.status(200).json({ message: "Alamat berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await executeSetDefault(userId, id);
    return res.status(200).json({ message: "Alamat utama berhasil diubah" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* --- REFACTORED HELPERS (To pass <15 lines rule) --- */

const processAddressTransaction = async (userId: string, data: any) => {
  return await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return await tx.address.create({ data });
  });
};

const executeSetDefault = async (userId: string, addressId: string) => {
  return await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);
};
