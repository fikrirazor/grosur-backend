import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getCoordinates } from "../services/location.service";

export const addAddress = async (req: Request, res: Response) => {
    try {
        const { name, phone, province, city, district, detail, postalCode, isDefault } = req.body;
        const userId = (req as any).user.id; // From verifyToken middleware

        // 1. Convert address string to Coordinates
        const fullAddress = `${detail}, ${district}, ${city}, ${province}, Indonesia`;
        const { latitude, longitude } = await getCoordinates(fullAddress);

        // 2. Database Transaction: Update addresses safely
        const newAddress = await prisma.$transaction(async (tx) => {
            // If this is the new default, unset the old one
            if (isDefault) {
                await tx.address.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }

            // Create the new record
            return await tx.address.create({
                data: {
                    userId,
                    name,
                    phone,
                    province,
                    city,
                    district,
                    detail,
                    postalCode,
                    isDefault: isDefault || false,
                    latitude,
                    longitude,
                },
            });
        });

        return res.status(201).json({
            message: "Address saved successfully",
            data: newAddress,
        });
    } catch (error: any) {
        console.error("ADD_ADDRESS_ERROR:", error.message);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
};

export const getMyAddresses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const addresses = await prisma.address.findMany({
            where: { userId },
            orderBy: { isDefault: "desc" }, // Show default address first
        });
        return res.status(200).json({ data: addresses });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};