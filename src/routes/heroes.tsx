import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Zap, Star, Lock } from "lucide-react";
import { useGame } from "@/game/store";
import { HEROES, STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
import { MenuShell, SectionTitle, StatTile, MeterBar } from "@/components/game/MenuShell";

export const Route = createFileRoute("/heroes")({
  head: () => ({
    meta: [
      { title: "Hero Roster — Overtung" },
      {
        name: "description",
        content:
          "Browse all eight Overtung heroes: passives, ultimates, unlock requirements and your personal win record with each.",
      },
      { property: "og:title", content: "Hero Roster — Overtung" },
      {
        property: "og:description",
        content: "Eight heroes, eight identities. See passives, ultimates and your record.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HeroRoster,
});

const ROSTER = [...STARTER_HEROES, ...UNLOCKABLE_HEROES];

function HeroRoster() {
  const meta = useGame((s) => s.meta);
  const [open, setOpen] = useState<string>(ROSTER[0]!);
  const stats = meta.stats?.heroes ?? {};
  const hero = HEROES[open]!;
  const record = stats[open] ?? { runs: 0, wins: 0, bestScore: 0, bestFloor: 0 };
  const isLocked = !meta.unlockedHeroes.includes(open);
  const winRate = record.runs > 0 ? Math.round((record.wins / record.runs) * 100) : 0;

  return (
    <MenuShell
      title="HERO ROSTER"
      glyph="☗"
      accent={hero.color}
      crumb={`${meta.unlockedHeroes.length} of ${ROSTER.length} recovered from the fracture`}
      aside={
        <span className="text-pixel text-[8px]" style={{ color: hero.color }}>
          {meta.unlockedHeroes.length}/{ROSTER.length}
        </span>
      }
      footer={
        !isLocked ? (
          <Link
            to="/play"
            className="press text-pixel block border-4 border-[oklch(0.1_0.02_285)] px-3 py-4 text-center text-[11px] shadow-[4px_4px_0_0_oklch(0.1_0.02_265)]"
            style={{ background: hero.color, color: "oklch(0.12 0.03 285)" }}
          >
            ▶ TAKE {hero.name.toUpperCase()} IN
          </Link>
        ) : undefined
      }
    >
      {/* --- splash --- */}
      <AnimatePresence mode="wait">
        <motion.section
          key={open}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="panel-ticks relative overflow-hidden border-2 p-4"
          style={{
            borderColor: hero.color,
            background: `linear-gradient(to bottom, color-mix(in oklab, ${hero.color} 16%, oklch(0.16 0.02 285)) 0 3px, color-mix(in oklab, ${hero.color} 8%, oklch(0.16 0.02 285)) 3px 72px, oklch(0.16 0.02 285) 72px)`,
          }}
        >
          <div className="plinth flex items-end gap-4">
            <img
              src={hero.asset}
              alt={hero.name}
              width={64}
              height={64}
              decoding="async"
              className="pixelated idle-bob-slow h-20 w-20 shrink-0 object-contain"
              style={{ filter: isLocked ? "grayscale(1) brightness(0.5)" : "none" }}
            />
            <div className="min-w-0 pb-1">
              <div className="text-pixel text-[14px] leading-tight" style={{ color: hero.color }}>
                {hero.name}
              </div>
              <div
                className="mt-1 text-[14px] text-muted-foreground"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                {hero.role}
              </div>
              <span
                className="text-pixel mt-2 inline-block border-2 px-1.5 py-1 text-[6px]"
                style={{
                  borderColor: isLocked ? "var(--border)" : hero.color,
                  color: isLocked ? "var(--color-muted-foreground)" : hero.color,
                }}
              >
                {isLocked ? "LOCKED" : "READY"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2" style={{ fontFamily: "var(--font-pixel-body)" }}>
            <Row icon={<Heart size={13} className="text-destructive" />} text={`${hero.maxHp} HP`} />
            <Row icon={<Zap size={13} className="text-primary" />} text={hero.passive} />
            <Row
              icon={<Star size={13} className="text-accent" />}
              text={`${hero.ultimate.name}: ${hero.ultimate.text}`}
            />
          </div>

          <SectionTitle right={`${record.wins}/${record.runs} runs`}>Mastery</SectionTitle>
          <MeterBar pct={winRate} color={hero.color} height={10} />
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            <StatTile label="Runs" value={record.runs} />
            <StatTile label="Wins" value={record.wins} tone="accent" />
            <StatTile label="Win %" value={winRate} tone="primary" />
            <StatTile label="Floor" value={record.bestFloor} />
          </div>
        </motion.section>
      </AnimatePresence>

      {/* --- roster --- */}
      <SectionTitle>Roster</SectionTitle>
      <div className="grid grid-cols-4 gap-1.5">
        {ROSTER.map((id, i) => {
          const h = HEROES[id]!;
          const locked = !meta.unlockedHeroes.includes(id);
          const sel = open === id;
          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setOpen(id)}
              className={`press tile-lift relative flex flex-col items-center gap-0.5 border-2 p-1 ${
                sel ? "bg-card" : "border-border bg-card/50"
              }`}
              style={sel ? { borderColor: h.color } : undefined}
            >
              <img
                src={h.asset}
                alt={h.name}
                width={64}
                height={64}
                decoding="async"
                className="pixelated h-10 w-10 object-contain"
                style={{ filter: locked ? "grayscale(1) brightness(0.4)" : "none" }}
              />
              <span className="text-pixel text-[6px] leading-tight text-foreground/85">{h.name}</span>
              {locked && (
                <Lock size={9} strokeWidth={3} className="absolute top-1 right-1 text-primary" />
              )}
            </motion.button>
          );
        })}
      </div>
    </MenuShell>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 text-[14px] leading-[16px] text-foreground/90">
      <span className="mt-[3px] shrink-0">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
