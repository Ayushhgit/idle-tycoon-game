import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function useAchievements() {
  const achievements = useGameStore((s) => s.achievements);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<string[]>([]);
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    const unlockedIds = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id));

    // First run after load: seed the baseline so already-unlocked achievements
    // (restored from save) don't fire a fake "just unlocked" toast on launch.
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevUnlockedRef.current = unlockedIds;
      return;
    }

    const newlyUnlocked: string[] = [];
    for (const id of unlockedIds) {
      if (!prevUnlockedRef.current.has(id)) {
        newlyUnlocked.push(id);
      }
    }

    if (newlyUnlocked.length > 0) {
      setRecentlyUnlocked(newlyUnlocked);
      setTimeout(() => setRecentlyUnlocked([]), 3000);
    }

    prevUnlockedRef.current = unlockedIds;
  }, [achievements]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return {
    achievements,
    recentlyUnlocked,
    unlockedCount,
    totalCount,
  };
}
