import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { fetchRajaOngkirCost } from "../services/shipping.service";

export const getShippingCosts = async (req: Request, res: Response) => {
    try {
        // Note: In a real app, you'd map your string cities to RajaOngkir City IDs.
        // For this example, we assume the frontend sends the correct city IDs.
        const { storeId, originCityId, destinationCityId, weight, courier } = req.body;

        if (!storeId || !originCityId || !destinationCityId || !weight || !courier) {
            return res.status(400).json({ message: "Missing required shipping parameters" });
        }

        const destinationString = `${destinationCityId}`; // Identifier for your cache

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
            originCityId,
            destinationCityId,
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

    } catch (error: any) {
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
};