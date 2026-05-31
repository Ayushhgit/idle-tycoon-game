import { supabase, isSupabaseConfigured } from '../config/supabase';
import { GameState } from '../types/game';

interface LeaderboardEntry {
  player_id: string;
  username: string;
  net_worth: number;
  prestige_count: number;
  rank?: number;
}

export const SupabaseService = {
  async signInAnonymously(): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) return null;
      return data.user.id;
    } catch {
      return null;
    }
  },

  async getCurrentUser() {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  },

  async syncCloudSave(userId: string, state: Partial<GameState>): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const payload = {
        player_id: userId,
        net_worth: state.netWorth ?? 0,
        money: state.money ?? 0,
        gems: state.gems ?? 0,
        prestige_count: state.prestigeData?.count ?? 0,
        passive_income: state.passiveIncome ?? 0,
        lifetime_earnings: state.lifetimeEarnings ?? 0,
        total_taps: state.totalTaps ?? 0,
        save_data: JSON.stringify(state),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('player_saves')
        .upsert(payload, { onConflict: 'player_id' });

      return !error;
    } catch {
      return false;
    }
  },

  async loadCloudSave(userId: string): Promise<Partial<GameState> | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from('player_saves')
        .select('save_data')
        .eq('player_id', userId)
        .single();

      if (error || !data) return null;
      return JSON.parse(data.save_data) as Partial<GameState>;
    } catch {
      return null;
    }
  },

  async updateLeaderboard(
    userId: string,
    username: string,
    netWorth: number,
    prestigeCount: number
  ): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { error } = await supabase.from('leaderboard').upsert(
        {
          player_id: userId,
          username,
          net_worth: netWorth,
          prestige_count: prestigeCount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'player_id' }
      );
      return !error;
    } catch {
      return false;
    }
  },

  async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('player_id, username, net_worth, prestige_count')
        .order('net_worth', { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data.map((row, i) => ({ ...row, rank: i + 1 }));
    } catch {
      return [];
    }
  },

  async getPlayerRank(userId: string): Promise<number | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data: myData } = await supabase
        .from('leaderboard')
        .select('net_worth')
        .eq('player_id', userId)
        .single();

      if (!myData) return null;

      const { count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('net_worth', myData.net_worth);

      return (count ?? 0) + 1;
    } catch {
      return null;
    }
  },
};
