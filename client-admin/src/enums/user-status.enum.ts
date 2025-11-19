export const UserStatus = {
  WAITING: 'idle',
  ON_CONTRACT: 'on_contract',
  IN_COMBAT: 'in_combat',
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const UserStatusLabels: Record<UserStatus, string> = {
  [UserStatus.WAITING]: 'Ожидание',
  [UserStatus.ON_CONTRACT]: 'На контракте',
  [UserStatus.IN_COMBAT]: 'В бою',
};
