ALTER TABLE public.run_scores
  ADD COLUMN IF NOT EXISTS game_version text NOT NULL DEFAULT '1.0.0';