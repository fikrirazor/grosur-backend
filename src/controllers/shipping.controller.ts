import { Request, Response } from "express";
import prisma from "../config/database";
import {
    fetchRajaOngkirCost,
    fetchProvinces,
    fetchCities,
} from "../services/shipping.service";

export const getShippingCosts = async (req: Request, res: Response) => {
    try {
        const { storeId, weight, courier } = req.body;
        const userId = (req as any).user?.id || (req as any).user;

        if (!storeId || !weight || !courier) {
            return res.status(400).json({ message: "Missing required shipping parameters" });
        }

        const userAddress = await prisma.address.findFirst({
            where: { userId, isDefault: true }
        });

        if (!userAddress) {
            return res.status(404).json({ message: "User default address not found" });
        }

        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store) return res.status(404).json({ message: "Store not found" });

        const destinationString = `${(userAddress as any).cityId}`;

        // 1. Check cache first
        const cachedCosts = await prisma.shippingCost.findMany({
            where: { storeId, destination: destinationString, courier: courier.toUpperCase() },
        });

        if (cachedCosts.length > 0) {
            return res.status(200).json({ message: "Retrieved from cache", data: cachedCosts });
        }

        // 2. Fetch from RajaOngkir
        const apiResults = await fetchRajaOngkirCost(
            (store as any).cityId,
            (userAddress as any).cityId,
            weight,
            courier
        );

        // 3. Format, cache, and return
        const formattedCosts = apiResults.map((service: any) => ({
            storeId,
            destination: destinationString,
            province: "N/A",
            city: "N/A",
            district: "N/A",
            courier: courier.toUpperCase(),
            service: service.service,
            cost: service.cost[0].value,
            estimatedDays: parseInt(service.cost[0].etd.replace(/\D/g, "")) || null,
        }));

        await prisma.shippingCost.createMany({ data: formattedCosts, skipDuplicates: true });

        return res.status(200).json({ message: "Fetched from courier and cached", data: formattedCosts });
    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
};

export const getProvinces = async (_req: Request, res: Response) => {
    try {
        const provinces = await fetchProvinces();
        return res.status(200).json({ data: provinces });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

export const getCities = async (req: Request, res: Response) => {
    try {
        const { provinceId } = req.query;
        const cities = await fetchCities(provinceId as string);
        return res.status(200).json({ data: cities });
    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};


