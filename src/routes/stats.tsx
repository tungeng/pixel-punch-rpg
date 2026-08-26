import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useGame } from "@/game/store";
import { HEROES, STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
import { MenuShell, SectionTitle, StatTile } from "@/components/game/MenuShell";
import { PixelButton } from "@/components/game/PixelButton";
import { LeaderboardScreen } from "@/components/game/LeaderboardScreen";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Statistics — Overtung" },
      {
        name: "description",
        content:
          "Track your Overtung record: runs, wins, boss kills, best score, hero performance and the global leaderboard.",
      },
      { property: "og:title", content: "Statistics — Overtung" },
      { property: "og:description", content: "Your Overtung record, hero by hero." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Stats,
});

const ROSTER = [...STARTER_HEROES, ...UNLOCKABLE_HEROES];

function Stats() {
  const meta = useGame((s) => s.meta);
  const [board, setBoard] = useState(false);
  const st = meta.stats;
  const wins = st?.wins ?? 0;
  const losses = st?.losses ?? Math.max(0, meta.totalRuns - wins);
  const rate = meta.totalRuns > 0 ? Math.round((wins / meta.totalRuns) * 100) : 0;
  const heroStats = st?.heroes ?? {};
  const played = ROSTER.filter((id) => (heroStats[id]?.runs ?? 0) > 0);

  return (
    <MenuShell title="STATISTICS" crumb="Every timeline you have burned through">
      <SectionTitle>Lifetime</SectionTitle>
      <div className="grid grid-cols-3 gap-1.5">
        <StatTile label="Runs" value={meta.totalRuns} />
        <StatTile label="Wins" value={wins} tone="accent" />
        <StatTile label="Losses" value={losses} />
        <StatTile label="Win rate" value={`${rate}%`} tone="primary" />
        <StatTile label="Best floor" value={meta.bestFloor} />
        <StatTile label="Boss kills" value={st?.bossKills ?? 0} />
        <StatTile label="Best score" value={st?.bestScore ?? 0} tone="accent" />
        <StatTile label="Biggest hit" value={st?.bestHit ?? 0} />
        <StatTile
          label="Fastest win"
          value={st?.fastestWinFloors != null ? `F${st.fastestWinFloors}` : "—"}
        />
      </div>

      <SectionTitle>Hero performance</SectionTitle>
      {played.length === 0 ? (
        <p
          className="border-2 border-border bg-card p-3 text-[13px] text-muted-foreground"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          No completed runs yet. Finish a run and your hero record shows up here.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {played.map((id) => {
            const h = HEROES[id]!;
            const r = heroStats[id]!;
            const pct = r.runs > 0 ? Math.round((r.wins / r.runs) * 100) : 0;
            return (
              <div key={id} className="flex items-center gap-2 border-2 border-border bg-card p-2">
                <img
                  src={h.asset}
                  alt={h.name}
                  width={64}
                  height={64}
                  decoding="async"
                  className="pixelated h-9 w-9 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-pixel text-[8px]" style={{ color: h.color }}>
                    {h.name}
                  </div>
                  <div className="mt-1 h-2 w-full border border-border bg-background">
                    <div
                      className="h-full"
                      style={{ width: `${pct}%`, background: h.color }}
                      aria-hidden
                    />
                  </div>
                </div>
                <div
                  className="shrink-0 text-right text-[13px] leading-[14px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  {r.wins}/{r.runs} · {pct}%
                  <br />
                  best F{r.bestFloor}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionTitle>Global</SectionTitle>
      <PixelButton onClick={() => setBoard(true)} color="secondary" className="w-full">
        ★ LEADERBOARD
      </PixelButton>

      {board && <LeaderboardScreen onClose={() => setBoard(false)} />}
    </MenuShell>
  );
}
