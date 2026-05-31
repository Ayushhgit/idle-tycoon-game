import { Audio } from 'expo-av';

type SoundKey = 'tap' | 'tap_critical' | 'purchase' | 'achievement' | 'prestige' | 'coin' | 'error';

let sounds: Partial<Record<SoundKey, Audio.Sound>> = {};
let enabled = true;

async function loadSound(key: SoundKey, uri: any): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync(uri, { shouldPlay: false });
    sounds[key] = sound;
  } catch (_) {}
}

export const AudioService = {
  async init(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (_) {}
  },

  setEnabled(value: boolean): void {
    enabled = value;
  },

  async play(key: SoundKey): Promise<void> {
    if (!enabled) return;
    const sound = sounds[key];
    if (!sound) return;
    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (_) {}
  },

  async stopAll(): Promise<void> {
    for (const sound of Object.values(sounds)) {
      try { await sound.stopAsync(); } catch (_) {}
    }
  },

  async unloadAll(): Promise<void> {
    for (const sound of Object.values(sounds)) {
      try { await sound.unloadAsync(); } catch (_) {}
    }
    sounds = {};
  },
};
