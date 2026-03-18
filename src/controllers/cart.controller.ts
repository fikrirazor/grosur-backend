import { Request, Response } from "express";
import prisma from "../utils/prisma"; // Adjust path if your prisma client is elsewhere

export const addToCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { productId, storeId, quantity } = req.body;

        if (!productId || !storeId || !quantity) {
            return res.status(400).json({ message: "Product, Store, and Quantity are required" });
        }

        // 1. Verify Stock Availability for this Specific Store
        const stockRecord = await prisma.stock.findUnique({
            where: {
                productId_storeId: { // Uses the @@unique constraint from your schema
                    productId: productId,
                    storeId: storeId,
                }
            }
        });

        if (!stockRecord || stockRecord.quantity < quantity) {
            return res.status(400).json({ message: "Insufficient stock at your selected store." });
        }

        // 2. Check if the item is already in the user's cart for this store
        const existingCartItem = await prisma.cart.findUnique({
            where: {
                userId_productId_storeId: {
                    userId,
                    productId,
                    storeId
                }
            }
        });

        if (existingCartItem) {
            // Calculate new total quantity
            const newQuantity = existingCartItem.quantity + quantity;

            // Double-check stock against the NEW total quantity
            if (stockRecord.quantity < newQuantity) {
                return res.status(400).json({ message: "Cannot add more. Exceeds available stock." });
            }

            // Update existing cart item
            const updatedCart = await prisma.cart.update({
                where: { id: existingCartItem.id },
                data: { quantity: newQuantity }
            });

            return res.status(200).json({ message: "Cart quantity updated", data: updatedCart });
        }

        // 3. Create a brand new cart item
        const newCartItem = await prisma.cart.create({
            data: {
                userId,
                productId,
                storeId,
                stockId: stockRecord.id, // Linking the specific stock record
                quantity
            }
        });

        return res.status(201).json({ message: "Item added to cart", data: newCartItem });

    } catch (error) {
        console.error("ADD_TO_CART_ERROR:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const cartItems = await prisma.cart.findMany({
            where: { userId },
            include: {
                product: {
                    include: { images: true } // Bring in product details and images for the UI
                },
                store: {
                    select: { name: true, city: true } // Bring in basic store info
                }
            }
        });

        return res.status(200).json({ data: cartItems });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};