export const ClanStatus = {
  ACTIVE: 'active',
  DISBANDED: 'disbanded',
} as const;

export type ClanStatus = typeof ClanStatus[keyof typeof ClanStatus];

export const ClanStatusLabels: Record<ClanStatus, string> = {
  [ClanStatus.ACTIVE]: 'Активен',
  [ClanStatus.DISBANDED]: 'Распущен',
};
