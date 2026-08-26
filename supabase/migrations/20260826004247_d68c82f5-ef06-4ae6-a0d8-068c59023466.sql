CREATE TABLE public.run_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 16),
  hero_id TEXT NOT NULL CHECK (char_length(hero_id) BETWEEN 1 AND 32),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 1000000),
  floors_cleared INTEGER NOT NULL DEFAULT 0 CHECK (floors_cleared >= 0 AND floors_cleared <= 1000),
  act_reached INTEGER NOT NULL DEFAULT 0 CHECK (act_reached >= 0 AND act_reached <= 20),
  full_clear BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.run_scores TO anon;
GRANT SELECT, INSERT ON public.run_scores TO authenticated;
GRANT ALL ON public.run_scores TO service_role;

ALTER TABLE public.run_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is publicly readable"
  ON public.run_scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit a run score"
  ON public.run_scores FOR INSERT
  WITH CHECK (true);

CREATE INDEX run_scores_score_idx ON public.run_scores (score DESC);
CREATE INDEX run_scores_created_at_idx ON public.run_scores (created_at DESC);