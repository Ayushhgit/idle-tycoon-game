-- ============================================
-- IDLE WEALTH TYCOON — SUPABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PLAYER SAVES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.player_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL UNIQUE,
  net_worth NUMERIC DEFAULT 0,
  money NUMERIC DEFAULT 0,
  gems INTEGER DEFAULT 0,
  prestige_count INTEGER DEFAULT 0,
  passive_income NUMERIC DEFAULT 0,
  lifetime_earnings NUMERIC DEFAULT 0,
  total_taps BIGINT DEFAULT 0,
  save_data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.player_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read own save"
  ON public.player_saves FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Players can upsert own save"
  ON public.player_saves FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update own save"
  ON public.player_saves FOR UPDATE
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

-- ============================================
-- LEADERBOARD TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL DEFAULT 'Anonymous Tycoon',
  net_worth NUMERIC DEFAULT 0,
  prestige_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS leaderboard_net_worth_idx ON public.leaderboard (net_worth DESC);

-- Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Anyone can read the leaderboard
CREATE POLICY "Anyone can read leaderboard"
  ON public.leaderboard FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Players can upsert own leaderboard entry"
  ON public.leaderboard FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update own leaderboard entry"
  ON public.leaderboard FOR UPDATE
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

-- ============================================
-- GLOBAL EVENTS TABLE (admin-controlled)
-- ============================================
CREATE TABLE IF NOT EXISTS public.global_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '🌍',
  stock_multiplier NUMERIC DEFAULT 1,
  business_multiplier NUMERIC DEFAULT 1,
  property_multiplier NUMERIC DEFAULT 1,
  tap_multiplier NUMERIC DEFAULT 1,
  active BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anyone can read active global events
ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read global events"
  ON public.global_events FOR SELECT
  TO public
  USING (active = true AND now() BETWEEN starts_at AND ends_at);

-- ============================================
-- PLAYER STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL UNIQUE,
  total_playtime_seconds BIGINT DEFAULT 0,
  businesses_purchased INTEGER DEFAULT 0,
  properties_purchased INTEGER DEFAULT 0,
  luxury_purchased INTEGER DEFAULT 0,
  stocks_traded INTEGER DEFAULT 0,
  prestige_count INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can manage own stats"
  ON public.player_stats FOR ALL
  USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_saves_updated_at
  BEFORE UPDATE ON public.player_saves
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON public.player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REALTIME: enable for global events
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_events;
