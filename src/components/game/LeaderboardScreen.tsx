import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { PixelButton } from "@/components/game/PixelButton";
import { HEROES } from "@/game/heroes";
import { fetchTopScores, type ScoreRow } from "@/game/leaderboard";

type Scope = "today" | "all";

export function LeaderboardScreen({ onClose }: { onClose: () => void }) {
  const [scope, setScope] = useState<Scope>("today");
  const [rows, setRows] = useState<ScoreRow[] | null>(null);

  useEffect(() => {
    let live = true;
    setRows(null);
    void fetchTopScores(scope).then((r) => {
      if (live) setRows(r);
    });
    return () => {
      live = false;
    };
  }, [scope]);

  return (
    <div className="scanlines fixed inset-0 z-50 overflow-y-auto bg-background px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flex items-center justify-between border-b border-primary/30 pb-3">
          <h2 className="text-pixel text-[13px] text-accent">LEADERBOARD</h2>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["today", "all"] as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`border-2 px-2 py-2 text-[9px] tracking-widest ${
                scope === s
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {s === "today" ? "TODAY" : "ALL-TIME"}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {rows === null && (
            <div
              className="py-6 text-center text-[13px] text-muted-foreground"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              Scanning the timeline…
            </div>
          )}
          {rows?.length === 0 && (
            <div
              className="py-6 text-center text-[13px] text-muted-foreground"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              No runs logged {scope === "today" ? "today" : "yet"}. Be the first.
            </div>
          )}
          {rows?.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 border-2 border-border bg-card px-3 py-2"
            >
              <span className="text-pixel w-6 text-[11px] text-accent">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] text-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
                  {r.player_name}
                  {r.full_clear && <span className="ml-2 text-[11px] text-primary">FULL CLEAR</span>}
                </div>
                <div className="text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
                  {HEROES[r.hero_id]?.name ?? r.hero_id} · F{r.floors_cleared} · Act {r.act_reached + 1}
                </div>
              </div>
              <span className="text-pixel text-[11px] text-primary">{r.score}</span>
            </motion.div>
          ))}
        </div>

        <PixelButton onClick={onClose} color="secondary" className="mt-5 w-full">
          BACK
        </PixelButton>
      </div>
    </div>
  );
}
