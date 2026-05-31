export const GameConfig = {
  tap: {
    basePower: 1,
    tapPowerGrowth: 1.12,   // gentle per-level growth so tap money rises slowly
    comboWindow: 500,
    comboMaxMultiplier: 3,
    criticalChance: 0.04,
    criticalMultiplier: 5,
    upgradeCostBase: 35,
    upgradeCostMultiplier: 1.55,
  },
  business: {
    costGrowthRate: 1.15,
    incomeScalePower: 1.1,
  },
  passive: {
    tickIntervalMs: 100,
  },
  stock: {
    updateIntervalMs: 3000,
    maxHistoryPoints: 30,
    marketCrashChance: 0.002,
    bullMarketChance: 0.003,
    crashMultiplier: 0.7,
    bullMultiplier: 1.3,
  },
  offline: {
    maxOfflineHours: 8,
    offlineEfficiency: 0.5,
  },
  prestige: {
    minimumNetWorth: 1_000_000,
    baseTokenReward: 1,
    tokenMultiplierPerPrestige: 0.1,
    tapBoostPerToken: 0.05,
    incomeBoostPerToken: 0.05,
    stockLuckPerToken: 0.02,
  },
  dailyReward: {
    baseGems: 10,
    streakBonusGems: 5,
    maxStreakBonus: 7,
  },
  events: {
    checkIntervalMs: 60_000,
    minDurationMs: 120_000,
    maxDurationMs: 300_000,
    chance: 0.15,
  },
  fund: {
    compoundIntervalMs: 10_000,
    annualReturns: {
      safe: 0.04,
      growth: 0.10,
      aggressive: 0.20,
    },
  },
  save: {
    intervalMs: 30_000,
  },
  booster: {
    duration2xIncome: 120_000,
    durationAutoClicker: 60_000,
    durationTapMultiplier: 90_000,
    durationInvestmentBoost: 180_000,
    autoClickerIntervalMs: 1000,
    autoClickerTapValue: 0.5,
    gemCosts: {
      incomeBoost2x: 20,
      tapMultiplier3x: 15,
      autoClicker: 10,
      investmentBoost: 25,
    },
  },
} as const;
