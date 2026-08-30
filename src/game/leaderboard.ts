import { supabase } from "@/integrations/supabase/client";
import type { RunRecord } from "./store";
import { GAME_VERSION } from "./arcade";

export interface ScoreRow {
  id: string;
  player_name: string;
  hero_id: string;
  score: number;
  floors_cleared: number;
  act_reached: number;
  full_clear: boolean;
  created_at: string;
}

export function randomAgentName(): string {
  return `Agent-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function submitRunScore(name: string, run: RunRecord): Promise<boolean> {
  const { error } = await supabase.from("run_scores").insert({
    player_name: name.slice(0, 16) || randomAgentName(),
    hero_id: run.heroId,
    score: Math.max(0, Math.round(run.score)),
    floors_cleared: run.floorsCleared,
    act_reached: run.act,
    full_clear: run.fullClear,
    game_version: GAME_VERSION,
  });
  return !error;
}

export async function fetchTopScores(scope: "today" | "all"): Promise<ScoreRow[]> {
  let q = supabase
    .from("run_scores")
    .select("id, player_name, hero_id, score, floors_cleared, act_reached, full_clear, created_at")
    .order("score", { ascending: false })
    .limit(5);
  if (scope === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    q = q.gte("created_at", start.toISOString());
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data as ScoreRow[];
}

export interface BestScoreRow {
  player_name: string;
  score: number;
  game_version: string;
}

/**
 * Best logged run per player name, used to backfill the arcade hub board with
 * scores that were set before the hub started collecting them.
 */
export async function fetchBestScoresByPlayer(): Promise<BestScoreRow[]> {
  const { data, error } = await supabase
    .from("run_scores")
    .select("player_name, score, game_version")
    .order("score", { ascending: false })
    .limit(500);
  if (error || !data) return [];
  const best = new Map<string, BestScoreRow>();
  for (const row of data as BestScoreRow[]) {
    const key = row.player_name.trim().toLowerCase();
    if (!key) continue;
    if (!best.has(key)) {
      best.set(key, {
        player_name: row.player_name.trim(),
        score: row.score,
        game_version: row.game_version || "1.0.0",
      });
    }
  }
  return [...best.values()];
}
