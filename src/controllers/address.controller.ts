import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { getCoordinates } from "../services/location.service";



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

export const addAddress = async (req: Request, res: Response) => {
    try {
        const {
            name, phone, province, city, district, detail,
            postalCode, isDefault,
            provinceId, cityId // <-- ADD THESE TWO
        } = req.body;

        const userId = (req as any).user.id;

        const { latitude, longitude } = await getCoordinates(`${detail}, ${city}, ${province}`);

        const newAddress = await prisma.$transaction(async (tx) => {
            if (isDefault) {
                await tx.address.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }

            return await tx.address.create({
                data: {
                    userId, name, phone, province, city, district, detail,
                    postalCode, isDefault, latitude, longitude,
                    provinceId, // <-- SAVE TO DB
                    cityId      // <-- SAVE TO DB
                },
            });
        });

        return res.status(201).json({ data: newAddress });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};