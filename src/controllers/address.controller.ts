import { Request, Response } from "express";
import prisma from "../config/database";
import { getCoordinates } from "../services/location.service";

export const getMyAddresses = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const addresses = await prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
        return res.status(200).json({ data: addresses });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const addAddress = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { detail, city, province } = req.body;
        const { latitude, longitude } = await getCoordinates(`${detail}, ${city}, ${province}`);

        const payload = { ...req.body, userId, latitude, longitude };
        const newAddress = await processAddressTransaction(userId, payload);

        return res.status(201).json({ data: newAddress });
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