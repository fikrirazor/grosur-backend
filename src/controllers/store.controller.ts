import { Request, Response } from "express";
import prisma from "../config/database";
import { findNearestStore } from "../services/location.service";

export const getAssignedStore = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // 1. Get the user's default address
        const defaultAddress = await prisma.address.findFirst({
            where: { userId, isDefault: true },
        });

        if (!defaultAddress || !defaultAddress.latitude || !defaultAddress.longitude) {
            return res.status(404).json({
                message: "Default address not found. Please set an address first."
            });
        }

        // 2. Use the Location Service to find the nearest store
        const nearestStore = await findNearestStore(
            defaultAddress.latitude,
            defaultAddress.longitude
        );

        if (!nearestStore) {
            return res.status(404).json({
                message: "No stores available in your area yet."
            });
        }

        // 3. Optional: Check if the store is within the allowed radius
        // Most grocery apps limit delivery to ~15-20km
        if (nearestStore.distance > nearestStore.maxRadius) {
            return res.status(400).json({
                message: "You are outside our current delivery range.",
                distance: `${nearestStore.distance.toFixed(2)} km`
            });
        }

        return res.status(200).json({
            message: "Store assigned successfully",
            data: nearestStore,
        });
    } catch (error) {
        console.error("GET_STORE_ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/** Public — no auth required.
 *  Returns the first active store as a fallback when geolocation is denied
 *  or the user does not yet have a default address.
 */
export const getFallbackStore = async (_req: Request, res: Response) => {
    try {
        const store = await prisma.store.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
        });

        if (!store) {
            return res.status(404).json({ message: "No active stores found." });
        }

        return res.status(200).json({ message: "Fallback store returned", data: store });
    } catch (error) {
        console.error("GET_FALLBACK_STORE_ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};