import React, { createContext, useContext, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { SupabaseService } from '../services/supabaseService';

interface GameContextValue {
  userId: string | null;
}

const GameContext = createContext<GameContextValue>({ userId: null });

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = React.useState<string | null>(null);

  useEffect(() => {
    SupabaseService.signInAnonymously().then((id) => {
      if (id) setUserId(id);
    });
  }, []);

  return <GameContext.Provider value={{ userId }}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  return useContext(GameContext);
}
