export const ClanWarStatus = {
  IN_PROGRESS: 'in_progress',
  WON_BY_CLAN_1: 'won_by_clan_1',
  WON_BY_CLAN_2: 'won_by_clan_2',
} as const;

export type ClanWarStatus = typeof ClanWarStatus[keyof typeof ClanWarStatus];

export const ClanWarStatusLabels: Record<ClanWarStatus, string> = {
  [ClanWarStatus.IN_PROGRESS]: 'В процессе',
  [ClanWarStatus.WON_BY_CLAN_1]: 'Выиграл клан 1',
  [ClanWarStatus.WON_BY_CLAN_2]: 'Выиграл клан 2',
};
