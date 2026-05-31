import { create } from 'zustand';
import { produce } from 'immer';
import {
  GameState,
  Business,
  Stock,
  Property,
  LuxuryItem,
  Achievement,
  WorldEvent,
  MutualFund,
  PrestigeState,
  CasinoResult,
  CasinoGameType,
  WheelPrize,
  LotteryResult,
} from '../types/game';
import { INITIAL_BUSINESSES } from '../constants/businesses';
import { INITIAL_STOCKS } from '../constants/stocks';
import { INITIAL_PROPERTIES } from '../constants/properties';
import { INITIAL_LUXURY_ITEMS } from '../constants/luxury';
import { INITIAL_ACHIEVEMENTS } from '../constants/achievements';
import { WHEEL_SEGMENTS, wheelAmountFor } from '../constants/wheel';
import { GameConfig } from '../constants/gameConfig';
import { Storage } from '../lib/storage';
import {
  calcBusinessCost,
  calcBusinessIncome,
  calcTotalPassiveIncome,
  calcTapValue,
  calcTapUpgradeCost,
  calcComboMultiplier,
  calcNetWorth,
  calcPropertyUpgradeCost,
  calcPrestigeTokens,
  calcPrestigeRequirement,
  calcOfflineEarnings,
} from '../utils/calculations';

const INITIAL_MUTUAL_FUNDS: MutualFund[] = [
  {
    id: 'safe_fund',
    name: 'Safe Harbor Fund',
    description: 'Low risk, stable 4% annual return',
    riskLevel: 'safe',
    annualReturn: 0.04,
    invested: 0,
    currentValue: 0,
    lastCompoundAt: 0,
  },
  {
    id: 'growth_fund',
    name: 'Growth Accelerator',
    description: 'Moderate risk, 10% annual return',
    riskLevel: 'growth',
    annualReturn: 0.10,
    invested: 0,
    currentValue: 0,
    lastCompoundAt: 0,
  },
  {
    id: 'aggressive_fund',
    name: 'Alpha Strike Fund',
    description: 'High risk, 20% annual return',
    riskLevel: 'aggressive',
    annualReturn: 0.20,
    invested: 0,
    currentValue: 0,
    lastCompoundAt: 0,
  },
];

function buildInitialState(): GameState {
  const now = Date.now();
  return {
    money: 0,
    gems: 50,
    tapPower: GameConfig.tap.basePower,
    tapLevel: 1,
    tapMultiplier: 1,
    comboCount: 0,
    lastTapAt: 0,
    totalTaps: 0,
    passiveIncome: 0,
    netWorth: 0,
    lifetimeEarnings: 0,
    businesses: INITIAL_BUSINESSES.map((b) => ({ ...b })),
    stocks: INITIAL_STOCKS.map((s) => ({ ...s, priceHistory: [...s.priceHistory] })),
    portfolioValue: 0,
    properties: INITIAL_PROPERTIES.map((p) => ({ ...p })),
    luxuryItems: INITIAL_LUXURY_ITEMS.map((l) => ({ ...l })),
    mutualFunds: INITIAL_MUTUAL_FUNDS.map((f) => ({ ...f, lastCompoundAt: now })),
    prestigeData: {
      count: 0,
      tokens: 0,
      permanentTapMultiplier: 1,
      permanentIncomeMultiplier: 1,
      permanentStockLuck: 0,
      lastPrestigeAt: 0,
    },
    achievements: INITIAL_ACHIEVEMENTS.map((a) => ({ ...a })),
    dailyReward: {
      lastClaimedDate: '',
      currentStreak: 0,
      longestStreak: 0,
      pendingReward: true,
    },
    boosters: {
      incomeBoost2x: { active: false, endsAt: 0 },
      autoClicker: { active: false, endsAt: 0 },
      tapMultiplier3x: { active: false, endsAt: 0 },
      investmentBoost: { active: false, endsAt: 0 },
    },
    events: [],
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      notificationsEnabled: true,
      graphicsQuality: 'high',
      showFps: false,
    },
    casino: {
      tokens: 0,
      totalTokensWon: 0,
      totalTokensLost: 0,
      gamesPlayed: 0,
      biggestWin: 0,
      history: [],
    },
    wheel: {
      lastFreeSpinDate: '',
      totalSpins: 0,
    },
    lottery: {
      ticketsBought: 0,
      lastJackpotAt: 0,
      totalWon: 0,
    },
    lastSaved: now,
    lastActive: now,
    offlineEarnings: 0,
    showOfflineModal: false,
  };
}

