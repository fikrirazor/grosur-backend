import { Request, Response } from "express";
import prisma from "../config/database";
import { findNearestStore } from "../services/location.service";
import jwt from "jsonwebtoken";
import { calculateDistance } from "../utils/haversine";

export const getAssignedStore = async (req: Request, res: Response) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) return getFallbackStore(req, res); // Guest user? Give them fallback.

        const address = await prisma.address.findFirst({
            where: { userId, isDefault: true },
        });
        if (!address || address.latitude === null || address.longitude === null) {
            return res.status(404).json({ message: "Address not found or location not set" });
        }

        const nearest = await findNearestStore(address.latitude, address.longitude);
        return validateAndSendStore(res, nearest);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getFallbackStore = async (_req: Request, res: Response) => {
    try {
        const store = await prisma.store.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
        });
        return store
            ? res.status(200).json({ message: "Fallback", data: store })
            : res.status(404).json({ message: "No active stores" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getNearestStore = async (req: Request, res: Response) => {
    try {
        const latitude = parseFloat(req.body.latitude);
        const longitude = parseFloat(req.body.longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ message: "Lokasi tidak valid atau diperlukan" });
        }

        const stores = await prisma.store.findMany();
        if (!stores.length) return res.status(404).json({ message: "Toko tidak ditemukan" });

        const nearestStore = findClosestStore(latitude, longitude, stores);
        const distanceKm = calculateDistance(latitude, longitude, nearestStore.latitude, nearestStore.longitude);

        return res.status(200).json({
            message: "Toko terdekat ditemukan",
            data: nearestStore,
            distanceKm: parseFloat(distanceKm.toFixed(2))
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

/* --- CLEAN CODE HELPERS (< 15 Lines) --- */

const findClosestStore = (lat: number, lng: number, stores: any[]) => {
    return stores.reduce((closest, store) => {
        const closestDist = calculateDistance(lat, lng, closest.latitude, closest.longitude);
        const storeDist = calculateDistance(lat, lng, store.latitude, store.longitude);
        return storeDist < closestDist ? store : closest;
    });
};

const getUserIdFromRequest = (req: Request): string | null => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        return decoded.id;
    } catch {
        return null;
    }
};

const validateAndSendStore = (res: Response, store: any) => {
    if (!store) return res.status(404).json({ message: "No stores in area" });

    if (store.distance > store.maxRadius) {
        return res.status(400).json({
            message: "Outside delivery range",
            distance: `${store.distance.toFixed(2)} km`
        });
    }

    return res.status(200).json({ data: store });
};