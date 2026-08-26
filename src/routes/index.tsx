import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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

type Entry = { to: string; label: string; blurb: string; glyph: string; accent: string };

const ENTRIES: Entry[] = [
  { to: "/heroes", label: "HEROES", blurb: "Roster and mastery", glyph: "☗", accent: "var(--stable)" },
  { to: "/progression", label: "PROGRESSION", blurb: "Permanent upgrades", glyph: "▤", accent: "var(--corrupt)" },
  { to: "/archive", label: "ARCHIVE", blurb: "Relics and bosses", glyph: "✦", accent: "var(--corrupt)" },
  { to: "/stats", label: "STATISTICS", blurb: "Records and ranking", glyph: "★", accent: "var(--gold)" },
];

function MainMenu() {
  const meta = useGame((s) => s.meta);
  const inRun = useGame((s) => s.inRun);
  const [showcase, setShowcase] = useState(0);
  const firstLaunch = meta.totalRuns === 0;

  useEffect(() => {
    const t = window.setInterval(() => setShowcase((i) => (i + 1) % ROSTER.length), 3200);
    return () => window.clearInterval(t);
  }, []);

  const hero = HEROES[ROSTER[showcase]!]!;
  const unlockedCount = meta.unlockedHeroes.length;

  return (
    <CabinetShell>
      <div
        className="scanlines relative min-h-screen bg-background"
        style={{ ["--screen-accent" as string]: hero.color }}
      >
        <div className="rift-bg pointer-events-none absolute inset-0 opacity-25" aria-hidden />
        <div className="menu-drift pointer-events-none absolute inset-0 opacity-30" aria-hidden />

        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-7 pb-6">
          {/* --- title lockup --- */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative text-center"
          >
            <h1
              className="text-pixel title-flicker text-[34px] leading-[1.08] text-primary"
              style={{ textShadow: "3px 3px 0 oklch(0.1 0.02 265), 7px 7px 0 oklch(0.5 0.18 35)" }}
            >
              OVER
              <br />
              TUNG
            </h1>
            <div className="mx-auto mt-3 flex max-w-[280px] items-center gap-2">
              <span className="h-0.5 flex-1 bg-primary/40" />
              <span className="text-pixel text-[7px] tracking-[0.3em] text-accent">
                KING&apos;S ROW UNSTUCK
              </span>
              <span className="h-0.5 flex-1 bg-primary/40" />
            </div>
          </motion.div>

          {/* --- rotating hero showcase --- */}
          <div className="plinth relative mt-5 flex h-[132px] items-end justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={hero.id}
                initial={{ opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative flex flex-col items-center"
              >
                <img
                  src={hero.asset}
                  alt={hero.name}
                  width={64}
                  height={64}
                  decoding="async"
                  className="pixelated idle-bob h-[88px] w-[88px] object-contain"
                />
                <div
                  className="mt-2 border-2 px-3 py-1"
                  style={{
                    borderColor: hero.color,
                    background: "color-mix(in oklab, var(--card) 90%, black)",
                  }}
                >
                  <span className="text-pixel text-[9px]" style={{ color: hero.color }}>
                    {hero.name}
                  </span>
                  <span
                    className="ml-2 text-[13px] text-muted-foreground"
                    style={{ fontFamily: "var(--font-pixel-body)" }}
                  >
                    {hero.role}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* --- primary commitment --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, type: "spring", stiffness: 240, damping: 18 }}
            className="panel-ticks mt-6"
            style={{ ["--screen-accent" as string]: "var(--destructive)" }}
          >
            <Link
              to="/play"
              className="press text-pixel cta-throb sheen relative block w-full overflow-hidden border-4 border-[oklch(0.1_0.02_285)] bg-destructive px-6 py-6 text-center text-[19px] text-destructive-foreground shadow-[5px_5px_0_0_oklch(0.1_0.02_265)]"
            >
              ▶ {inRun ? "CONTINUE" : "PLAY"}
            </Link>
          </motion.div>
          <p
            className="mt-2 text-center text-[13px] text-muted-foreground"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            {inRun
              ? "A run is still in progress. Play resumes it."
              : "Four acts. One life. Chrono Cores survive you."}
          </p>

          {firstLaunch && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="panel-ticks mt-5 border-2 border-primary/40 bg-card/70 p-3"
              style={{ ["--screen-accent" as string]: "var(--primary)" }}
            >
              <div className="text-pixel mb-2 text-[7px] tracking-[0.2em] text-primary">
                FIRST BREACH
              </div>
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

          {/* --- destinations --- */}
          <nav className="mt-6 grid grid-cols-2 gap-2">
            {ENTRIES.map((e, i) => (
              <motion.div
                key={e.to}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.05, duration: 0.24 }}
              >
                <Link
                  to={e.to}
                  className="press tile-lift group flex h-full flex-col gap-1 border-2 border-border bg-card/70 p-2.5 hover:bg-card"
                  style={{ ["--screen-accent" as string]: e.accent }}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[15px]" style={{ color: e.accent }} aria-hidden>
                      {e.glyph}
                    </span>
                    <span className="text-pixel text-[8px] text-foreground">{e.label}</span>
                  </span>
                  <span
                    className="text-[13px] leading-[14px] text-muted-foreground"
                    style={{ fontFamily: "var(--font-pixel-body)" }}
                  >
                    {e.blurb}
                  </span>
                </Link>
              </motion.div>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2"
          >
            <Link
              to="/settings"
              className="press text-pixel block border-2 border-border bg-card/50 py-2 text-center text-[8px] text-muted-foreground hover:border-primary/60 hover:text-foreground"
            >
              ⚙ SETTINGS
            </Link>
          </motion.div>

          {/* --- resource ribbon --- */}
          <div className="mt-auto pt-6">
            <div className="grid grid-cols-3 gap-2 border-t-2 border-primary/30 pt-3 text-center">
              {[
                { k: "CORES", v: meta.credits },
                { k: "BEST FLOOR", v: meta.bestFloor },
                { k: "HEROES", v: `${unlockedCount}/${ROSTER.length}` },
              ].map((s) => (
                <div key={s.k}>
                  <div className="text-pixel text-[10px] text-foreground">{s.v}</div>
                  <div
                    className="text-[12px] leading-[13px] text-muted-foreground"
                    style={{ fontFamily: "var(--font-pixel-body)" }}
                  >
                    {s.k}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CabinetShell>
  );
}