// Actions interface — note: prestigeData is the state, performPrestige is the action
export interface GameActions {
  tap: (x: number, y: number) => { value: number; isCritical: boolean };
  upgradeTap: () => boolean;
  buyBusiness: (id: string) => boolean;
  upgradeBusiness: (id: string) => boolean;
  buyStock: (id: string, shares: number) => boolean;
  sellStock: (id: string, shares: number) => boolean;
  tickStockPrices: () => void;
  buyProperty: (id: string) => boolean;
  upgradeProperty: (id: string) => boolean;
  buyLuxuryItem: (id: string) => boolean;
  investInFund: (id: string, amount: number) => boolean;
  withdrawFromFund: (id: string) => boolean;
  compoundFunds: () => void;
  tickPassiveIncome: (deltaMs: number) => void;
  triggerEvent: (event: WorldEvent) => void;
  expireEvents: () => void;
  activateBooster: (key: keyof GameState['boosters']) => boolean;
  autoClickerTick: () => void;
  performPrestige: () => boolean;
  claimDailyReward: () => { gems: number; multiplier: number } | null;
  checkAchievements: () => string[];
  addMoney: (amount: number) => void;
  addGems: (amount: number) => void;
  updateNetWorth: () => void;
  loadSave: () => Promise<void>;
  saveGame: () => Promise<void>;
  resetGame: () => void;
  setShowOfflineModal: (show: boolean) => void;
  setOfflineEarnings: (amount: number) => void;
  updateSettings: (partial: Partial<GameState['settings']>) => void;
  refreshPassiveIncome: () => void;
  buyTokens: (packageId: string) => boolean;
  sellTokens: (amount: number) => number;
  spinWheel: (useGems: boolean) => WheelPrize | null;
  buyLotteryTicket: (tickets: number) => LotteryResult | null;
  playSlots: (bet: number) => CasinoResult | null;
  playCoinFlip: (bet: number, choice: 'heads' | 'tails') => CasinoResult | null;
  playRoulette: (bet: number, betType: 'red' | 'black' | 'even' | 'odd' | 'number', number?: number) => CasinoResult | null;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()((set, get) => ({
  ...buildInitialState(),

  tap(x, y) {
    const state = get();
    const now = Date.now();
    const timeSinceLast = now - state.lastTapAt;
    const isCombo = timeSinceLast < GameConfig.tap.comboWindow;
    const newCombo = isCombo ? state.comboCount + 1 : 1;
    const comboMult = calcComboMultiplier(newCombo);

    const eventMult = state.events
      .filter((e) => e.active && now < e.endAt)
      .reduce((m, e) => m * (e.effect.tapMultiplier ?? 1), 1);

    const boosterMult =
      state.boosters.tapMultiplier3x.active && now < state.boosters.tapMultiplier3x.endsAt ? 3 : 1;

    const rawValue = calcTapValue(
      state.tapPower,
      state.tapLevel,
      state.luxuryItems,
      state.prestigeData,
      comboMult,
      eventMult,
      boosterMult
    );

    const isCritical = Math.random() < GameConfig.tap.criticalChance;
    const finalValue = isCritical ? rawValue * GameConfig.tap.criticalMultiplier : rawValue;

    set(
      produce((draft: GameState) => {
        draft.money += finalValue;
        draft.lifetimeEarnings += finalValue;
        draft.comboCount = newCombo;
        draft.lastTapAt = now;
        draft.totalTaps += 1;
      })
    );

    return { value: finalValue, isCritical };
  },

  upgradeTap() {
    const state = get();
    const cost = calcTapUpgradeCost(state.tapLevel);
    if (state.money < cost) return false;
    set(
      produce((draft: GameState) => {
        draft.money -= cost;
        draft.tapLevel += 1;
        draft.tapPower =
          GameConfig.tap.basePower * Math.pow(GameConfig.tap.tapPowerGrowth, draft.tapLevel - 1);
      })
    );
    return true;
  },

  buyBusiness(id) {
    const state = get();
    const idx = state.businesses.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    const business = state.businesses[idx];
    const cost = calcBusinessCost(business);
    if (state.money < cost) return false;

    set(
      produce((draft: GameState) => {
        const b = draft.businesses[idx];
        draft.money -= cost;
        b.owned = true;
        b.level += 1;
      })
    );
    get().refreshPassiveIncome();
    return true;
  },

  upgradeBusiness(id) {
    const state = get();
    const idx = state.businesses.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    const business = state.businesses[idx];
    if (!business.owned) return false;
    const cost = calcBusinessCost(business);
    if (state.money < cost) return false;

    set(
      produce((draft: GameState) => {
        const b = draft.businesses[idx];
        draft.money -= cost;
        b.level += 1;
      })
    );
    get().refreshPassiveIncome();
    return true;
  },

  buyStock(id, shares) {
    const state = get();
    const idx = state.stocks.findIndex((s) => s.id === id);
    if (idx === -1 || shares <= 0) return false;
    const stock = state.stocks[idx];
    const totalCost = stock.currentPrice * shares;

    const investBoost =
      state.boosters.investmentBoost.active && Date.now() < state.boosters.investmentBoost.endsAt
        ? 0.9
        : 1;
    const effectiveCost = totalCost * investBoost;
    if (state.money < effectiveCost) return false;

    set(
      produce((draft: GameState) => {
        const s = draft.stocks[idx];
        const prevTotal = s.averageBuyPrice * s.sharesOwned;
        const newTotal = prevTotal + stock.currentPrice * shares;
        s.sharesOwned += shares;
        s.averageBuyPrice = s.sharesOwned > 0 ? newTotal / s.sharesOwned : 0;
        draft.money -= effectiveCost;
        draft.portfolioValue = draft.stocks.reduce(
          (sum, st) => sum + st.sharesOwned * st.currentPrice,
          0
        );
      })
    );
    return true;
  },

  sellStock(id, shares) {
    const state = get();
    const idx = state.stocks.findIndex((s) => s.id === id);
    if (idx === -1 || shares <= 0) return false;
    const stock = state.stocks[idx];
    if (stock.sharesOwned < shares) return false;
    const proceeds = stock.currentPrice * shares;

    set(
      produce((draft: GameState) => {
        const s = draft.stocks[idx];
        s.sharesOwned -= shares;
        if (s.sharesOwned === 0) s.averageBuyPrice = 0;
        draft.money += proceeds;
        draft.lifetimeEarnings += Math.max(0, proceeds - stock.averageBuyPrice * shares);
        draft.portfolioValue = draft.stocks.reduce(
          (sum, st) => sum + st.sharesOwned * st.currentPrice,
          0
        );
      })
    );
    return true;
  },

  tickStockPrices() {
    const state = get();
    const now = Date.now();
    const prestigeLuck = state.prestigeData.permanentStockLuck;

    const eventMult = state.events
      .filter((e) => e.active && now < e.endAt)
      .reduce((m, e) => m * (e.effect.stockMultiplier ?? 1), 1);

    set(
      produce((draft: GameState) => {
        draft.stocks.forEach((stock) => {
          const vol = stock.volatility + prestigeLuck * 0.01;

          // ── Each stock evolves INDEPENDENTLY (no shared crash/bull) ──
          // 1) Momentum: a slow random walk that decays toward 0. This gives
          //    each stock its own runs — climbing for a while, then rolling
          //    over — so every chart looks different and uncorrelated.
          let momentum = (stock.momentum ?? 0) * 0.9 + (Math.random() * 2 - 1) * vol * 0.45;
          momentum = Math.max(-vol * 2.5, Math.min(vol * 2.5, momentum));
          stock.momentum = momentum;

          // 2) Per-tick noise (symmetric) + the stock's own drift bias.
          let change = momentum + (Math.random() * 2 - 1) * vol + stock.trend;

          // 3) Mild mean reversion toward base so prices oscillate, not run away.
          const base = stock.basePrice && stock.basePrice > 0 ? stock.basePrice : stock.currentPrice;
          change += ((base - stock.currentPrice) / base) * 0.03;

          // 4) Rare INDEPENDENT shock (this stock only) — earnings surprise.
          if (Math.random() < 0.012) change += (Math.random() * 2 - 1) * vol * 5;

          // Clamp a single tick so prices never teleport.
          change = Math.max(-0.3, Math.min(0.3, change));

          const newPrice = Math.max(1, stock.currentPrice * (1 + change) * eventMult);
          stock.currentPrice = parseFloat(newPrice.toFixed(2));
          // Backfill basePrice for old saves that predate the field.
          if (!stock.basePrice || stock.basePrice <= 0) stock.basePrice = newPrice;
          stock.priceHistory.push(stock.currentPrice);
          if (stock.priceHistory.length > GameConfig.stock.maxHistoryPoints) {
            stock.priceHistory.shift();
          }
        });
        draft.portfolioValue = draft.stocks.reduce(
          (sum, s) => sum + s.sharesOwned * s.currentPrice,
          0
        );
      })
    );
  },

  buyProperty(id) {
    const state = get();
    const idx = state.properties.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const prop = state.properties[idx];
    if (prop.owned || state.money < prop.baseCost) return false;

    set(
      produce((draft: GameState) => {
        const p = draft.properties[idx];
        draft.money -= p.baseCost;
        p.owned = true;
        p.purchasePrice = p.baseCost;
        p.currentValue = p.baseCost;
      })
    );
    get().refreshPassiveIncome();
    return true;
  },

  upgradeProperty(id) {
    const state = get();
    const idx = state.properties.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const prop = state.properties[idx];
    if (!prop.owned) return false;
    const cost = calcPropertyUpgradeCost(prop);
    if (state.money < cost) return false;

    set(
      produce((draft: GameState) => {
        const p = draft.properties[idx];
        draft.money -= cost;
        p.level += 1;
      })
    );
    get().refreshPassiveIncome();
    return true;
  },

  buyLuxuryItem(id) {
    const state = get();
    const idx = state.luxuryItems.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    const item = state.luxuryItems[idx];
    if (item.owned || state.money < item.cost) return false;

    set(
      produce((draft: GameState) => {
        draft.luxuryItems[idx].owned = true;
        draft.money -= item.cost;
      })
    );
    get().refreshPassiveIncome();
    return true;
  },

  investInFund(id, amount) {
    const state = get();
    if (state.money < amount || amount <= 0) return false;
    const idx = state.mutualFunds.findIndex((f) => f.id === id);
    if (idx === -1) return false;

    set(
      produce((draft: GameState) => {
        draft.money -= amount;
        draft.mutualFunds[idx].invested += amount;
        draft.mutualFunds[idx].currentValue += amount;
        if (draft.mutualFunds[idx].lastCompoundAt === 0) {
          draft.mutualFunds[idx].lastCompoundAt = Date.now();
        }
      })
    );
    return true;
  },

  withdrawFromFund(id) {
    const state = get();
    const idx = state.mutualFunds.findIndex((f) => f.id === id);
    if (idx === -1) return false;
    const fund = state.mutualFunds[idx];
    if (fund.currentValue <= 0) return false;

    set(
      produce((draft: GameState) => {
        const f = draft.mutualFunds[idx];
        const returns = f.currentValue - f.invested;
        draft.money += f.currentValue;
        draft.lifetimeEarnings += Math.max(0, returns);
        f.invested = 0;
        f.currentValue = 0;
        f.lastCompoundAt = 0;
      })
    );
    return true;
  },

  compoundFunds() {
    const now = Date.now();
    set(
      produce((draft: GameState) => {
        draft.mutualFunds.forEach((fund) => {
          if (fund.invested <= 0 || fund.lastCompoundAt === 0) return;
          const elapsedMs = now - fund.lastCompoundAt;
          const intervalRate =
            fund.annualReturn * (elapsedMs / (365.25 * 24 * 3600 * 1000));
          fund.currentValue = fund.currentValue * (1 + intervalRate);
          fund.lastCompoundAt = now;
        });
      })
    );
  },

  tickPassiveIncome(deltaMs) {
    const state = get();
    if (state.passiveIncome <= 0) return;
    const earned = state.passiveIncome * (deltaMs / 1000);
    set(
      produce((draft: GameState) => {
        draft.money += earned;
        draft.lifetimeEarnings += earned;
        draft.properties.forEach((p) => {
          if (!p.owned) return;
          const elapsed = deltaMs / 1000;
          p.currentValue *= Math.pow(1 + p.appreciationRate, elapsed);
        });
      })
    );
  },

  triggerEvent(event) {
    set(
      produce((draft: GameState) => {
        draft.events = draft.events.filter((e) => e.id !== event.id);
        draft.events.push(event);
      })
    );
  },

  expireEvents() {
    const now = Date.now();
    set(
      produce((draft: GameState) => {
        draft.events = draft.events.map((e) => ({
          ...e,
          active: e.active && now < e.endAt,
        }));
      })
    );
  },

  activateBooster(key) {
    const now = Date.now();
    const state = get();
    const durations: Record<keyof GameState['boosters'], number> = {
      incomeBoost2x: GameConfig.booster.duration2xIncome,
      autoClicker: GameConfig.booster.durationAutoClicker,
      tapMultiplier3x: GameConfig.booster.durationTapMultiplier,
      investmentBoost: GameConfig.booster.durationInvestmentBoost,
    };
    const cost = GameConfig.booster.gemCosts[key];

    // Already running, or can't afford → do nothing (and report failure).
    const current = state.boosters[key] as { active: boolean; endsAt: number };
    if (current.active && now < current.endsAt) return false;
    if (state.gems < cost) return false;

    set(
      produce((draft: GameState) => {
        draft.gems -= cost; // actually charge the diamonds
        const b = draft.boosters[key] as { active: boolean; endsAt: number };
        b.active = true;
        b.endsAt = now + durations[key];
      })
    );
    return true;
  },

  autoClickerTick() {
    const state = get();
    const now = Date.now();
    const ac = state.boosters.autoClicker;
    if (!ac.active || now >= ac.endsAt) return;

    const eventMult = state.events
      .filter((e) => e.active && now < e.endAt)
      .reduce((m, e) => m * (e.effect.tapMultiplier ?? 1), 1);

    const tapVal = calcTapValue(
      state.tapPower,
      state.tapLevel,
      state.luxuryItems,
      state.prestigeData,
      1,
      eventMult,
      1
    );
    const gain = tapVal * GameConfig.booster.autoClickerTapValue;
    if (gain <= 0) return;

    set(
      produce((draft: GameState) => {
        draft.money += gain;
        draft.lifetimeEarnings += gain;
        draft.totalTaps += 1;
      })
    );
  },

  performPrestige() {
    const state = get();
    const required = calcPrestigeRequirement(state.prestigeData.count);
    if (state.netWorth < required) return false;
    const tokens = calcPrestigeTokens(state.netWorth, state.prestigeData.count);

    set(
      produce((draft: GameState) => {
        const newTokens = draft.prestigeData.tokens + tokens;
        const newCount = draft.prestigeData.count + 1;
        const tapBoost = 1 + newTokens * GameConfig.prestige.tapBoostPerToken;
        const incomeBoost = 1 + newTokens * GameConfig.prestige.incomeBoostPerToken;
        const stockLuck = newTokens * GameConfig.prestige.stockLuckPerToken;

        const savedPrestige: PrestigeState = {
          count: newCount,
          tokens: newTokens,
          permanentTapMultiplier: tapBoost,
          permanentIncomeMultiplier: incomeBoost,
          permanentStockLuck: stockLuck,
          lastPrestigeAt: Date.now(),
        };

        const savedAchievements = draft.achievements.map((a) => ({ ...a }));
        const savedSettings = { ...draft.settings };
        const savedGems = draft.gems + tokens * 10;

        const fresh = buildInitialState();
        Object.assign(draft, fresh);
        draft.prestigeData = savedPrestige;
        draft.achievements = savedAchievements;
        draft.settings = savedSettings;
        draft.gems = savedGems;
      })
    );
    get().refreshPassiveIncome();
    return true;
  },

  claimDailyReward() {
    const state = get();
    const today = new Date().toDateString();
    if (state.dailyReward.lastClaimedDate === today) return null;

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const isStreak = state.dailyReward.lastClaimedDate === yesterday;
    const newStreak = isStreak ? state.dailyReward.currentStreak + 1 : 1;

    const baseGems = GameConfig.dailyReward.baseGems;
    const streakBonus =
      Math.min(newStreak - 1, GameConfig.dailyReward.maxStreakBonus) *
      GameConfig.dailyReward.streakBonusGems;
    const totalGems = baseGems + streakBonus;
    const multiplier = 1 + newStreak * 0.05;

    set(
      produce((draft: GameState) => {
        draft.gems += totalGems;
        draft.dailyReward = {
          lastClaimedDate: today,
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, draft.dailyReward.longestStreak),
          pendingReward: false,
        };
      })
    );

    return { gems: totalGems, multiplier };
  },

  checkAchievements() {
    const state = get();
    const unlocked: string[] = [];

    set(
      produce((draft: GameState) => {
        draft.achievements.forEach((ach) => {
          if (ach.unlocked) return;

          const cond = ach.condition;
          let met = false;

          if (cond.type === 'money') {
            ach.progress = Math.min(state.lifetimeEarnings, cond.amount);
            met = state.lifetimeEarnings >= cond.amount;
          } else if (cond.type === 'net_worth') {
            ach.progress = Math.min(state.netWorth, cond.amount);
            met = state.netWorth >= cond.amount;
          } else if (cond.type === 'passive_income') {
            ach.progress = Math.min(state.passiveIncome, cond.amount);
            met = state.passiveIncome >= cond.amount;
          } else if (cond.type === 'tap_count') {
            ach.progress = Math.min(state.totalTaps, cond.count);
            met = state.totalTaps >= cond.count;
          } else if (cond.type === 'business_count') {
            const owned = state.businesses.filter((b) => b.owned).length;
            ach.progress = Math.min(owned, cond.count);
            met = owned >= cond.count;
          } else if (cond.type === 'luxury_owned') {
            met = state.luxuryItems.some((l) => l.id === cond.id && l.owned);
            ach.progress = met ? 1 : 0;
          } else if (cond.type === 'prestige_count') {
            ach.progress = Math.min(state.prestigeData.count, cond.count);
            met = state.prestigeData.count >= cond.count;
          } else if (cond.type === 'property_owned') {
            const owned = state.properties.filter((p) => p.owned).length;
            ach.progress = Math.min(owned, cond.count);
            met = owned >= cond.count;
          }

          if (met) {
            ach.unlocked = true;
            ach.unlockedAt = Date.now();
            unlocked.push(ach.id);
            if (ach.reward.gems) draft.gems += ach.reward.gems;
            if (ach.reward.incomeMultiplier) {
              draft.prestigeData.permanentIncomeMultiplier *= ach.reward.incomeMultiplier;
            }
            if (ach.reward.tapMultiplier) {
              draft.prestigeData.permanentTapMultiplier *= ach.reward.tapMultiplier;
            }
          }
        });
      })
    );

    return unlocked;
  },

  addMoney(amount) {
    set(
      produce((draft: GameState) => {
        draft.money += amount;
        draft.lifetimeEarnings += amount;
      })
    );
  },

  addGems(amount) {
    set(produce((draft: GameState) => { draft.gems += amount; }));
  },

  updateNetWorth() {
    const state = get();
    const nw = calcNetWorth(
      state.money,
      state.stocks,
      state.properties,
      state.luxuryItems,
      state.mutualFunds
    );
    set(produce((draft: GameState) => { draft.netWorth = nw; }));
  },

  refreshPassiveIncome() {
    const state = get();
    const now = Date.now();
    const eventMult = state.events
      .filter((e) => e.active && now < e.endAt)
      .reduce((m, e) => m * (e.effect.businessMultiplier ?? 1), 1);
    const boosterMult =
      state.boosters.incomeBoost2x.active && now < state.boosters.incomeBoost2x.endsAt ? 2 : 1;

    const income = calcTotalPassiveIncome(
      state.businesses,
      state.properties,
      state.luxuryItems,
      state.prestigeData,
      eventMult,
      boosterMult
    );
    set(produce((draft: GameState) => { draft.passiveIncome = income; }));
  },

  async loadSave() {
    const saved = await Storage.loadGame<Partial<GameState>>();
    const now = Date.now();

    if (!saved) {
      set(produce((draft: GameState) => {
        draft.dailyReward.pendingReward = true;
        draft.lastActive = now;
      }));
      return;
    }

    const elapsed = now - (saved.lastActive ?? now);
    const merged: GameState = { ...buildInitialState(), ...saved };
    set(merged);

    const state = get();
    const passive = calcTotalPassiveIncome(
      state.businesses,
      state.properties,
      state.luxuryItems,
      state.prestigeData,
      1,
      1
    );

    if (elapsed > 5000 && passive > 0) {
      const offline = calcOfflineEarnings(passive, elapsed);
      if (offline > 0) {
        set(produce((draft: GameState) => {
          draft.offlineEarnings = offline;
          draft.showOfflineModal = true;
          draft.passiveIncome = passive;
        }));
      }
    } else {
      set(produce((draft: GameState) => { draft.passiveIncome = passive; }));
    }

    const today = new Date().toDateString();
    if (saved.dailyReward?.lastClaimedDate !== today) {
      set(produce((draft: GameState) => { draft.dailyReward.pendingReward = true; }));
    }
  },

  async saveGame() {
    const state = get();
    const toSave: GameState = { ...state, lastActive: Date.now() };
    await Storage.saveGame(toSave);
    set(produce((draft: GameState) => { draft.lastSaved = Date.now(); }));
  },

  resetGame() {
    set(buildInitialState());
    Storage.clearAll();
  },

  setShowOfflineModal(show) {
    set(produce((draft: GameState) => { draft.showOfflineModal = show; }));
  },

  setOfflineEarnings(amount) {
    set(produce((draft: GameState) => {
      if (amount > 0) {
        draft.money += amount;
        draft.lifetimeEarnings += amount;
      }
      draft.offlineEarnings = 0;
      draft.showOfflineModal = false;
    }));
  },

  updateSettings(partial) {
    set(produce((draft: GameState) => {
      Object.assign(draft.settings, partial);
    }));
  },

  buyTokens(packageId) {
    const TOKEN_PACKAGES: Record<string, { tokens: number; cost: number }> = {
      starter:  { tokens: 100,   cost: 500 },
      medium:   { tokens: 500,   cost: 2000 },
      big:      { tokens: 1500,  cost: 5000 },
      mega:     { tokens: 5000,  cost: 15000 },
      whale:    { tokens: 20000, cost: 50000 },
    };
    const pkg = TOKEN_PACKAGES[packageId];
    if (!pkg) return false;
    const state = get();
    if (state.money < pkg.cost) return false;
    set(produce((draft: GameState) => {
      draft.money -= pkg.cost;
      draft.casino.tokens += pkg.tokens;
    }));
    return true;
  },

  sellTokens(amount) {
    // Cash out tokens to money. Buy rate is $5/token; sell rate is $2/token
    // (house keeps the spread). Returns cash gained, or 0 if invalid.
    const SELL_RATE = 2;
    const state = get();
    const qty = Math.floor(amount);
    if (qty <= 0 || state.casino.tokens < qty) return 0;
    const cash = qty * SELL_RATE;
    set(produce((draft: GameState) => {
      draft.casino.tokens -= qty;
      draft.money += cash;
    }));
    return cash;
  },

  playSlots(bet) {
    const state = get();
    if (state.casino.tokens < bet || bet <= 0) return null;

    // Weighted reels — high-value symbols are RARE. Only triples pay; pairs lose.
    // House keeps a strong edge so wins are uncommon.
    const SYMBOL_WEIGHTS: { s: string; w: number; mult: number }[] = [
      { s: '🍋', w: 32, mult: 1.5 },
      { s: '🍒', w: 26, mult: 2 },
      { s: '🍇', w: 18, mult: 3 },
      { s: '⭐', w: 11, mult: 5 },
      { s: '🎰', w: 7,  mult: 8 },
      { s: '💎', w: 4,  mult: 12 },
      { s: '7️⃣', w: 2,  mult: 20 },
      { s: '💰', w: 1,  mult: 40 },
    ];
    const TOTAL_W = SYMBOL_WEIGHTS.reduce((a, b) => a + b.w, 0);
    const spinReel = (): string => {
      let r = Math.random() * TOTAL_W;
      for (const item of SYMBOL_WEIGHTS) {
        if (r < item.w) return item.s;
        r -= item.w;
      }
      return SYMBOL_WEIGHTS[0].s;
    };

    const reel1 = spinReel();
    const reel2 = spinReel();
    const reel3 = spinReel();

    let payout = 0;
    let detail = `${reel1} ${reel2} ${reel3}`;
    let won = false;

    if (reel1 === reel2 && reel2 === reel3) {
      const mult = SYMBOL_WEIGHTS.find((x) => x.s === reel1)?.mult ?? 1.5;
      payout = Math.floor(bet * mult);
      detail = `${reel1} ${reel2} ${reel3} — JACKPOT! ${mult}x`;
      won = true;
    } else {
      detail = `${reel1} ${reel2} ${reel3} — No match`;
    }

    const net = payout - bet;
    const result: CasinoResult = {
      game: 'slots',
      bet,
      payout,
      net,
      won,
      detail,
      timestamp: Date.now(),
    };

    set(produce((draft: GameState) => {
      draft.casino.tokens -= bet;
      draft.casino.tokens += payout;
      draft.casino.gamesPlayed += 1;
      if (won) {
        draft.casino.totalTokensWon += payout;
        if (payout > draft.casino.biggestWin) draft.casino.biggestWin = payout;
      } else {
        draft.casino.totalTokensLost += bet;
      }
      draft.casino.history = [result, ...draft.casino.history.slice(0, 49)];
    }));

    return result;
  },

  playCoinFlip(bet, choice) {
    const state = get();
    if (state.casino.tokens < bet || bet <= 0) return null;

    // House edge: your pick wins only 44% of the time, payout 1.95x
    const userWins = Math.random() < 0.44;
    const flip = userWins ? choice : choice === 'heads' ? 'tails' : 'heads';
    const won = userWins;
    const payout = won ? Math.floor(bet * 1.95) : 0;
    const net = payout - bet;

    const result: CasinoResult = {
      game: 'coinflip',
      bet,
      payout,
      net,
      won,
      detail: `${choice === 'heads' ? '🪙' : '🔵'} You picked ${choice} — landed ${flip}`,
      timestamp: Date.now(),
    };

    set(produce((draft: GameState) => {
      draft.casino.tokens -= bet;
      draft.casino.tokens += payout;
      draft.casino.gamesPlayed += 1;
      if (won) {
        draft.casino.totalTokensWon += payout;
        if (payout > draft.casino.biggestWin) draft.casino.biggestWin = payout;
      } else {
        draft.casino.totalTokensLost += bet;
      }
      draft.casino.history = [result, ...draft.casino.history.slice(0, 49)];
    }));

    return result;
  },

  playRoulette(bet, betType, number) {
    const state = get();
    if (state.casino.tokens < bet || bet <= 0) return null;

    const spin = Math.floor(Math.random() * 37); // 0-36
    const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

    let won = false;
    let mult = 0;

    switch (betType) {
      case 'red':
        won = spin !== 0 && RED_NUMBERS.has(spin);
        mult = 1.8;
        break;
      case 'black':
        won = spin !== 0 && !RED_NUMBERS.has(spin);
        mult = 1.8;
        break;
      case 'even':
        won = spin !== 0 && spin % 2 === 0;
        mult = 1.8;
        break;
      case 'odd':
        won = spin !== 0 && spin % 2 !== 0;
        mult = 1.8;
        break;
      case 'number':
        won = spin === number;
        mult = 30;
        break;
    }

    const payout = won ? Math.floor(bet * mult) : 0;
    const net = payout - bet;
    const spinColor = spin === 0 ? '🟢' : RED_NUMBERS.has(spin) ? '🔴' : '⚫';

    const result: CasinoResult = {
      game: 'roulette',
      bet,
      payout,
      net,
      won,
      detail: `${spinColor} Ball landed on ${spin} — bet: ${betType}${number !== undefined ? ' ' + number : ''}`,
      timestamp: Date.now(),
    };

    set(produce((draft: GameState) => {
      draft.casino.tokens -= bet;
      draft.casino.tokens += payout;
      draft.casino.gamesPlayed += 1;
      if (won) {
        draft.casino.totalTokensWon += payout;
        if (payout > draft.casino.biggestWin) draft.casino.biggestWin = payout;
      } else {
        draft.casino.totalTokensLost += bet;
      }
      draft.casino.history = [result, ...draft.casino.history.slice(0, 49)];
    }));

    return result;
  },

  spinWheel(useGems) {
    const state = get();
    const today = new Date().toDateString();
    const hasFree = state.wheel.lastFreeSpinDate !== today;
    const GEM_COST = 3;

    if (!hasFree && useGems && state.gems < GEM_COST) return null;
    if (!hasFree && !useGems) return null;

    const income = state.passiveIncome > 0 ? state.passiveIncome : 1;

    // Weighted pick over the SHARED segment list, so the visual wheel can land
    // on exactly this index.
    const totalW = WHEEL_SEGMENTS.reduce((a, b) => a + b.weight, 0);
    let r = Math.random() * totalW;
    let index = 0;
    for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
      if (r < WHEEL_SEGMENTS[i].weight) { index = i; break; }
      r -= WHEEL_SEGMENTS[i].weight;
    }

    const seg = WHEEL_SEGMENTS[index];
    const amount = wheelAmountFor(index, income, state.tapPower);
    const prize: WheelPrize = {
      type: seg.type,
      label: seg.label,
      emoji: seg.emoji,
      color: seg.color,
      amount,
      index,
    };

    set(produce((draft: GameState) => {
      if (hasFree) {
        draft.wheel.lastFreeSpinDate = today;
      } else {
        draft.gems -= GEM_COST;
      }
      draft.wheel.totalSpins += 1;

      if (prize.type === 'money') {
        draft.money += amount;
        draft.lifetimeEarnings += amount;
      } else if (prize.type === 'gems') {
        draft.gems += amount;
      } else if (prize.type === 'tokens') {
        draft.casino.tokens += amount;
      } else if (prize.type === 'multiplier') {
        draft.boosters.incomeBoost2x.active = true;
        draft.boosters.incomeBoost2x.endsAt = Date.now() + amount;
      }
    }));

    return prize;
  },

  buyLotteryTicket(tickets) {
    const state = get();
    const TICKET_PRICE = Math.max(100, state.netWorth * 0.001);
    const totalCost = TICKET_PRICE * tickets;
    if (state.money < totalCost || tickets <= 0) return null;

    let bestPrize: LotteryResult = { won: false, prize: 0, tier: 'nothing', label: '😞 No luck this time' };

    for (let i = 0; i < tickets; i++) {
      const roll = Math.random();
      if (roll < 0.0003) {
        const jackpot = totalCost * 500;
        bestPrize = { won: true, prize: jackpot, tier: 'jackpot', label: `🎉 JACKPOT!` };
        break;
      } else if (roll < 0.02) {
        const p = totalCost * 8;
        if (p > bestPrize.prize) bestPrize = { won: true, prize: p, tier: 'major', label: '🥇 Major Win!' };
      } else if (roll < 0.15) {
        const p = TICKET_PRICE * 2;
        if (p > bestPrize.prize) bestPrize = { won: true, prize: p, tier: 'minor', label: '🎟️ Small Win' };
      }
    }

    set(produce((draft: GameState) => {
      draft.money -= totalCost;
      if (bestPrize.won) {
        draft.money += bestPrize.prize;
        draft.lifetimeEarnings += bestPrize.prize;
        draft.lottery.totalWon += bestPrize.prize;
        if (bestPrize.tier === 'jackpot') draft.lottery.lastJackpotAt = Date.now();
      }
      draft.lottery.ticketsBought += tickets;
    }));

    return bestPrize;
  },

}));
