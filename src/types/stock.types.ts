// Input untuk update stock (masuk/keluar)
export interface UpdateStockInput {
  productId: string;
  storeId: string;
  change: number;
  reason?: string;
  userId: string;
}

// Input untuk transfer stock antar toko
export interface TransferStockInput {
  productId: string;
  fromStoreId: string;
  toStoreId: string;
  quantity: number;
  reason?: string;
  userId: string;
}
