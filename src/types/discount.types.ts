
// untuk input create discount
export interface CreateDiscountInput {
  storeId: string;
  productId?: string;
  type: DiscountType;
  value: number;
  minSpend?: number;
  maxDiscount?: number;
  buyQty?: number;
  freeQty?: number;
  startDate: Date;
  endDate: Date;
}

// untuk input update discount
export interface UpdateDiscountInput {
  productId?: string;
  type?: DiscountType;
  value?: number;
  minSpend?: number;
  maxDiscount?: number;
  buyQty?: number;
  freeQty?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
}