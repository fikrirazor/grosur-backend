import prisma from "../../config/database";
import { ProductMovement, StoreMovement, StockReportSummary } from "../../types/stock.types";

/**
 * Get final stock for a product from Stock table
 */
export const getFinalStock = async (productId: string, storeId: string) => {
  const stock = await prisma.stock.findUnique({
    where: { productId_storeId: { productId, storeId } },
    select: { quantity: true },
  });
  return stock?.quantity || 0;
};

/**
 * Aggregate stock movements by product
 */
export const aggregateByProduct = (journals: any[]): ProductMovement[] => {
  const productMap = new Map<string, ProductMovement>();

  journals.forEach((journal) => {
    const product = journal.stock.product;
    const key = product.id;
    if (!productMap.has(key)) {
      productMap.set(key, {
        productId: product.id,
        productName: product.name,
        productImage: product.images?.[0]?.url || null,
        categoryId: product.categoryId,
        categoryName: product.category?.name || "Unknown",
        stockIn: 0,
        stockOut: 0,
        movements: 0,
      });
    }

    const data = productMap.get(key)!;
    data.movements += 1;

    if (journal.type === "IN") {
      data.stockIn += journal.newQty - journal.oldQty;
    } else if (journal.type === "OUT") {
      data.stockOut += journal.oldQty - journal.newQty;
    }
  });

  return Array.from(productMap.values());
};

/**
 * Aggregate stock movements by store
 */
export const aggregateByStore = (journals: any[]): StoreMovement[] => {
  const storeMap = new Map<string, any>();

  journals.forEach((journal) => {
    const store = journal.stock.store;
    const key = store.id;
    if (!storeMap.has(key)) {
      storeMap.set(key, {
        storeId: store.id,
        storeName: store.name,
        totalIn: 0,
        totalOut: 0,
        products: new Set(),
      });
    }

    const data = storeMap.get(key);
    data.products.add(journal.stock.productId);

    if (journal.type === "IN") {
      data.totalIn += journal.newQty - journal.oldQty;
    } else if (journal.type === "OUT") {
      data.totalOut += journal.oldQty - journal.newQty;
    }
  });

  return Array.from(storeMap.values()).map((data) => ({
    storeId: data.storeId,
    storeName: data.storeName,
    totalIn: data.totalIn,
    totalOut: data.totalOut,
    productCount: data.products.size,
  }));
};

/**
 * Build summary statistics
 */
export const buildSummary = (
  byProduct: ProductMovement[],
  byStore: StoreMovement[],
  period: string
): StockReportSummary => {
  const totalIn = byProduct.reduce((sum, p) => sum + p.stockIn, 0);
  const totalOut = byProduct.reduce((sum, p) => sum + p.stockOut, 0);

  return {
    period,
    totalProducts: byProduct.length,
    totalStores: byStore.length,
    totalIn,
    totalOut,
    netChange: totalIn - totalOut,
  };
};
