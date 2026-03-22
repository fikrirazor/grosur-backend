import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { fetchRajaOngkirCost } from "../services/shipping.service";

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

        const store = await prisma.store.findUnique({
            where: { id: storeId }
        });

        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }

        const destinationString = `${(userAddress as any).cityId}`; // Identifier for your cache

        // 1. Check Database Cache First
        const cachedCosts = await prisma.shippingCost.findMany({
            where: {
                storeId,
                destination: destinationString,
                courier: courier.toUpperCase(),
            },
        });

        // If we have cached results, return them immediately to save API calls!
        if (cachedCosts.length > 0) {
            return res.status(200).json({
                message: "Retrieved from cache",
                data: cachedCosts
            });
        }

        // 2. Not in cache? Fetch from RajaOngkir
        const apiResults = await fetchRajaOngkirCost(
            (store as any).cityId,
            (userAddress as any).cityId,
            weight,
            courier
        );

        // 3. Format and Save to Database Cache
        const formattedCosts = apiResults.map((service: any) => ({
            storeId,
            destination: destinationString,
            province: "Mapping Needed", // You can pull this from the RajaOngkir response
            city: "Mapping Needed",
            district: "Mapping Needed",
            courier: courier.toUpperCase(),
            service: service.service,
            cost: service.cost[0].value,
            estimatedDays: parseInt(service.cost[0].etd.replace(/\D/g, "")) || null, // Extracts numbers from "1-2 HARI"
        }));

        // Save all available service types (REG, YES, OKE) to the database
        await prisma.shippingCost.createMany({
            data: formattedCosts,
            skipDuplicates: true,
        });

        return res.status(200).json({
            message: "Fetched from courier and cached",
            data: formattedCosts
        });

        // Add these to src/controllers/shipping.controller.ts

        export const getProvinces = async (req: Request, res: Response) => {
            try {
                const provinces = await fetchProvinces();
                return res.status(200).json({ data: provinces });
            } catch (error: any) {
                return res.status(500).json({ message: error.message });
            }
        };

        export const getCities = async (req: Request, res: Response) => {
            try {
                const { provinceId } = req.query; // e.g., /api/shipping/cities?provinceId=5
                const cities = await fetchCities(provinceId as string);
                return res.status(200).json({ data: cities });
            } catch (error: any) {
                return res.status(500).json({ message: error.message });
            }
        };

    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
};