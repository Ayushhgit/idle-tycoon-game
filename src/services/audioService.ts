import { Audio } from 'expo-av';
import { getSoundUris, SoundKey } from '../utils/soundSynth';

let sounds: Partial<Record<SoundKey, Audio.Sound>> = {};
let enabled = true;
let initialized = false;
const lastPlayed: Partial<Record<SoundKey, number>> = {};
const THROTTLE_MS = 55; // avoid spamming expo-av on rapid taps

export const AudioService = {
  async init(): Promise<void> {
    if (initialized) return;
    initialized = true;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (_) {}

    // Synthesize all SFX as WAV data URIs and preload them.
    const uris = getSoundUris();
    await Promise.all(
      (Object.keys(uris) as SoundKey[]).map(async (key) => {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: uris[key] },
            { shouldPlay: false, volume: 1 }
          );
          sounds[key] = sound;
        } catch (_) {}
      })
    );
  },

  setEnabled(value: boolean): void {
    enabled = value;
  },

  async play(key: SoundKey): Promise<void> {
    if (!enabled) return;
    const now = Date.now();
    if (now - (lastPlayed[key] ?? 0) < THROTTLE_MS) return;
    lastPlayed[key] = now;
    const sound = sounds[key];
    if (!sound) return;
    try {
      await sound.replayAsync();
    } catch (_) {}
  },

  async unloadAll(): Promise<void> {
    for (const sound of Object.values(sounds)) {
      try { await sound.unloadAsync(); } catch (_) {}
    }
    sounds = {};
    initialized = false;
  },
};
