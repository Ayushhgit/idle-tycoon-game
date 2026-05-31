import { Business, Property, LuxuryItem, PrestigeState, WorldEvent } from '../types/game';
import { calcTotalPassiveIncome } from '../utils/calculations';
import { GameConfig } from '../constants/gameConfig';

export function calculateCurrentPassiveIncome(
  businesses: Business[],
  properties: Property[],
  luxuryItems: LuxuryItem[],
  prestige: PrestigeState,
  events: WorldEvent[],
  boosters: { incomeBoost2x: { active: boolean; endsAt: number } }
): number {
  const now = Date.now();

  const eventMult = events
    .filter((e) => e.active && now < e.endAt)
    .reduce((m, e) => m * (e.effect.businessMultiplier ?? 1), 1);

  const boosterMult =
    boosters.incomeBoost2x.active && now < boosters.incomeBoost2x.endsAt ? 2 : 1;

  return calcTotalPassiveIncome(
    businesses,
    properties,
    luxuryItems,
    prestige,
    eventMult,
    boosterMult
  );
}

export function calculateOfflineEarnings(
  passiveIncome: number,
  lastActiveAt: number
): { amount: number; elapsedHours: number } {
  const now = Date.now();
  const elapsedMs = now - lastActiveAt;
  const maxMs = GameConfig.offline.maxOfflineHours * 3600 * 1000;
  const clampedMs = Math.min(elapsedMs, maxMs);
  const elapsedHours = clampedMs / (3600 * 1000);
  const amount = passiveIncome * (clampedMs / 1000) * GameConfig.offline.offlineEfficiency;
  return { amount, elapsedHours };
}
