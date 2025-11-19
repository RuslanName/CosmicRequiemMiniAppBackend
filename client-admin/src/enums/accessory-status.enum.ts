export const AccessoryStatus = {
  IN_STOCK: 'in_stock',
  SOLD_OUT: 'sold_out',
} as const;

export type AccessoryStatus = typeof AccessoryStatus[keyof typeof AccessoryStatus];

export const AccessoryStatusLabels: Record<AccessoryStatus, string> = {
  [AccessoryStatus.IN_STOCK]: 'В наличии',
  [AccessoryStatus.SOLD_OUT]: 'Распродано',
};
