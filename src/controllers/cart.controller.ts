import { Request, Response } from "express";
import { sendResponse } from "../utils/response.util";
import * as cartService from "../services/cart.service";


export const addToCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user.isVerified) {
      return sendResponse(res, 403, false, "Please verify your email to add items to cart.");
    }

    const { productId, storeId, quantity } = req.body;
    
    const cart = await cartService.addItemToCart(user.id, productId, storeId, quantity);
    
    sendResponse(res, 201, true, "Item added to cart successfully", cart);
  } catch (error: any) {
    sendResponse(res, 400, false, error.message || "Failed to add to cart");
  }
};

export const getCartCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const count = await cartService.getCartCount(user.id);
    sendResponse(res, 200, true, "Cart count fetched", { count });
  } catch (error: any) {
    sendResponse(res, 400, false, error.message || "Failed to fetch cart count");
  }
};

export const getCartData = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const items = await cartService.getCartItems(user.id);
    sendResponse(res, 200, true, "Cart items fetched successfully", { items });
  } catch (error: any) {
    sendResponse(res, 400, false, error.message || "Failed to fetch cart elements");
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { cartId } = req.params;
    const { quantity } = req.body;
    if (!quantity || isNaN(quantity)) {
      return sendResponse(res, 400, false, "Invalid quantity.");
    }
    const updated = await cartService.updateCartItemQuantity(cartId, user.id, Number(quantity));
    sendResponse(res, 200, true, "Cart item updated", updated);
  } catch (error: any) {
    sendResponse(res, 400, false, error.message || "Failed to update cart item");
  }
};

export const deleteCartItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { cartId } = req.params;
    await cartService.removeCartItem(cartId, user.id);
    sendResponse(res, 200, true, "Cart item removed");
  } catch (error: any) {
    sendResponse(res, 400, false, error.message || "Failed to remove cart item");
  }
};
