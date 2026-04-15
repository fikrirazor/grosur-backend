import axios from "axios";

const RAJAONGKIR_BASE_URL = "https://rajaongkir.komerce.id/api/v1";
const API_KEY = process.env.RAJAONGKIR_API_KEY;

export const fetchRajaOngkirCost = async (
    originCityId: string,
    destinationCityId: string,
    weightInGrams: number,
    courier: string
) => {
    try {
        const response = await axios.post(
            `${RAJAONGKIR_BASE_URL}/shipping/cost`,
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

        // Komerce response structure might differ. Based on docs it might be response.data.data
        return response.data.data || response.data.rajaongkir.results[0].costs;
    } catch (error: any) {
        console.error("RAJAONGKIR_ERROR:", error.response?.data || error.message);
        throw new Error("Failed to fetch shipping costs from courier");
    }
};

export const fetchProvinces = async () => {
    try {
        const response = await axios.get(`${RAJAONGKIR_BASE_URL}/destination/province`, {
            headers: { key: API_KEY },
        });

        // Map Komerce response back to RajaOngkir format for compatibility
        return response.data.data.map((p: any) => ({
            province_id: p.id.toString(),
            province: p.name,
        }));
    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error("RAJAONGKIR_PROVINCES_ERROR:", errorData);
        throw new Error("Failed to fetch provinces from shipping service");
    }
};

export const fetchCities = async (provinceId?: string) => {
    try {
        const url = provinceId
            ? `${RAJAONGKIR_BASE_URL}/destination/city/${provinceId}`
            : `${RAJAONGKIR_BASE_URL}/destination/city`;

        const response = await axios.get(url, {
            headers: { key: API_KEY },
        });

        // Map Komerce response back to RajaOngkir format
        return response.data.data.map((c: any) => ({
            city_id: c.id.toString(),
            city_name: c.name,
            type: c.type,
        }));
    } catch (error: any) {
        const errorData = error.response?.data || error.message;
        console.error("RAJAONGKIR_CITIES_ERROR:", errorData);
        throw new Error("Failed to fetch cities from shipping service");
    }
};