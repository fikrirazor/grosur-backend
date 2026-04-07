import { Request, Response } from "express";
import prisma from "../config/database";
import { findNearestStore } from "../services/location.service";
import jwt from "jsonwebtoken";
import { calculateDistance } from "../utils/haversine";

const MAX_RADIUS_KM = 50;

// Helper 1: Calculate, Filter by 50km, and Sort (Clean Code: 6 lines)
const getSortedNearbyStores = (lat: number, lng: number, stores: any[]) => {
  return stores
    .map(s => ({ ...s, distance: calculateDistance(lat, lng, s.latitude, s.longitude) }))
    .filter(s => s.distance <= MAX_RADIUS_KM)
    .sort((a, b) => a.distance - b.distance);
};

// Helper 2: Handle the Main Store Fallback (Clean Code: 5 lines)
const handleFallback = (stores: any[]) => {
  // @ts-ignore - Assuming your DB has an 'isMain' boolean, or we just grab the first store
  const mainStore = stores.find(s => s.isMain) || stores[0];
  return { 
    store: mainStore, 
    message: "Menggunakan toko utama (Lokasi ditolak atau di luar jangkauan 50km)" 
  };
};

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
    const { latitude, longitude } = req.body;
    const stores = await prisma.store.findMany();
    
    if (!stores.length) return res.status(404).json({ message: "Data toko kosong" });

    // Fallback AC: Triggered if user denies location permission
    if (!latitude || !longitude) return res.status(200).json(handleFallback(stores));

    // Calculate & Filter AC: Get stores within radius
    const nearby = getSortedNearbyStores(latitude, longitude, stores);
    
    // Fallback AC: Triggered if user is too far from any store
    if (!nearby.length) return res.status(200).json(handleFallback(stores));

    // Return the absolute closest store as the primary target
    return res.status(200).json({ store: nearby[0], message: "Toko terdekat ditemukan" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* --- CLEAN CODE HELPERS (< 15 Lines) --- */


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