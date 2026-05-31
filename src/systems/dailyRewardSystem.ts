import { DailyRewardState } from '../types/game';
import { GameConfig } from '../constants/gameConfig';

export function canClaimDailyReward(state: DailyRewardState): boolean {
  const today = new Date().toDateString();
  return state.lastClaimedDate !== today;
}

export function calculateDailyReward(
  currentStreak: number
): { gems: number; multiplier: number; newStreak: number } {
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const today = new Date().toDateString();

  const isStreakDay = true;
  const newStreak = isStreakDay ? currentStreak + 1 : 1;

  const baseGems = GameConfig.dailyReward.baseGems;
  const streakBonus =
    Math.min(newStreak - 1, GameConfig.dailyReward.maxStreakBonus) *
    GameConfig.dailyReward.streakBonusGems;
  const totalGems = baseGems + streakBonus;
  const multiplier = 1 + newStreak * 0.05;

  return { gems: totalGems, multiplier, newStreak };
}

export function getStreakMilestoneReward(streak: number): string | null {
  const milestones: Record<number, string> = {
    3: '3-day streak bonus!',
    7: '1-week legend!',
    14: '2-week champion!',
    30: 'Monthly master!',
  };
  return milestones[streak] ?? null;
}
