import { WorldEvent } from '../types/game';
import { GameConfig } from '../constants/gameConfig';

const EVENT_TEMPLATES: Omit<WorldEvent, 'id' | 'startAt' | 'endAt' | 'active'>[] = [
  {
    name: 'Crypto Boom',
    description: 'Crypto markets explode! All stocks surge.',
    emoji: '🚀',
    effect: { stockMultiplier: 1.3, tapMultiplier: 1.2 },
  },
  {
    name: 'AI Revolution',
    description: 'AI reshapes all industries. Business income +50%!',
    emoji: '🤖',
    effect: { businessMultiplier: 1.5, stockMultiplier: 1.2 },
  },
  {
    name: 'Market Crash',
    description: 'Global markets plunge. Stocks down!',
    emoji: '📉',
    effect: { stockMultiplier: 0.6 },
  },
  {
    name: 'Real Estate Surge',
    description: 'Property values skyrocket!',
    emoji: '🏠',
    effect: { propertyMultiplier: 1.4, businessMultiplier: 1.2 },
  },
  {
    name: 'Gold Rush',
    description: 'Resources scarce. Tap power doubled!',
    emoji: '⛏️',
    effect: { tapMultiplier: 2.0, businessMultiplier: 1.3 },
  },
  {
    name: 'Tech Boom',
    description: 'Tech stocks soar. AI companies profit!',
    emoji: '💻',
    effect: { stockMultiplier: 1.4, businessMultiplier: 1.25 },
  },
  {
    name: 'Recession Warning',
    description: 'Economy slows. Property holds strong.',
    emoji: '⚠️',
    effect: { stockMultiplier: 0.75, propertyMultiplier: 1.1 },
  },
];

export function generateRandomEvent(): WorldEvent {
  const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  const now = Date.now();
  const duration =
    GameConfig.events.minDurationMs +
    Math.random() * (GameConfig.events.maxDurationMs - GameConfig.events.minDurationMs);

  return {
    ...template,
    id: `event_${now}_${Math.random().toString(36).substr(2, 6)}`,
    startAt: now,
    endAt: now + duration,
    active: true,
  };
}

export function shouldTriggerEvent(): boolean {
  return Math.random() < GameConfig.events.chance;
}
