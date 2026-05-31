import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { AudioService } from '../services/audioService';
import { SoundKey } from '../utils/soundSynth';

export function useHaptics() {
  const vibrationEnabled = useGameStore((s) => s.settings.vibrationEnabled);
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled);

  const sfx = useCallback(
    (key: SoundKey) => {
      if (soundEnabled) AudioService.play(key);
    },
    [soundEnabled]
  );

  const tapHaptic = useCallback(() => {
    sfx('tap');
    if (vibrationEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [vibrationEnabled, sfx]);

  const criticalHaptic = useCallback(() => {
    sfx('critical');
    if (vibrationEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [vibrationEnabled, sfx]);

  const purchaseHaptic = useCallback(() => {
    sfx('purchase');
    if (vibrationEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [vibrationEnabled, sfx]);

  const errorHaptic = useCallback(() => {
    sfx('error');
    if (vibrationEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, [vibrationEnabled, sfx]);

  const achievementHaptic = useCallback(() => {
    sfx('achievement');
    if (!vibrationEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 100);
  }, [vibrationEnabled, sfx]);

  return { tapHaptic, criticalHaptic, purchaseHaptic, errorHaptic, achievementHaptic };
}
