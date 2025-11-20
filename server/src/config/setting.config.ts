import {
  DEFAULT_SETTINGS,
  TIME_UNIT_MULTIPLIERS,
} from '../modules/setting/setting-constants';
import { SettingKey } from '../modules/setting/setting-key.enum';
import { SettingService } from '../modules/setting/services/setting.service';

type SettingsType = typeof DEFAULT_SETTINGS;

export const Settings: SettingsType = { ...DEFAULT_SETTINGS };

let _settingService: SettingService | null = null;
let _isInitialized = false;

export const initSettings = async (settingService: SettingService) => {
  _settingService = settingService;
  await reloadSettings();
  _isInitialized = true;
};

export const reloadSettings = async () => {
  if (!_settingService) return;

  const dbSettings = await _settingService.findAll({ page: 1, limit: 1000 });
  const dbMap = Object.fromEntries(
    dbSettings.data.map((s) => [s.key, s.value]),
  );

  for (const key of Object.values(SettingKey)) {
    if (dbMap[key] !== undefined) {
      const raw = dbMap[key];
      const def = DEFAULT_SETTINGS[key];

      if (typeof def === 'number') {
        const num = parseFloat(raw);
        if (isNaN(num)) {
          (Settings as any)[key] = def;
        } else {
          const multiplier = TIME_UNIT_MULTIPLIERS[key];
          (Settings as any)[key] = multiplier ? num * multiplier : num;
        }
      } else if (typeof def === 'boolean') {
        (Settings as any)[key] = ['true', '1', 'yes', 'on'].includes(
          raw.toLowerCase().trim(),
        );
      } else if (typeof def === 'string') {
        (Settings as any)[key] = raw.trim() || def;
      } else if (typeof def === 'object') {
        try {
          (Settings as any)[key] = JSON.parse(raw);
        } catch {
          (Settings as any)[key] = def;
        }
      }
    } else {
      (Settings as any)[key] = DEFAULT_SETTINGS[key];
    }
  }
};

export const isSettingsInitialized = () => _isInitialized;
