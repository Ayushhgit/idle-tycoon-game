-- ─────────────────────────────────────────────────────────────────────────────
-- Idle Wealth Tycoon — wipe all gameplay data (keeps table structure & policies)
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

truncate table public.player_saves   restart identity cascade;
truncate table public.leaderboard    restart identity cascade;
truncate table public.player_stats   restart identity cascade;
truncate table public.global_events  restart identity cascade;

-- Verify everything is empty:
select 'player_saves'  as tbl, count(*) from public.player_saves
union all select 'leaderboard',   count(*) from public.leaderboard
union all select 'player_stats',  count(*) from public.player_stats
union all select 'global_events', count(*) from public.global_events;
