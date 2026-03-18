import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getProductsByStore = async (req: Request, res: Response) => {
    try {
        const { storeId } = req.query; // Passed from frontend Zustand store

        if (!storeId) {
            return res.status(400).json({ message: "Store context is required" });
        }

        // Fetch products that have stock entries for this specific store
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                stocks: {
                    some: {
                        storeId: String(storeId),
                        quantity: { gt: 0 } // Only show items with stock > 0
                    }
                }
            },
            include: {
                images: true, // Get product photos
                category: true, // Get category name
                stocks: {
                    where: { storeId: String(storeId) },
                    select: { quantity: true } // Show how many are left
                }
            }
        });

        return res.status(200).json({ data: products });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};