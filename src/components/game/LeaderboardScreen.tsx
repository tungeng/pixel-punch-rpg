import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { PixelButton } from "@/components/game/PixelButton";
import { HEROES } from "@/game/heroes";
import { fetchTopScores, type ScoreRow } from "@/game/leaderboard";
import { arcadeLeaderboard, inArcadeFrame, type ArcadeScoreRow } from "@/game/arcade";
import { arcadeAccount } from "@/game/cloud";

type Scope = "arcade" | "today" | "all";

const BODY = { fontFamily: "var(--font-pixel-body)" } as const;

export function LeaderboardScreen({ onClose }: { onClose: () => void }) {
  const [hub, setHub] = useState<ArcadeScoreRow[] | null | "loading">(
    inArcadeFrame() ? "loading" : null,
  );
  const [scope, setScope] = useState<Scope>(inArcadeFrame() ? "arcade" : "today");
  const [rows, setRows] = useState<ScoreRow[] | null>(null);
  const me = arcadeAccount()?.username?.toLowerCase();

  // ask the hub once: if it serves a board we show it as the headline ranking
  useEffect(() => {
    if (!inArcadeFrame()) return;
    let live = true;
    void arcadeLeaderboard(10).then((r) => {
      if (!live) return;
      setHub(r);
      if (!r) setScope("today");
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (scope === "arcade") return;
    let live = true;
    setRows(null);
    void fetchTopScores(scope).then((r) => {
      if (live) setRows(r);
    });
    return () => {
      live = false;
    };
  }, [scope]);

  const scopes: Scope[] = hub && hub !== "loading" ? ["arcade", "today", "all"] : ["today", "all"];
  const label: Record<Scope, string> = { arcade: "ARCADE", today: "TODAY", all: "ALL-TIME" };

  return (
    <div className="scanlines fixed inset-0 z-50 overflow-y-auto bg-background px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flex items-center justify-between border-b border-primary/30 pb-3">
          <h2 className="text-pixel text-[13px] text-accent">LEADERBOARD</h2>
        </div>

        <div
          className="mt-3 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${scopes.length}, minmax(0, 1fr))` }}
        >
          {scopes.map((s) => (
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
              {label[s]}
            </button>
          ))}
        </div>

        {hub === "loading" && (
          <div className="mt-4 py-6 text-center text-[13px] text-muted-foreground" style={BODY}>
            Reaching the arcade hub…
          </div>
        )}

        {scope === "arcade" && Array.isArray(hub) && (
          <div className="mt-4 flex flex-col gap-2">
            {hub.length === 0 && (
              <div className="py-6 text-center text-[13px] text-muted-foreground" style={BODY}>
                No scores on the hub board yet.
              </div>
            )}
            {hub.map((r, i) => {
              const mine = me && r.username.toLowerCase() === me;
              return (
                <motion.div
                  key={r.userId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 border-2 bg-card px-3 py-2 ${
                    mine ? "border-primary" : "border-border"
                  }`}
                >
                  <span className="text-pixel w-6 text-[11px] text-accent">{r.rank ?? i + 1}</span>
                  <div className="min-w-0 flex-1 truncate text-[14px] text-foreground" style={BODY}>
                    {r.username}
                    {mine && <span className="ml-2 text-[11px] text-primary">YOU</span>}
                  </div>
                  <span className="text-pixel text-[11px] text-primary">{r.score}</span>
                </motion.div>
              );
            })}
            <div className="text-center text-[12px] text-muted-foreground" style={BODY}>
              Best run score, synced with the arcade hub.
            </div>
          </div>
        )}

        {scope !== "arcade" && (
          <div className="mt-4 flex flex-col gap-2">
            {rows === null && (
              <div className="py-6 text-center text-[13px] text-muted-foreground" style={BODY}>
                Scanning the timeline…
              </div>
            )}
            {rows?.length === 0 && (
              <div className="py-6 text-center text-[13px] text-muted-foreground" style={BODY}>
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
                  <div className="truncate text-[14px] text-foreground" style={BODY}>
                    {r.player_name}
                    {r.full_clear && <span className="ml-2 text-[11px] text-primary">FULL CLEAR</span>}
                  </div>
                  <div className="text-[12px] text-muted-foreground" style={BODY}>
                    {HEROES[r.hero_id]?.name ?? r.hero_id} · F{r.floors_cleared} · Act {r.act_reached + 1}
                  </div>
                </div>
                <span className="text-pixel text-[11px] text-primary">{r.score}</span>
              </motion.div>
            ))}
          </div>
        )}

        <PixelButton onClick={onClose} color="secondary" className="mt-5 w-full">
          BACK
        </PixelButton>
      </div>
    </div>
  );
}
