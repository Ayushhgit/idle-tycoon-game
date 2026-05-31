import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { GameConfig } from '../constants/gameConfig';
import { WorldEvent } from '../types/game';

const WORLD_EVENT_TEMPLATES: Omit<WorldEvent, 'id' | 'startAt' | 'endAt' | 'active'>[] = [
  {
    name: 'Crypto Boom',
    description: 'Cryptocurrency explodes! Stocks surge 30%.',
    emoji: '🚀',
    effect: { stockMultiplier: 1.3, tapMultiplier: 1.2 },
  },
  {
    name: 'AI Revolution',
    description: 'AI reshapes business. Income +50%!',
    emoji: '🤖',
    effect: { businessMultiplier: 1.5, stockMultiplier: 1.2 },
  },
  {
    name: 'Market Crash',
    description: 'Markets plunge. Stocks down 40%.',
    emoji: '📉',
    effect: { stockMultiplier: 0.6 },
  },
  {
    name: 'Real Estate Boom',
    description: 'Properties skyrocket +40% rent!',
    emoji: '🏠',
    effect: { propertyMultiplier: 1.4, businessMultiplier: 1.2 },
  },
  {
    name: 'Gold Rush',
    description: 'Resources in demand. Tap power x2!',
    emoji: '⛏️',
    effect: { tapMultiplier: 2.0, businessMultiplier: 1.3 },
  },
];

export function useGameLoop() {
  const tickPassiveIncome = useGameStore((s) => s.tickPassiveIncome);
  const tickStockPrices = useGameStore((s) => s.tickStockPrices);
  const compoundFunds = useGameStore((s) => s.compoundFunds);
  const updateNetWorth = useGameStore((s) => s.updateNetWorth);
  const checkAchievements = useGameStore((s) => s.checkAchievements);
  const autoClickerTick = useGameStore((s) => s.autoClickerTick);
  const triggerEvent = useGameStore((s) => s.triggerEvent);
  const expireEvents = useGameStore((s) => s.expireEvents);
  const saveGame = useGameStore((s) => s.saveGame);
  const refreshPassiveIncome = useGameStore((s) => s.refreshPassiveIncome);

  const lastTickRef = useRef(Date.now());
  const lastStockTickRef = useRef(Date.now());
  const lastSaveRef = useRef(Date.now());
  const lastEventCheckRef = useRef(Date.now());
  const lastFundTickRef = useRef(Date.now());
  const lastAchievementCheckRef = useRef(Date.now());
  const lastAutoClickRef = useRef(Date.now());
  const animFrameRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const gameLoop = useCallback(() => {
    if (!mountedRef.current) return;

    const now = Date.now();

    const deltaTick = now - lastTickRef.current;
    if (deltaTick >= GameConfig.passive.tickIntervalMs) {
      tickPassiveIncome(deltaTick);
      lastTickRef.current = now;
    }

    const deltaStock = now - lastStockTickRef.current;
    if (deltaStock >= GameConfig.stock.updateIntervalMs) {
      tickStockPrices();
      lastStockTickRef.current = now;
    }

    const deltaFund = now - lastFundTickRef.current;
    if (deltaFund >= GameConfig.fund.compoundIntervalMs) {
      compoundFunds();
      lastFundTickRef.current = now;
    }

    const deltaAch = now - lastAchievementCheckRef.current;
    if (deltaAch >= 2000) {
      updateNetWorth();
      checkAchievements();
      lastAchievementCheckRef.current = now;
    }

    const deltaAutoClick = now - lastAutoClickRef.current;
    if (deltaAutoClick >= GameConfig.booster.autoClickerIntervalMs) {
      autoClickerTick();
      lastAutoClickRef.current = now;
    }

    const deltaEvent = now - lastEventCheckRef.current;
    if (deltaEvent >= GameConfig.events.checkIntervalMs) {
      expireEvents();
      if (Math.random() < GameConfig.events.chance) {
        const template =
          WORLD_EVENT_TEMPLATES[Math.floor(Math.random() * WORLD_EVENT_TEMPLATES.length)];
        const duration =
          GameConfig.events.minDurationMs +
          Math.random() * (GameConfig.events.maxDurationMs - GameConfig.events.minDurationMs);
        triggerEvent({
          ...template,
          id: `${template.name.replace(/\s/g, '_')}_${now}`,
          startAt: now,
          endAt: now + duration,
          active: true,
        });
      }
      refreshPassiveIncome();
      lastEventCheckRef.current = now;
    }

    const deltaSave = now - lastSaveRef.current;
    if (deltaSave >= GameConfig.save.intervalMs) {
      saveGame();
      lastSaveRef.current = now;
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [
    tickPassiveIncome,
    tickStockPrices,
    compoundFunds,
    updateNetWorth,
    checkAchievements,
    autoClickerTick,
    triggerEvent,
    expireEvents,
    refreshPassiveIncome,
    saveGame,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    animFrameRef.current = requestAnimationFrame(gameLoop);

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        lastTickRef.current = Date.now();
        refreshPassiveIncome();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
      sub.remove();
    };
  }, [gameLoop, refreshPassiveIncome]);
}
