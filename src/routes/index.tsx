import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/game/store";
import { HEROES, STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
import { CabinetShell } from "@/components/game/CabinetShell";
import { MeterBar } from "@/components/game/MenuShell";

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
const UNLOCK_COST = 150;
const BASTION_COST = 200;
/** wins with one hero needed to fill their mastery bar */
const MASTERY_TARGET = 5;

const ENTRIES = [
  { to: "/heroes", label: "HEROES", glyph: "☗", accent: "var(--stable)" },
  { to: "/progression", label: "UPGRADES", glyph: "▤", accent: "var(--corrupt)" },
  { to: "/archive", label: "ARCHIVE", glyph: "✦", accent: "var(--corrupt)" },
  { to: "/stats", label: "RECORDS", glyph: "★", accent: "var(--gold)" },
];

function MainMenu() {
  const meta = useGame((s) => s.meta);
  const inRun = useGame((s) => s.inRun);
  const runHeroId = useGame((s) => s.heroId);
  const lastRun = useGame((s) => s.lastRun);
  const act = useGame((s) => s.act);
  const floorsCleared = useGame((s) => s.floorsCleared);

  const stats = meta.stats;
  const unlocked = meta.unlockedHeroes;
  const firstLaunch = meta.totalRuns === 0;

  // The hero the player is "carrying": the live run, else their last run, else the roster head.
  const currentId = inRun
    ? runHeroId
    : (meta.selectedHeroId ?? lastRun?.heroId ?? runHeroId ?? ROSTER[0]!);
  const hero = HEROES[currentId] ?? HEROES[ROSTER[0]!]!;
  const hStat = stats?.heroes?.[hero.id];
  const heroWins = hStat?.wins ?? 0;
  const heroRuns = hStat?.runs ?? 0;
  const masteryPct = Math.min(100, (heroWins / MASTERY_TARGET) * 100);

  // Next thing worth earning: cheapest still-locked hero.
  const nextUnlock = useMemo(() => {
    const locked = ROSTER.filter((id) => !unlocked.includes(id));
    if (locked.length === 0) return null;
    const id = locked.sort(
      (a, b) => (a === "bastion" ? BASTION_COST : UNLOCK_COST) - (b === "bastion" ? BASTION_COST : UNLOCK_COST),
    )[0]!;
    const cost = id === "bastion" ? BASTION_COST : UNLOCK_COST;
    const bossHeroes = meta.bossHeroes ?? [];
    const gated = id === "bastion" && bossHeroes.length < 3;
    return {
      id,
      cost,
      pct: Math.min(100, (meta.credits / cost) * 100),
      gate: gated ? `${bossHeroes.length}/3 heroes have killed a boss` : null,
    };
  }, [unlocked, meta.credits, meta.bossHeroes]);

  // Recent accomplishments ticker: only real, earned lines.
  const beats = useMemo(() => {
    const out: string[] = [];
    if (lastRun) {
      out.push(
        lastRun.fullClear
          ? `Timeline sealed with ${HEROES[lastRun.heroId]?.name ?? "a hero"}. ${lastRun.score} pts.`
          : `Last run: ${HEROES[lastRun.heroId]?.name ?? "Agent"} fell on floor ${lastRun.floorsCleared + 1}, act ${lastRun.act}.`,
      );
      if (lastRun.highlight) out.push(lastRun.highlight);
    }
    if (stats?.bestScore) out.push(`Personal best score: ${stats.bestScore}.`);
    if (stats?.bestHit) out.push(`Biggest single hit landed: ${stats.bestHit} damage.`);
    if (stats?.bossKills) out.push(`${stats.bossKills} bosses put down for good.`);
    if (meta.bestFloor) out.push(`Deepest breach so far: floor ${meta.bestFloor}.`);
    if (out.length === 0) out.push("No records yet. The fracture has not met you.");
    return out;
  }, [lastRun, stats, meta.bestFloor]);

  const [beat, setBeat] = useState(0);
  useEffect(() => {
    if (beats.length < 2) return;
    const t = window.setInterval(() => setBeat((i) => (i + 1) % beats.length), 4200);
    return () => window.clearInterval(t);
  }, [beats.length]);
  const line = beats[beat % beats.length]!;

  return (
    <CabinetShell>
      <div
        className="screen-wash scanlines relative min-h-screen bg-background"
        style={{ ["--screen-accent" as string]: hero.color }}
      >
        <div className="rift-bg pointer-events-none absolute inset-0 opacity-25" aria-hidden />
        <div className="menu-drift pointer-events-none absolute inset-0 opacity-25" aria-hidden />

        <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-5 pb-5">
          {/* --- identity bar --- */}
          <div className="flex items-center justify-between">
            <h1
              className="text-pixel title-flicker text-[19px] leading-none text-primary"
              style={{ textShadow: "2px 2px 0 oklch(0.1 0.02 265), 5px 5px 0 oklch(0.5 0.18 35)" }}
            >
              OVERTUNG
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="text-pixel border-2 border-border bg-card px-2 py-1.5 text-[8px] text-foreground/85">
                <span className="text-gold">⬢</span> {meta.credits}
              </span>
              <Link
                to="/settings"
                aria-label="Settings"
                className="press text-pixel grid min-h-[36px] min-w-[36px] place-items-center border-2 border-border bg-card px-2 text-[9px] text-muted-foreground hover:border-primary/60 hover:text-foreground"
              >
                ⚙
              </Link>

            </div>
          </div>
          <p
            className="mt-1 text-[12px] tracking-[0.22em] text-muted-foreground uppercase"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            King&apos;s Row Unstuck · Deck Roguelike
          </p>

          {/* --- current hero: the second thing the eye lands on --- */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="panel-ticks relative mt-4 border-2 bg-card/70 p-3"
            style={{ borderColor: `color-mix(in oklab, ${hero.color} 55%, var(--border))` }}
          >
            <div className="flex items-center gap-3">
              <div className="plinth relative grid h-[96px] w-[96px] shrink-0 place-items-end justify-center">
                <img
                  src={hero.asset}
                  alt={hero.name}
                  width={64}
                  height={64}
                  decoding="async"
                  className="pixelated idle-bob h-[86px] w-[86px] object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-pixel text-[7px] tracking-[0.24em] text-muted-foreground">
                  {inRun ? "RUN IN PROGRESS" : "SELECTED HERO"}
                </div>
                <div className="text-pixel mt-1 text-[15px] leading-none" style={{ color: hero.color }}>
                  {hero.name}
                </div>
                <div
                  className="mt-1 text-[13px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  {hero.role} · {hero.maxHp} HP · {hero.ultimate.name}
                </div>

                <div className="mt-2.5">
                  <div
                    className="mb-1 flex items-baseline justify-between text-[12px] text-muted-foreground"
                    style={{ fontFamily: "var(--font-pixel-body)" }}
                  >
                    <span>MASTERY</span>
                    <span className="text-foreground/85">
                      {Math.min(heroWins, MASTERY_TARGET)}/{MASTERY_TARGET} clears
                    </span>
                  </div>
                  <MeterBar pct={masteryPct} color={hero.color} height={8} />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { k: "RUNS", v: heroRuns },
                { k: "WINS", v: heroWins },
                { k: "BEST", v: hStat?.bestScore ?? 0 },
              ].map((s) => (
                <div key={s.k} className="border-2 border-border bg-background/60 px-2 py-1.5 text-center">
                  <div className="text-pixel value-land text-[10px] text-foreground">{s.v}</div>
                  <div
                    className="text-[12px] leading-[13px] text-muted-foreground"
                    style={{ fontFamily: "var(--font-pixel-body)" }}
                  >
                    {s.k}
                  </div>
                </div>
              ))}
            </div>

            {inRun && (
              <div
                className="mt-2 border-2 border-destructive/50 bg-destructive/10 px-2 py-1.5 text-[13px] text-foreground/85"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                Act {act + 1} · {floorsCleared} floors cleared. This timeline is still open.
              </div>
            )}
          </motion.section>

          {/* --- the dominant action --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 240, damping: 18 }}
            className="panel-ticks mt-4"
            style={{ ["--screen-accent" as string]: "var(--destructive)" }}
          >
            <Link
              to={inRun ? "/run" : "/play"}
              className="press text-pixel cta-throb sheen relative block w-full overflow-hidden border-4 border-[oklch(0.1_0.02_285)] bg-destructive px-6 py-7 text-center text-[21px] text-destructive-foreground shadow-[5px_5px_0_0_oklch(0.1_0.02_265)]"
            >
              ▶ {inRun ? "CONTINUE RUN" : "PLAY"}
            </Link>
          </motion.div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p
              className="text-[13px] text-muted-foreground"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              {inRun ? "Resume where the fracture left you." : "Four acts. One life. Cores survive you."}
            </p>
            <Link
              to="/play"
              className="press text-pixel shrink-0 border-2 border-border bg-card px-2 py-1.5 text-[7px] text-muted-foreground hover:border-primary/60 hover:text-foreground"
            >
              {inRun ? "NEW RUN" : "SWITCH HERO"}
            </Link>
          </div>

          {/* --- what's worth earning next --- */}
          {nextUnlock && (
            <Link
              to="/play"
              className="press tile-lift mt-4 block border-2 border-border bg-card/70 p-2.5"
              style={{ ["--screen-accent" as string]: HEROES[nextUnlock.id]?.color ?? "var(--primary)" }}
            >
              <div className="flex items-center gap-2.5">
                <img
                  src={HEROES[nextUnlock.id]!.asset}
                  alt={HEROES[nextUnlock.id]!.name}
                  width={40}
                  height={40}
                  decoding="async"
                  className="pixelated h-10 w-10 shrink-0 object-contain opacity-60 grayscale"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-pixel text-[8px] text-foreground">
                      UNLOCK {HEROES[nextUnlock.id]!.name.toUpperCase()}
                    </span>
                    <span
                      className="text-[12px] text-muted-foreground"
                      style={{ fontFamily: "var(--font-pixel-body)" }}
                    >
                      ⬢ {meta.credits}/{nextUnlock.cost}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <MeterBar pct={nextUnlock.pct} color="var(--gold)" height={6} />
                  </div>
                  {nextUnlock.gate && (
                    <div
                      className="mt-1 text-[12px] text-muted-foreground"
                      style={{ fontFamily: "var(--font-pixel-body)" }}
                    >
                      {nextUnlock.gate}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* --- living history --- */}
          <div className="mt-3 min-h-[38px] border-2 border-border/70 bg-background/50 px-2.5 py-2">
            <AnimatePresence mode="wait">
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-[13px] leading-[16px] text-foreground/80"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                <span className="text-gold">▸ </span>
                {line}
              </motion.p>
            </AnimatePresence>
          </div>

          {firstLaunch && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="panel-ticks mt-3 border-2 border-primary/40 bg-card/70 p-2.5"
              style={{ ["--screen-accent" as string]: "var(--primary)" }}
            >
              <div className="text-pixel mb-1.5 text-[7px] tracking-[0.2em] text-primary">FIRST BREACH</div>
              <ul
                className="space-y-1 text-[13px] leading-[15px] text-foreground/80"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                <li>Spend Energy to play cards. Block does not carry to your next turn.</li>
                <li>Pick your route on the map. Every node is a choice you live with.</li>
                <li>Death is permanent. Chrono Cores are not, and they buy upgrades.</li>
              </ul>
            </motion.div>
          )}

          {/* --- everything else, deliberately quieter --- */}
          <nav className="mt-auto grid grid-cols-4 gap-2 pt-5">
            {ENTRIES.map((e, i) => (
              <motion.div
                key={e.to}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04, duration: 0.22 }}
              >
                <Link
                  to={e.to}
                  className="press tile-lift flex h-full flex-col items-center gap-1 border-2 border-border bg-card/60 px-1 py-2.5 hover:bg-card"
                  style={{ ["--screen-accent" as string]: e.accent }}
                >
                  <span className="text-[15px]" style={{ color: e.accent }} aria-hidden>
                    {e.glyph}
                  </span>
                  <span className="text-pixel text-[6px] text-foreground/85">{e.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="mt-3 grid grid-cols-3 gap-2 border-t-2 border-primary/25 pt-2.5 text-center">
            {[
              { k: "RUNS", v: meta.totalRuns },
              { k: "BEST FLOOR", v: meta.bestFloor },
              { k: "HEROES", v: `${unlocked.length}/${ROSTER.length}` },
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
    </CabinetShell>
  );
}
