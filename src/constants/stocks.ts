import { Stock } from '../types/game';
import { Colors } from './colors';

// Each stock has its own personality via volatility + trend (drift direction)
// + momentum (evolves independently each tick). No shared/global movement, so
// their graphs diverge — some climbing, some sliding, all at different speeds.
export const INITIAL_STOCKS: Stock[] = [
  {
    // Steady tech grower — calm, mild upward bias.
    id: 'techx',
    name: 'TechX Corp',
    ticker: 'TXC',
    currentPrice: 100,
    basePrice: 100,
    priceHistory: Array.from({ length: 30 }, () => 100 + (Math.random() - 0.5) * 18),
    sharesOwned: 0,
    averageBuyPrice: 0,
    volatility: 0.045,
    trend: 0.0012,
    momentum: 0,
    sector: 'Technology',
    color: Colors.stock.techx,
  },
  {
    // Mature automaker — low volatility, slowly declining.
    id: 'autocorp',
    name: 'AutoCorp Industries',
    ticker: 'ACI',
    currentPrice: 250,
    basePrice: 250,
    priceHistory: Array.from({ length: 30 }, () => 250 + (Math.random() - 0.5) * 24),
    sharesOwned: 0,
    averageBuyPrice: 0,
    volatility: 0.03,
    trend: -0.0011,
    momentum: 0,
    sector: 'Automotive',
    color: Colors.stock.autocorp,
  },
  {
    // Energy mid-cap — swingy, choppy sideways.
    id: 'greenenergy',
    name: 'GreenEnergy Ltd',
    ticker: 'GEL',
    currentPrice: 75,
    basePrice: 75,
    priceHistory: Array.from({ length: 30 }, () => 75 + (Math.random() - 0.5) * 16),
    sharesOwned: 0,
    averageBuyPrice: 0,
    volatility: 0.07,
    trend: 0.0003,
    momentum: 0,
    sector: 'Energy',
    color: Colors.stock.green,
  },
  {
    // AI hype stock — wild, big momentum swings both ways.
    id: 'futureai',
    name: 'FutureAI Systems',
    ticker: 'FAI',
    currentPrice: 500,
    basePrice: 500,
    priceHistory: Array.from({ length: 30 }, () => 500 + (Math.random() - 0.5) * 90),
    sharesOwned: 0,
    averageBuyPrice: 0,
    volatility: 0.11,
    trend: 0.0009,
    momentum: 0,
    sector: 'AI',
    color: Colors.stock.ai,
  },
  {
    // Quantum moonshot — most volatile, currently bleeding.
    id: 'quantumlabs',
    name: 'Quantum Labs',
    ticker: 'QTM',
    currentPrice: 1200,
    basePrice: 1200,
    priceHistory: Array.from({ length: 30 }, () => 1200 + (Math.random() - 0.5) * 160),
    sharesOwned: 0,
    averageBuyPrice: 0,
    volatility: 0.15,
    trend: -0.0015,
    momentum: 0,
    sector: 'Quantum',
    color: Colors.stock.quantum,
  },
];
