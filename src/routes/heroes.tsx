import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Heart, Zap, Star, Lock } from "lucide-react";
import { useGame } from "@/game/store";
import { HEROES, STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
import { MenuShell, SectionTitle, StatTile } from "@/components/game/MenuShell";

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
      crumb={`${meta.unlockedHeroes.length} of ${ROSTER.length} recovered from the fracture`}
    >
      <div className="grid grid-cols-4 gap-1.5">
        {ROSTER.map((id) => {
          const h = HEROES[id]!;
          const locked = !meta.unlockedHeroes.includes(id);
          const sel = open === id;
          return (
            <button
              key={id}
              onClick={() => setOpen(id)}
              className={`relative flex flex-col items-center gap-0.5 border-2 p-1 transition-colors ${
                sel ? "border-primary bg-card" : "border-border bg-card/50 hover:border-primary/60"
              }`}
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
            </button>
          );
        })}
      </div>

      <motion.section
        key={open}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="mt-4 border-2 p-3"
        style={{ borderColor: hero.color, background: "oklch(0.16 0.02 285)" }}
      >
        <div className="flex items-center gap-3">
          <img
            src={hero.asset}
            alt={hero.name}
            width={64}
            height={64}
            decoding="async"
            className="pixelated idle-bob-slow h-14 w-14 object-contain"
            style={{ filter: isLocked ? "grayscale(1) brightness(0.5)" : "none" }}
          />
          <div>
            <div className="text-pixel text-[11px]" style={{ color: hero.color }}>
              {hero.name}
            </div>
            <div
              className="text-[13px] text-muted-foreground"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              {hero.role} · {isLocked ? "LOCKED" : "AVAILABLE"}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5" style={{ fontFamily: "var(--font-pixel-body)" }}>
          <div className="flex items-start gap-1.5 text-[14px] text-foreground/90">
            <Heart size={13} className="mt-[3px] shrink-0 text-destructive" />
            <span>{hero.maxHp} HP</span>
          </div>
          <div className="flex items-start gap-1.5 text-[14px] text-foreground/90">
            <Zap size={13} className="mt-[3px] shrink-0 text-primary" />
            <span>{hero.passive}</span>
          </div>
          <div className="flex items-start gap-1.5 text-[14px] text-foreground/75">
            <Star size={13} className="mt-[3px] shrink-0 text-accent" />
            <span>
              {hero.ultimate.name}: {hero.ultimate.text}
            </span>
          </div>
        </div>

        <SectionTitle>Your record</SectionTitle>
        <div className="grid grid-cols-4 gap-1.5">
          <StatTile label="Runs" value={record.runs} />
          <StatTile label="Wins" value={record.wins} tone="accent" />
          <StatTile label="Win %" value={`${winRate}`} />
          <StatTile label="Floor" value={record.bestFloor} />
        </div>

        <Link
          to="/play"
          className="text-pixel mt-4 block border-2 border-primary bg-primary px-3 py-3 text-center text-[10px] text-primary-foreground"
        >
          ▶ TAKE {hero.name.toUpperCase()} IN
        </Link>
      </motion.section>
    </MenuShell>
  );
}
