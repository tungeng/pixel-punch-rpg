import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { useGame } from "@/game/store";
import { HEROES, STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
import { MenuShell, SectionTitle, StatTile, MeterBar } from "@/components/game/MenuShell";
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
const GOLD = "var(--gold)";

function Stats() {
  const meta = useGame((s) => s.meta);
  const [board, setBoard] = useState(false);
  const st = meta.stats;
  const wins = st?.wins ?? 0;
  const losses = st?.losses ?? Math.max(0, meta.totalRuns - wins);
  const rate = meta.totalRuns > 0 ? Math.round((wins / meta.totalRuns) * 100) : 0;
  const heroStats = st?.heroes ?? {};
  const played = ROSTER.filter((id) => (heroStats[id]?.runs ?? 0) > 0).sort((a, b) => {
    const ra = heroStats[a]!;
    const rb = heroStats[b]!;
    return rb.wins / Math.max(1, rb.runs) - ra.wins / Math.max(1, ra.runs);
  });

  return (
    <MenuShell
      title="STATISTICS"
      glyph="★"
      accent={GOLD}
      crumb="Every timeline you have burned through"
      backTo="/"
    >
      {/* --- headline record plate --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="panel-ticks relative overflow-hidden border-2 px-4 py-5 text-center"
        style={{
          borderColor: GOLD,
          background:
            "linear-gradient(to bottom, color-mix(in oklab, var(--gold) 18%, oklch(0.16 0.02 285)) 0 3px, color-mix(in oklab, var(--gold) 7%, oklch(0.16 0.02 285)) 3px 60px, oklch(0.16 0.02 285) 60px)",
        }}
      >
        <div
          className="text-[13px] tracking-[0.2em] text-muted-foreground uppercase"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          Best score
        </div>
        <div className="text-pixel value-land mt-2 text-[26px]" style={{ color: GOLD }}>
          {st?.bestScore ?? 0}
        </div>
        <div className="mx-auto mt-3 max-w-[220px]">
          <MeterBar pct={rate} color={GOLD} height={10} />
        </div>
        <div
          className="mt-2 text-[13px] text-muted-foreground"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          {wins} wins from {meta.totalRuns} runs · {rate}%
        </div>
      </motion.div>

      <SectionTitle>Lifetime</SectionTitle>
      <div className="grid grid-cols-3 gap-1.5">
        <StatTile label="Runs" value={meta.totalRuns} />
        <StatTile label="Wins" value={wins} tone="gold" />
        <StatTile label="Losses" value={losses} />
        <StatTile label="Best floor" value={meta.bestFloor} tone="primary" />
        <StatTile label="Boss kills" value={st?.bossKills ?? 0} />
        <StatTile label="Biggest hit" value={st?.bestHit ?? 0} tone="accent" />
        <StatTile label="Cores" value={meta.credits} />
        <StatTile label="Heroes" value={`${meta.unlockedHeroes.length}/${ROSTER.length}`} />
        <StatTile
          label="Fastest win"
          value={st?.fastestWinFloors != null ? `F${st.fastestWinFloors}` : "—"}
        />
      </div>

      <SectionTitle right={played.length > 0 ? "ranked by win rate" : undefined}>
        Hero performance
      </SectionTitle>
      {played.length === 0 ? (
        <p
          className="border-2 border-border bg-card p-3 text-[13px] text-muted-foreground"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          No completed runs yet. Finish a run and your hero record shows up here.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {played.map((id, i) => {
            const h = HEROES[id]!;
            const r = heroStats[id]!;
            const pct = r.runs > 0 ? Math.round((r.wins / r.runs) * 100) : 0;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.22 }}
                className="flex items-center gap-2 border-2 border-border bg-card p-2"
                style={i === 0 ? { borderColor: GOLD } : undefined}
              >
                <span
                  className="text-pixel w-4 shrink-0 text-center text-[9px]"
                  style={{ color: i === 0 ? GOLD : "var(--color-muted-foreground)" }}
                >
                  {i + 1}
                </span>
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
                  <div className="mt-1.5">
                    <MeterBar pct={pct} color={h.color} height={7} />
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
              </motion.div>
            );
          })}
        </div>
      )}

      <SectionTitle>Global</SectionTitle>
      <PixelButton onClick={() => setBoard(true)} color="secondary" className="press w-full">
        ★ LEADERBOARD
      </PixelButton>

      {board && <LeaderboardScreen onClose={() => setBoard(false)} />}
    </MenuShell>
  );
}
