import axios from "axios";
import prisma from "../config/database";

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY;
const OPENCAGE_URL = "https://api.opencagedata.com/geocode/v1/json";

export const getCoordinates = async (address: string) => {
    try {
        const response = await axios.get(OPENCAGE_URL, {
            params: {
                q: address,
                key: OPENCAGE_API_KEY,
                language: "id", // Optimize for Indonesian addresses
                limit: 1,
            },
        });

        if (response.data.results.length === 0) {
            throw new Error("Address not found");
        }

        const { lat, lng } = response.data.results[0].geometry;
        return { latitude: lat, longitude: lng };
    } catch (error) {
        throw new Error("Failed to fetch coordinates from OpenCage");
    }
};

/**
 * Haversine Formula: Calculates distance between two points in KM
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const findNearestStore = async (userLat: number, userLon: number) => {
    const stores = await prisma.store.findMany({
        where: { isActive: true },
    });

    if (stores.length === 0) return null;

    // Map stores with their calculated distance
    const storesWithDistance = stores.map((store) => {
        const distance = calculateDistance(userLat, userLon, store.latitude, store.longitude);
        return { ...store, distance };
    });

    // Sort by distance and return the closest one
    return storesWithDistance.sort((a, b) => a.distance - b.distance)[0];
};
