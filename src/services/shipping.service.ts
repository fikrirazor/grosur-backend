import axios from "axios";

const RAJAONGKIR_BASE_URL = "https://api.rajaongkir.com/starter";
const API_KEY = process.env.RAJAONGKIR_API_KEY;

export const fetchRajaOngkirCost = async (
    originCityId: string,
    destinationCityId: string,
    weightInGrams: number,
    courier: string
) => {
    try {
        const response = await axios.post(
            `${RAJAONGKIR_BASE_URL}/cost`,
            {
                origin: originCityId,
                destination: destinationCityId,
                weight: weightInGrams,
                courier: courier.toLowerCase(),
            },
            {
                headers: { key: API_KEY },
            }
        );

        return response.data.rajaongkir.results[0].costs;
    } catch (error: any) {
        console.error("RAJAONGKIR_ERROR:", error.response?.data || error.message);
        throw new Error("Failed to fetch shipping costs from courier");
    }
};

// Add these to src/services/shipping.service.ts

export const fetchProvinces = async () => {
    try {
        const response = await axios.get(`${RAJAONGKIR_BASE_URL}/province`, {
            headers: { key: API_KEY },
        });
        return response.data.rajaongkir.results;
    } catch (error) {
        throw new Error("Failed to fetch provinces from RajaOngkir");
    }
};

export const fetchCities = async (provinceId?: string) => {
    try {
        // If a provinceId is provided, filter by it. Otherwise, get all cities.
        const url = provinceId
            ? `${RAJAONGKIR_BASE_URL}/city?province=${provinceId}`
            : `${RAJAONGKIR_BASE_URL}/city`;

        const response = await axios.get(url, {
            headers: { key: API_KEY },
        });
        return response.data.rajaongkir.results;
    } catch (error) {
        throw new Error("Failed to fetch cities from RajaOngkir");
    }
};