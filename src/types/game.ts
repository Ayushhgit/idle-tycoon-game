export interface Business {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  baseIncome: number;
  level: number;
  owned: boolean;
  multiplier: number;
  unlockAt: number;
  description: string;
}

export interface Stock {
  id: string;
  name: string;
  ticker: string;
  currentPrice: number;
  basePrice: number;
  priceHistory: number[];
  sharesOwned: number;
  averageBuyPrice: number;
  volatility: number;
  trend: number;
  momentum: number;
  sector: string;
  color: string;
}

export interface Property {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  rentPerSec: number;
  appreciationRate: number;
  level: number;
  owned: boolean;
  purchasePrice: number;
  currentValue: number;
  description: string;
}

export interface LuxuryItem {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  owned: boolean;
  prestigeBonus: number;
  incomeMultiplier: number;
  tapMultiplier: number;
  description: string;
  category: 'car' | 'watch' | 'yacht' | 'jet' | 'mansion';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: AchievementCondition;
  reward: AchievementReward;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  target: number;
}

export type AchievementCondition =
  | { type: 'money'; amount: number }
  | { type: 'business_count'; count: number }
  | { type: 'net_worth'; amount: number }
  | { type: 'passive_income'; amount: number }
  | { type: 'tap_count'; count: number }
  | { type: 'luxury_owned'; id: string }
  | { type: 'prestige_count'; count: number }
  | { type: 'property_owned'; count: number };

export interface AchievementReward {
  gems?: number;
  tapMultiplier?: number;
  incomeMultiplier?: number;
}

export type PrestigeUpgradeTrack = 'income' | 'tap' | 'luck' | 'offline';

export interface PrestigeUpgrades {
  income: number;
  tap: number;
  luck: number;
  offline: number;
}

export interface PrestigeState {
  count: number;
  tokens: number;
  permanentTapMultiplier: number;
  permanentIncomeMultiplier: number;
  permanentStockLuck: number;
  permanentOfflineMultiplier: number;
  upgrades: PrestigeUpgrades;
  lastPrestigeAt: number;
}

export interface DailyRewardState {
  lastClaimedDate: string;
  currentStreak: number;
  longestStreak: number;
  pendingReward: boolean;
}

export interface BoosterState {
  incomeBoost2x: { active: boolean; endsAt: number };
  autoClicker: { active: boolean; endsAt: number };
  tapMultiplier3x: { active: boolean; endsAt: number };
  investmentBoost: { active: boolean; endsAt: number };
}

export interface WorldEvent {
  id: string;
  name: string;
  description: string;
  emoji: string;
  effect: EventEffect;
  startAt: number;
  endAt: number;
  active: boolean;
}

export interface EventEffect {
  stockMultiplier?: number;
  businessMultiplier?: number;
  propertyMultiplier?: number;
  tapMultiplier?: number;
}

export interface MutualFund {
  id: string;
  name: string;
  description: string;
  riskLevel: 'safe' | 'growth' | 'aggressive';
  /** Mean return per minute of play (game-paced, not annual). */
  ratePerMin: number;
  /** Risk: fraction of the mean rate that the realized rate can swing each
   *  tick (0 = steady, >1 = can post a losing tick). */
  volatility: number;
  invested: number;
  currentValue: number;
  lastCompoundAt: number;
}

export interface SettingsState {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
  showFps: boolean;
}

export interface FloatingNumberItem {
  id: string;
  value: number;
  x: number;
  y: number;
  isCritical: boolean;
}

export type CasinoGameType = 'slots' | 'coinflip' | 'roulette' | 'blackjack' | 'teenpatti';

export interface CasinoResult {
  game: CasinoGameType;
  bet: number;
  payout: number;
  net: number;
  won: boolean;
  detail: string;
  timestamp: number;
}

export interface CasinoState {
  tokens: number;
  totalTokensWon: number;
  totalTokensLost: number;
  gamesPlayed: number;
  biggestWin: number;
  history: CasinoResult[];
}

export type WheelPrizeType = 'money' | 'gems' | 'tokens' | 'multiplier' | 'nothing';

export interface WheelPrize {
  type: WheelPrizeType;
  label: string;
  emoji: string;
  amount: number;
  color: string;
  index: number;
}

export interface WheelState {
  lastFreeSpinDate: string;
  totalSpins: number;
}

export interface LotteryState {
  ticketsBought: number;
  lastJackpotAt: number;
  totalWon: number;
}

export interface LotteryResult {
  won: boolean;
  prize: number;
  tier: 'jackpot' | 'major' | 'minor' | 'nothing';
  label: string;
}

export interface TokenPackage {
  id: string;
  tokens: number;
  cost: number;
  label: string;
  bonus: string;
}

export interface GameState {
  money: number;
  gems: number;
  tapPower: number;
  tapLevel: number;
  tapMultiplier: number;
  comboCount: number;
  lastTapAt: number;
  totalTaps: number;
  passiveIncome: number;
  netWorth: number;
  lifetimeEarnings: number;
  businesses: Business[];
  stocks: Stock[];
  portfolioValue: number;
  properties: Property[];
  luxuryItems: LuxuryItem[];
  mutualFunds: MutualFund[];
  prestigeData: PrestigeState;
  achievements: Achievement[];
  dailyReward: DailyRewardState;
  boosters: BoosterState;
  events: WorldEvent[];
  settings: SettingsState;
  casino: CasinoState;
  wheel: WheelState;
  lottery: LotteryState;
  lastSaved: number;
  lastActive: number;
  offlineEarnings: number;
  showOfflineModal: boolean;
}

export type TabName = 'tap' | 'business' | 'stocks' | 'property' | 'luxury' | 'casino' | 'prestige';
