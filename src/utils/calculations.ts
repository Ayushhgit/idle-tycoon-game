import { Business, Property, LuxuryItem, Stock, MutualFund, PrestigeState } from '../types/game';
import { GameConfig } from '../constants/gameConfig';
import { BUSINESS_MILESTONE_MULTIPLIERS } from '../constants/businesses';

export function calcBusinessCost(business: Business): number {
  return business.baseCost * Math.pow(GameConfig.business.costGrowthRate, business.level);
}

export function calcBusinessIncome(business: Business): number {
  if (!business.owned || business.level === 0) return 0;
  const milestoneMultiplier = getMilestoneMultiplier(business.level);
  return business.baseIncome * business.level * business.multiplier * milestoneMultiplier;
}

function getMilestoneMultiplier(level: number): number {
  let mult = 1;
  for (const [milestone, bonus] of Object.entries(BUSINESS_MILESTONE_MULTIPLIERS)) {
    if (level >= Number(milestone)) mult = bonus;
  }
  return mult;
}

export function calcTotalPassiveIncome(
  businesses: Business[],
  properties: Property[],
  luxuryItems: LuxuryItem[],
  prestigeData: PrestigeState,
  eventMultiplier = 1,
  boosterMultiplier = 1
): number {
  const businessIncome = businesses.reduce((sum, b) => sum + calcBusinessIncome(b), 0);
  const propertyIncome = properties
    .filter((p) => p.owned)
    .reduce((sum, p) => sum + p.rentPerSec * p.level, 0);

  const luxuryMultiplier = luxuryItems
    .filter((l) => l.owned)
    .reduce((mult, l) => mult * l.incomeMultiplier, 1);

  return (
    (businessIncome + propertyIncome) *
    luxuryMultiplier *
    prestigeData.permanentIncomeMultiplier *
    eventMultiplier *
    boosterMultiplier
  );
}

export function calcTapValue(
  tapPower: number,
  tapLevel: number,
  luxuryItems: LuxuryItem[],
  prestigeData: PrestigeState,
  comboMultiplier = 1,
  eventMultiplier = 1,
  boosterMultiplier = 1
): number {
  // tapPower already encodes the per-level growth; do NOT multiply by level again
  // (that double-scaling made tap money explode). Single gentle curve instead.
  const baseTap = tapPower;
  const luxuryMult = luxuryItems
    .filter((l) => l.owned)
    .reduce((mult, l) => mult * l.tapMultiplier, 1);
  return (
    baseTap *
    luxuryMult *
    prestigeData.permanentTapMultiplier *
    comboMultiplier *
    eventMultiplier *
    boosterMultiplier
  );
}

export function calcTapUpgradeCost(level: number): number {
  return Math.floor(
    GameConfig.tap.upgradeCostBase * Math.pow(GameConfig.tap.upgradeCostMultiplier, level - 1)
  );
}

export function calcComboMultiplier(comboCount: number): number {
  const max = GameConfig.tap.comboMaxMultiplier;
  return Math.min(1 + comboCount * 0.1, max);
}

export function calcNetWorth(
  money: number,
  stocks: Stock[],
  properties: Property[],
  luxuryItems: LuxuryItem[],
  mutualFunds: MutualFund[]
): number {
  const stockValue = stocks.reduce((sum, s) => sum + s.sharesOwned * s.currentPrice, 0);
  const propValue = properties.filter((p) => p.owned).reduce((sum, p) => sum + p.currentValue, 0);
  const luxValue = luxuryItems.filter((l) => l.owned).reduce((sum, l) => sum + l.cost, 0);
  const fundValue = mutualFunds.reduce((sum, f) => sum + f.currentValue, 0);
  return money + stockValue + propValue + luxValue + fundValue;
}

export function calcPropertyUpgradeCost(property: Property): number {
  return Math.floor(property.baseCost * property.level * 0.5);
}

export function calcOfflineEarnings(passiveIncome: number, elapsedMs: number): number {
  const maxMs = GameConfig.offline.maxOfflineHours * 3600 * 1000;
  const clampedMs = Math.min(elapsedMs, maxMs);
  const elapsedSecs = clampedMs / 1000;
  return passiveIncome * elapsedSecs * GameConfig.offline.offlineEfficiency;
}

export function calcPrestigeTokens(netWorth: number, _prestigeCount: number): number {
  const base = Math.floor(Math.log10(netWorth / GameConfig.prestige.minimumNetWorth) * 3) + 1;
  return Math.max(1, base);
}

export function calcStockProfitLoss(stock: Stock): number {
  if (stock.sharesOwned === 0 || stock.averageBuyPrice === 0) return 0;
  return (stock.currentPrice - stock.averageBuyPrice) * stock.sharesOwned;
}

export function calcStockProfitLossPct(stock: Stock): number {
  if (stock.sharesOwned === 0 || stock.averageBuyPrice === 0) return 0;
  return (stock.currentPrice - stock.averageBuyPrice) / stock.averageBuyPrice;
}
