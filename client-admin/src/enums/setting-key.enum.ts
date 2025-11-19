export const SettingKey = {
  TRAINING_COOLDOWN: 'training_cooldown',
  CONTRACT_COOLDOWN: 'contract_cooldown',
  CLAN_JOIN_COOLDOWN: 'clan_join_cooldown',
  CLAN_WAR_DURATION: 'clan_war_duration',
  CLAN_WAR_COOLDOWN: 'clan_war_cooldown',
  ATTACK_COOLDOWN: 'attack_cooldown',
  PURCHASE_SHIELD_COOLDOWN: 'purchase_shield_cooldown',
  MAX_STRENGTH_FIRST_USER_GUARD: 'max_strength_first_user_guard',
  MAX_CLAN_WARS_COUNT: 'max_clan_wars_count',
  BASE_PRICE: 'base_price',
  GROWTH_FACTOR: 'growth_factor',
  MIN_INCREASE: 'min_increase',
  GUARD_BONUS: 'guard_bonus',
  POWER_PERCENTAGE: 'power_percentage',
  MAX_RANDOM_CHANCE: 'max_random_chance',
  RANDOM_POWER_COEFFICIENT: 'random_power_coefficient',
  RANDOM_BONUS_PER_GUARD: 'random_bonus_per_guard',
} as const;

export type SettingKey = typeof SettingKey[keyof typeof SettingKey];

export const SettingKeyLabels: Record<SettingKey, string> = {
  [SettingKey.TRAINING_COOLDOWN]: 'Кулдаун тренировки',
  [SettingKey.CONTRACT_COOLDOWN]: 'Кулдаун контракта',
  [SettingKey.CLAN_JOIN_COOLDOWN]: 'Кулдаун вступления в клан',
  [SettingKey.CLAN_WAR_DURATION]: 'Длительность клановой войны',
  [SettingKey.CLAN_WAR_COOLDOWN]: 'Кулдаун клановой войны',
  [SettingKey.ATTACK_COOLDOWN]: 'Кулдаун атаки',
  [SettingKey.PURCHASE_SHIELD_COOLDOWN]: 'Кулдаун покупки щита',
  [SettingKey.MAX_STRENGTH_FIRST_USER_GUARD]: 'Макс. сила первого стража',
  [SettingKey.MAX_CLAN_WARS_COUNT]: 'Макс. количество клановых войн',
  [SettingKey.BASE_PRICE]: 'Базовая цена',
  [SettingKey.GROWTH_FACTOR]: 'Коэффициент роста',
  [SettingKey.MIN_INCREASE]: 'Минимальное увеличение',
  [SettingKey.GUARD_BONUS]: 'Бонус стража',
  [SettingKey.POWER_PERCENTAGE]: 'Процент силы',
  [SettingKey.MAX_RANDOM_CHANCE]: 'Макс. случайный шанс',
  [SettingKey.RANDOM_POWER_COEFFICIENT]: 'Коэффициент случайной силы',
  [SettingKey.RANDOM_BONUS_PER_GUARD]: 'Случайный бонус за стража',
};

