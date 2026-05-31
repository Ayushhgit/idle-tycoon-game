import { Stock } from '../types/game';
import { GameConfig } from '../constants/gameConfig';

export function simulateStockTick(
  stock: Stock,
  isCrash: boolean,
  isBull: boolean,
  eventStockMultiplier: number,
  prestigeLuck: number
): Stock {
  const vol = stock.volatility + prestigeLuck * 0.01;

  // Symmetric random shock — genuinely up OR down each tick, no built-in bias.
  let change = (Math.random() * 2 - 1) * vol;

  // Tiny drift (trend is ~0, can be slightly +/-), keeps long-term mild slope.
  change += stock.trend;

  // Mean reversion: gently pull price back toward its base so it oscillates
  // instead of running to the moon or the floor. This is what makes it feel
  // like a real market — winners cool off, dips recover.
  const base = stock.basePrice > 0 ? stock.basePrice : stock.currentPrice;
  const gap = (base - stock.currentPrice) / base; // + when below base, - when above
  change += gap * 0.04;

  if (isCrash) change -= 0.08 + Math.random() * 0.12;
  if (isBull) change += 0.05 + Math.random() * 0.10;

  // Clamp a single tick so nothing teleports.
  change = Math.max(-0.25, Math.min(0.25, change));

  const newPrice = Math.max(1, stock.currentPrice * (1 + change) * eventStockMultiplier);
  const newHistory = [...stock.priceHistory, parseFloat(newPrice.toFixed(2))];

  if (newHistory.length > GameConfig.stock.maxHistoryPoints) {
    newHistory.shift();
  }

  return {
    ...stock,
    currentPrice: parseFloat(newPrice.toFixed(2)),
    priceHistory: newHistory,
  };
}

export function shouldTriggerCrash(): boolean {
  return Math.random() < GameConfig.stock.marketCrashChance;
}

export function shouldTriggerBull(): boolean {
  return Math.random() < GameConfig.stock.bullMarketChance;
}
