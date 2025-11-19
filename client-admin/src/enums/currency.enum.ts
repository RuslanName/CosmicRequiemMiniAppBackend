export const Currency = {
  VOICES: 'voices',
  VIRTUAL: 'virtual',
} as const;

export type Currency = typeof Currency[keyof typeof Currency];

export const CurrencyLabels: Record<Currency, string> = {
  [Currency.VOICES]: 'Голоса',
  [Currency.VIRTUAL]: 'Виртуальная',
};
