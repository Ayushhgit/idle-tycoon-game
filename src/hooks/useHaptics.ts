import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

export function useHaptics() {
  const vibrationEnabled = useGameStore((s) => s.settings.vibrationEnabled);

  const tapHaptic = useCallback(() => {
    if (!vibrationEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [vibrationEnabled]);

  const criticalHaptic = useCallback(() => {
    if (!vibrationEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [vibrationEnabled]);

  const purchaseHaptic = useCallback(() => {
    if (!vibrationEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [vibrationEnabled]);

  const errorHaptic = useCallback(() => {
    if (!vibrationEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, [vibrationEnabled]);

  const achievementHaptic = useCallback(() => {
    if (!vibrationEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 100);
  }, [vibrationEnabled]);

  return { tapHaptic, criticalHaptic, purchaseHaptic, errorHaptic, achievementHaptic };
}
