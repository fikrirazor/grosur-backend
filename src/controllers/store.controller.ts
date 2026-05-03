import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import { findNearestStore } from "../services/location.service";
import jwt from "jsonwebtoken";
import { calculateDistance } from "../utils/haversine";
import { sendResponse } from "../utils/response.util";


// Helper 1: Calculate, Filter by 50km, and Sort
const getSortedNearbyStores = (lat: number, lng: number, stores: any[]) => {
    return stores
        .map(s => ({ ...s, distance: calculateDistance(lat, lng, s.latitude, s.longitude) }))
        .filter(s => s.distance <= (s.maxRadius || 50))
        .sort((a, b) => a.distance - b.distance);
};


// Helper 2: Handle the Main Store Fallback
const handleFallback = (stores: any[]) => {
    const mainStore = stores.find(s => s.isMain) || stores[0];
    return {
        store: mainStore,
        message: "Menggunakan toko utama (Lokasi di luar jangkauan atau belum terdeteksi)"
    };
};


export const getAssignedStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) return getFallbackStore(req, res, next);

        const address = await prisma.address.findFirst({
            where: { userId, isDefault: true },
        });
        if (!address || address.latitude === null || address.longitude === null) {
            return sendResponse(res, 404, false, "Address not found or location not set");
        }

        const nearest = await findNearestStore(address.latitude, address.longitude);
        return validateAndSendStore(res, nearest);
    } catch (error) {
        next(error);
    }
};

export const getFallbackStore = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const store = await prisma.store.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
        });
        return store
            ? sendResponse(res, 200, true, "Fallback store found", store)
            : sendResponse(res, 404, false, "No active stores");
    } catch (error) {
        next(error);
    }
};

export const getNearestStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { latitude, longitude } = req.body;
        const stores = await prisma.store.findMany({ where: { isActive: true } });


        if (!stores.length) return sendResponse(res, 404, false, "Data toko kosong");

        if (!latitude || !longitude) {
            const result = handleFallback(stores);
            return sendResponse(res, 200, true, result.message, result.store);
        }

        const nearby = getSortedNearbyStores(latitude, longitude, stores);

        if (!nearby.length) {
            const result = handleFallback(stores);
            return sendResponse(res, 200, true, result.message, result.store);
        }

        return sendResponse(res, 200, true, "Toko terdekat ditemukan", nearby[0]);
    } catch (error) {
        next(error);
    }
};

export const getStores = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stores = await prisma.store.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          city: true,
          district: true,
        },
        orderBy: { name: "asc" },
      });
  
      return sendResponse(res, 200, true, "Stores fetched successfully", stores);
    } catch (error) {
      next(error);
    }
};

const getUserIdFromRequest = (req: Request): string | null => {
    const token = req.cookies?.token || req.cookies?.access_token || req.headers.authorization?.split(" ")[1];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        return decoded.id;
    } catch {
        return null;
    }
};

const validateAndSendStore = (res: Response, store: any) => {
    if (!store) return sendResponse(res, 404, false, "No stores in area");

    if (store.distance > store.maxRadius) {
        return sendResponse(res, 400, false, "Outside delivery range", {
            distance: `${store.distance.toFixed(2)} km`
        });
    }

    return sendResponse(res, 200, true, "Store found", store);
};

// --- Super Admin CRUD ---

export const createStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newStore = await prisma.store.create({ data: req.body });
        return sendResponse(res, 201, true, "Cabang berhasil dibuat", newStore);
    } catch (error) {
        next(error);
    }
};

export const getAllStores = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const stores = await prisma.store.findMany({
            orderBy: { createdAt: "desc" }
        });
        return sendResponse(res, 200, true, "All stores fetched", stores);
    } catch (error) {
        next(error);
    }
};

export const updateStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updated = await prisma.store.update({
            where: { id: req.params.id },
            data: req.body
        });
        return sendResponse(res, 200, true, "Cabang berhasil diperbarui", updated);
    } catch (error) {
        next(error);
    }
};

export const deleteStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.store.delete({ where: { id: req.params.id } });
        return sendResponse(res, 200, true, "Cabang berhasil dihapus");
    } catch (error) {
        next(error);
    }
};

export const assignStoreAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const storeId = req.params.id;
        const { userId } = req.body;

        await executeAssignAdmin(userId, storeId);
        return sendResponse(res, 200, true, "Admin berhasil ditugaskan ke cabang ini");
    } catch (error) {
        next(error);
    }
};

const executeAssignAdmin = async (userId: string, storeId: string) => {
    return await prisma.$transaction([
        prisma.user.updateMany({
            where: { managedStoreId: storeId },
            data: { managedStoreId: null, role: "USER" }
        }),
        prisma.user.update({
            where: { id: userId },
            data: { managedStoreId: storeId, role: "STORE_ADMIN" }
        })
    ]);
};
export const setMainStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Use transaction to ensure only one store is main
        await prisma.$transaction([
            prisma.store.updateMany({
                where: { isMain: true },
                data: { isMain: false }
            }),
            prisma.store.update({
                where: { id },
                data: { isMain: true }
            })
        ]);

        return sendResponse(res, 200, true, "Berhasil mengatur toko pusat");
    } catch (error) {
        next(error);
    }
};
