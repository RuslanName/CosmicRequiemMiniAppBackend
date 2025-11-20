export const ShopItemStatus = {
  IN_STOCK: 'in_stock',
  SOLD_OUT: 'sold_out',
} as const;

export type ShopItemStatus = typeof ShopItemStatus[keyof typeof ShopItemStatus];

export const ShopItemStatusLabels: Record<ShopItemStatus, string> = {
  [ShopItemStatus.IN_STOCK]: 'В наличии',
  [ShopItemStatus.SOLD_OUT]: 'Распродано',
};

