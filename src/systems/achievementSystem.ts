import { Achievement, GameState } from '../types/game';

export function getAchievementProgress(
  achievement: Achievement,
  state: Partial<GameState>
): { progress: number; met: boolean } {
  const cond = achievement.condition;

  switch (cond.type) {
    case 'money':
      return {
        progress: Math.min(state.lifetimeEarnings ?? 0, cond.amount),
        met: (state.lifetimeEarnings ?? 0) >= cond.amount,
      };
    case 'net_worth':
      return {
        progress: Math.min(state.netWorth ?? 0, cond.amount),
        met: (state.netWorth ?? 0) >= cond.amount,
      };
    case 'passive_income':
      return {
        progress: Math.min(state.passiveIncome ?? 0, cond.amount),
        met: (state.passiveIncome ?? 0) >= cond.amount,
      };
    case 'tap_count':
      return {
        progress: Math.min(state.totalTaps ?? 0, cond.count),
        met: (state.totalTaps ?? 0) >= cond.count,
      };
    case 'business_count': {
      const owned = (state.businesses ?? []).filter((b) => b.owned).length;
      return { progress: Math.min(owned, cond.count), met: owned >= cond.count };
    }
    case 'luxury_owned': {
      const met = (state.luxuryItems ?? []).some((l) => l.id === cond.id && l.owned);
      return { progress: met ? 1 : 0, met };
    }
    case 'prestige_count': {
      const count = state.prestigeData?.count ?? 0;
      return { progress: Math.min(count, cond.count), met: count >= cond.count };
    }
    case 'property_owned': {
      const owned = (state.properties ?? []).filter((p) => p.owned).length;
      return { progress: Math.min(owned, cond.count), met: owned >= cond.count };
    }
    default:
      return { progress: 0, met: false };
  }
}
