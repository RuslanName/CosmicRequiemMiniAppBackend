import { SettingKey } from './enums/setting-key.enum';

export const MINUTES = 60_000;
export const HOURS = 3_600_000;

export const DEFAULT_SETTINGS = {
  [SettingKey.TRAINING_COOLDOWN]: 15 * MINUTES,
  [SettingKey.CONTRACT_COOLDOWN]: 15 * MINUTES,
  [SettingKey.CLAN_JOIN_COOLDOWN]: 24 * HOURS,
  [SettingKey.CLAN_WAR_DURATION]: 6 * HOURS,
  [SettingKey.CLAN_WAR_COOLDOWN]: 12 * HOURS,
  [SettingKey.ATTACK_COOLDOWN]: 15 * MINUTES,
  [SettingKey.ACTIVATE_SHIELD_COOLDOWN]: 8 * HOURS,
  [SettingKey.MAX_STRENGTH_FIRST_USER_GUARD]: 50,
  [SettingKey.INITIAL_STRENGTH_FIRST_USER_GUARD]: 10,
  [SettingKey.MAX_CLAN_WARS_COUNT]: 2,
  [SettingKey.BASE_PRICE]: 10,
  [SettingKey.GROWTH_FACTOR]: 1.2,
  [SettingKey.MIN_INCREASE]: 3,
  [SettingKey.GUARD_BONUS]: 0.5,
  [SettingKey.POWER_PERCENTAGE]: 0.1,
  [SettingKey.MAX_RANDOM_CHANCE]: 3,
  [SettingKey.RANDOM_POWER_COEFFICIENT]: 0.001,
  [SettingKey.RANDOM_BONUS_PER_GUARD]: 0.2,
  [SettingKey.REFERRER_MONEY_REWARD]: 100,
  [SettingKey.INITIAL_REFERRER_VK_ID]: 0,
  [SettingKey.ADV_DISABLE_COST_VOICES_COUNT]: 20,
} as const;

export const TIME_UNIT_MULTIPLIERS: Partial<Record<SettingKey, number>> = {
  [SettingKey.TRAINING_COOLDOWN]: MINUTES,
  [SettingKey.CONTRACT_COOLDOWN]: MINUTES,
  [SettingKey.ATTACK_COOLDOWN]: MINUTES,
  [SettingKey.ACTIVATE_SHIELD_COOLDOWN]: HOURS,
  [SettingKey.CLAN_JOIN_COOLDOWN]: HOURS,
  [SettingKey.CLAN_WAR_DURATION]: HOURS,
  [SettingKey.CLAN_WAR_COOLDOWN]: HOURS,
};
