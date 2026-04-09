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

