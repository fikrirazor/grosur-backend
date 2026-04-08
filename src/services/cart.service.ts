import prisma from "../config/database";

export const addItemToCart = async (
  userId: string,
  productId: string,
  storeId: string,
  quantity: number
) => {
  // Check stock availability
  const stock = await prisma.stock.findUnique({
    where: { productId_storeId: { productId, storeId } },
  });

  if (!stock) {
    throw new Error("Stock not found for this product in the selected store.");
  }

  // Check if cart item already exists
  const existingCart = await prisma.cart.findUnique({
    where: { userId_productId_storeId: { userId, productId, storeId } }
  });

  const totalQuantity = (existingCart?.quantity || 0) + quantity;

  if (stock.quantity < totalQuantity) {
    throw new Error("Not enough stock available.");
  }

  if (existingCart) {
    return prisma.cart.update({
      where: { id: existingCart.id },
      data: { quantity: totalQuantity },
    });
  }

  return prisma.cart.create({
    data: {
      userId,
      productId,
      storeId,
      stockId: stock.id,
      quantity,
    },
  });
};

export const getCartCount = async (userId: string) => {
  const carts = await prisma.cart.findMany({
    where: { userId },
  });
  return carts.reduce((total: number, cart: any) => total + cart.quantity, 0);
};

export const getCartItems = async (userId: string) => {
  return prisma.cart.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: true
        }
      },
      store: true,
      stock: true
    }
  });
};

export const updateCartItemQuantity = async (cartId: string, userId: string, quantity: number) => {
  const cart = await prisma.cart.findFirst({
    where: { id: cartId, userId },
    include: { stock: true }
  });

  if (!cart) throw new Error("Cart item not found.");
  if (quantity < 1) throw new Error("Quantity must be at least 1.");
  if (cart.stock.quantity < quantity) throw new Error("Not enough stock available.");

  return prisma.cart.update({
    where: { id: cartId },
    data: { quantity },
    include: {
      product: { include: { images: true } },
      store: true,
      stock: true
    }
  });
};

export const removeCartItem = async (cartId: string, userId: string) => {
  const cart = await prisma.cart.findFirst({ where: { id: cartId, userId } });
  if (!cart) throw new Error("Cart item not found.");
  return prisma.cart.delete({ where: { id: cartId } });
};
