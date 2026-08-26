import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useGame } from "@/game/store";
import { HEROES, STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
import { CabinetShell } from "@/components/game/CabinetShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overtung — Pixel Deck Roguelike" },
      {
        name: "description",
        content:
          "Fight through a fractured King's Row in a pixel-art deck roguelike. Eight heroes, run-warping Breach Protocols, four acts, permadeath.",
      },
      { property: "og:title", content: "Overtung — Pixel Deck Roguelike" },
      {
        property: "og:description",
        content:
          "Eight heroes, run-warping Breach Protocols, four acts of card combat. One wrong route ends the run.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://overtung.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://overtung.lovable.app/" }],
  }),
  component: MainMenu,
});

const ROSTER = [...STARTER_HEROES, ...UNLOCKABLE_HEROES];

type Entry = { to: string; label: string; blurb: string; glyph: string; tone?: "primary" };

const ENTRIES: Entry[] = [
  { to: "/heroes", label: "HEROES", blurb: "Roster, unlocks and mastery", glyph: "☗" },
  { to: "/progression", label: "PROGRESSION", blurb: "Spend Chrono Cores on permanent upgrades", glyph: "▤" },
  { to: "/archive", label: "ARCHIVE", blurb: "Relics, bosses, protocols and lore", glyph: "✦" },
  { to: "/stats", label: "STATISTICS", blurb: "Records, hero performance, leaderboard", glyph: "★" },
  { to: "/settings", label: "SETTINGS", blurb: "Display name, save data, updates", glyph: "⚙" },
];

function MainMenu() {
  const meta = useGame((s) => s.meta);
  const inRun = useGame((s) => s.inRun);
  const [showcase, setShowcase] = useState(0);
  const firstLaunch = meta.totalRuns === 0;

  useEffect(() => {
    const t = window.setInterval(() => setShowcase((i) => (i + 1) % ROSTER.length), 2600);
    return () => window.clearInterval(t);
  }, []);

  const hero = HEROES[ROSTER[showcase]!]!;
  const unlockedCount = meta.unlockedHeroes.length;

  return (
    <CabinetShell>
      <div className="scanlines relative min-h-screen bg-background">
        <div className="rift-bg pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-8 pb-8">
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-pixel title-flicker text-center text-[30px] leading-[1.15] text-primary"
            style={{ textShadow: "3px 3px 0 oklch(0.1 0.02 265), 6px 6px 0 oklch(0.5 0.18 35)" }}
          >
            OVER
            <br />
            TUNG
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-pixel mt-3 text-center text-[7px] tracking-[0.35em] text-accent"
          >
            KING&apos;S ROW HAS COME UNSTUCK
          </motion.p>

          <motion.div
            key={hero.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="mt-5 flex items-center justify-center gap-3"
          >
            <img
              src={hero.asset}
              alt={hero.name}
              width={64}
              height={64}
              decoding="async"
              className="pixelated idle-bob h-16 w-16 object-contain"
            />
            <div className="text-left">
              <div className="text-pixel text-[9px]" style={{ color: hero.color }}>
                {hero.name}
              </div>
              <div
                className="text-[13px] text-muted-foreground"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                {hero.role} · {hero.maxHp} HP
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 18 }}
            className="mt-6"
          >
            <Link
              to="/play"
              className="text-pixel cta-throb sheen relative block w-full overflow-hidden border-4 border-[oklch(0.1_0.02_285)] bg-destructive px-6 py-6 text-center text-[18px] text-destructive-foreground shadow-[4px_4px_0_0_oklch(0.1_0.02_265)]"
            >
              ▶ {inRun ? "CONTINUE" : "PLAY"}
            </Link>
            {inRun && (
              <p
                className="mt-2 text-center text-[13px] text-muted-foreground"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                A run is still in progress. Play resumes it.
              </p>
            )}
          </motion.div>

          {firstLaunch && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-5 border-2 border-primary/40 bg-card/60 p-3"
            >
              <div className="text-pixel mb-1.5 text-[7px] text-primary">FIRST BREACH</div>
              <ul
                className="space-y-1 text-[13px] leading-[15px] text-foreground/80"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                <li>Spend Energy to play cards. Block does not carry into your next turn.</li>
                <li>Pick your route on the map. Every node is a choice you live with.</li>
                <li>Death is permanent. Chrono Cores are not, and they buy upgrades.</li>
              </ul>
            </motion.div>
          )}

          <nav className="mt-6 flex flex-col gap-2">
            {ENTRIES.map((e, i) => (
              <motion.div
                key={e.to}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.22 }}
              >
                <Link
                  to={e.to}
                  className="group flex items-center gap-3 border-2 border-border bg-card/70 px-3 py-2.5 transition-colors hover:border-primary hover:bg-card"
                >
                  <span className="text-[15px] text-primary" aria-hidden>
                    {e.glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-pixel block text-[9px] text-foreground group-hover:text-primary">
                      {e.label}
                    </span>
                    <span
                      className="block truncate text-[13px] leading-[14px] text-muted-foreground"
                      style={{ fontFamily: "var(--font-pixel-body)" }}
                    >
                      {e.blurb}
                    </span>
                  </span>
                  <span className="text-[13px] text-muted-foreground group-hover:text-primary" aria-hidden>
                    ▶
                  </span>
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <div
              className="flex justify-between border-t border-primary/30 pt-3 text-[13px] text-muted-foreground"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              <span>⬢ {meta.credits} Cores</span>
              <span>Best: Floor {meta.bestFloor}</span>
              <span>
                Heroes {unlockedCount}/{ROSTER.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </CabinetShell>
  );
}
