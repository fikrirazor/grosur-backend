import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/response.util";
import { config } from "../config/env";

const RAJAONGKIR_BASE_URL = "https://rajaongkir.komerce.id/api/v1";


/**
 * Fetch provinces from RajaOngkir
 */
export const getProvinces = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const response = await fetch(`${RAJAONGKIR_BASE_URL}/destination/province`, {
      headers: {
        key: config.rajaongkirApiKey || "",
      },
    });

    const data: any = await response.json();

    if (data.meta?.code !== 200) {
      return sendResponse(
        res,
        data.meta?.code || 400,
        false,
        data.meta?.message || "Failed to fetch provinces"
      );
    }

    // Map Komerce response to RajaOngkir format for frontend compatibility
    const formattedProvinces = (data.data || []).map((p: any) => ({
      province_id: p.id.toString(),
      province: p.name,
    }));

    sendResponse(res, 200, true, "Provinces retrieved", formattedProvinces);
  } catch (error) {
    next(error);
  }
};


/**
 * Fetch cities from RajaOngkir
 */
export const getCities = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const provinceId = req.query.provinceId as string;
    
    // In Komerce, there's no direct "city list" by province_id.
    // We use the search endpoint as a workaround if we have a province name,
    // or we fetch the list of provinces first to get the name if we only have ID.
    // For now, let's try to get all provinces to find the name.
    
    const provRes = await fetch(`${RAJAONGKIR_BASE_URL}/destination/province`, {
      headers: { key: config.rajaongkirApiKey || "" },
    });
    const provData: any = await provRes.json();
    const province = provData.data?.find((p: any) => p.id.toString() === provinceId);
    
    if (!province) {
        return sendResponse(res, 404, false, "Province not found");
    }

    // Search for locations in this province (limit 500 to get broad coverage of cities)
    const url = `${RAJAONGKIR_BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(province.name)}&limit=500`;

    const response = await fetch(url, {
      headers: {
        key: config.rajaongkirApiKey || "",
      },
    });

    const data: any = await response.json();

    if (data.meta?.code !== 200) {
      return sendResponse(
        res,
        data.meta?.code || 400,
        false,
        data.meta?.message || "Failed to fetch cities"
      );
    }

    // Extract unique cities from the search results
    const uniqueCitiesMap = new Map();
    (data.data || []).forEach((item: any) => {
        // Only include results that belong to the selected province 
        // (The search might return results from other provinces if the name is similar)
        if (item.province_name.toUpperCase() === province.name.toUpperCase() && !uniqueCitiesMap.has(item.city_name)) {
            uniqueCitiesMap.set(item.city_name, {
                city_id: item.id.toString(), // Using one of the destination IDs as city_id
                city_name: item.city_name,
                province_id: provinceId,
                province: province.name,
                type: item.city_name.includes("KABUPATEN") ? "Kabupaten" : "Kota"
            });
        }
    });


    const formattedCities = Array.from(uniqueCitiesMap.values());

    sendResponse(res, 200, true, "Cities retrieved", formattedCities);
  } catch (error) {
    next(error);
  }
};


/**
 * Fetch shipping cost from RajaOngkir
 */
export const getShippingCost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { origin, destination, weight, courier } = req.body;

    if (!origin || !destination || !weight || !courier) {
      return sendResponse(res, 400, false, "All fields are required");
    }

    const response = await fetch(`${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`, {
      method: "POST",
      headers: {
        key: config.rajaongkirApiKey || "",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        origin,
        destination,
        weight: weight.toString(),
        courier,
      }),
    });

    const data: any = await response.json();

    if (data.meta?.code !== 200) {
      return sendResponse(
        res,
        data.meta?.code || 400,
        false,
        data.meta?.message || "Failed to fetch shipping cost"
      );
    }

    // Komerce returns a flat list of costs in 'data'
    const costs = data.data || [];
    const formattedCosts = costs.map((c: any) => ({
      service: c.service,
      description: c.description || c.service,
      cost: c.cost,
      estimatedDays: c.etd,
    }));

    sendResponse(res, 200, true, "Shipping costs retrieved", formattedCosts);
  } catch (error) {
    next(error);
  }
};

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


