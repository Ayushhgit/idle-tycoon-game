import { WheelPrizeType } from '../types/game';

export interface WheelSegmentDef {
  type: WheelPrizeType;
  label: string;
  emoji: string;
  color: string;
  weight: number;
}

// Single source of truth — both the store (reward logic) and the FortuneWheel
// component (visual wedges) read this array, so the wheel ALWAYS lands on the
// exact prize awarded. Index order must never be reordered independently.
export const WHEEL_SEGMENTS: WheelSegmentDef[] = [
  { type: 'money',      label: 'Small Cash',   emoji: '💵', color: '#E6CD92', weight: 22 },
  { type: 'gems',       label: '5 Gems',       emoji: '💎', color: '#26C6DA', weight: 12 },
  { type: 'money',      label: 'Big Cash',     emoji: '🤑', color: '#CDA765', weight: 8 },
  { type: 'nothing',    label: 'Try Again',    emoji: '💨', color: '#5C6BC0', weight: 16 },
  { type: 'tokens',     label: '50 Tokens',    emoji: '🎫', color: '#9D8CFF', weight: 10 },
  { type: 'gems',       label: '15 Gems',      emoji: '💎', color: '#00ACC1', weight: 6 },
  { type: 'money',      label: 'Tap Stash',    emoji: '💸', color: '#A2803E', weight: 12 },
  { type: 'tokens',     label: '200 Tokens',   emoji: '🎰', color: '#CE93D8', weight: 5 },
  { type: 'nothing',    label: 'Nothing',      emoji: '🌀', color: '#455A64', weight: 15 },
  { type: 'multiplier', label: '2x Boost',     emoji: '⚡', color: '#FF5C7A', weight: 4 },
];

// Amount per segment — depends on live game state, so computed at spin time.
export function wheelAmountFor(index: number, income: number, tapPower: number): number {
  switch (index) {
    case 0: return Math.max(100, income * 30);
    case 1: return 5;
    case 2: return Math.max(500, income * 120);
    case 3: return 0;
    case 4: return 50;
    case 5: return 15;
    case 6: return Math.max(250, tapPower * 60);
    case 7: return 200;
    case 8: return 0;
    case 9: return 60_000; // booster duration ms
    default: return 0;
  }
}
