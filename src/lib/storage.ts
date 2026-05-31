import AsyncStorage from '@react-native-async-storage/async-storage';

const GAME_SAVE_KEY = 'idle_wealth_tycoon_save_v1';
const SETTINGS_KEY = 'idle_wealth_tycoon_settings_v1';

export const Storage = {
  async saveGame(data: unknown): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      await AsyncStorage.setItem(GAME_SAVE_KEY, serialized);
    } catch (e) {
      console.warn('[Storage] saveGame failed:', e);
    }
  },

  async loadGame<T>(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(GAME_SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn('[Storage] loadGame failed:', e);
      return null;
    }
  },

  async saveSettings(data: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[Storage] saveSettings failed:', e);
    }
  },

  async loadSettings<T>(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn('[Storage] loadSettings failed:', e);
      return null;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([GAME_SAVE_KEY, SETTINGS_KEY]);
    } catch (e) {
      console.warn('[Storage] clearAll failed:', e);
    }
  },
};
