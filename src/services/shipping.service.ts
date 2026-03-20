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