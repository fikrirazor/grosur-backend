import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { storeId, shippingCost, courier, items } = req.body;

        // Execute everything in a single transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Main Order
            const order = await tx.order.create({
                data: {
                    userId,
                    storeId,
                    totalPrice: items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) + shippingCost,
                    shippingCost,
                    courier: courier.toUpperCase(),
                    orderStatus: "PENDING_PAYMENT",
                    // Generate a unique order number
                    orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`
                }
            });

            // 2. Create Order Items and Reduce Stock
            for (const item of items) {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }
                });

                // CRITICAL: Reduce stock in the specific store
                await tx.stock.update({
                    where: {
                        productId_storeId: { productId: item.productId, storeId }
                    },
                    data: {
                        quantity: { decrement: item.quantity }
                    }
                });
            }

            return order;
        });

        return res.status(201).json({ data: result });
    } catch (error) {
        console.error("ORDER_ERROR:", error);
        return res.status(500).json({ message: "Gagal membuat pesanan" });
    }
};