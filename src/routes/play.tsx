import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Heart, Zap, Star, Lock } from "lucide-react";
import { useGame } from "@/game/store";
import { HEROES, STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
import { PixelButton } from "@/components/game/PixelButton";
import { MenuShell, SectionTitle, Readout } from "@/components/game/MenuShell";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Start a Run — Overtung" },
      {
        name: "description",
        content: "Pick your hero, set an optional run seed and breach the fracture in Overtung.",
      },
      { property: "og:title", content: "Start a Run — Overtung" },
      {
        property: "og:description",
        content: "Choose a hero, seed the timeline and breach King's Row.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlaySetup,
});

const ROSTER = [...STARTER_HEROES, ...UNLOCKABLE_HEROES];
const UNLOCK_COST = 150;
const BASTION_COST = 200;

function PlaySetup() {
  const navigate = useNavigate();
  const meta = useGame((s) => s.meta);
  const inRun = useGame((s) => s.inRun);
  const startRun = useGame((s) => s.startRun);
  const selectHero = useGame((s) => s.selectHero);
  const [selected, setSelected] = useState<string>(() => meta.selectedHeroId ?? "tracer");
  const [seed, setSeed] = useState("");

  const bossHeroes = meta.bossHeroes ?? [];
  const bastionReady = bossHeroes.length >= 3;
  const costFor = (id: string) => (id === "bastion" ? BASTION_COST : UNLOCK_COST);
  const locked = (id: string) => !meta.unlockedHeroes.includes(id);
  const canUnlock = (id: string) =>
    meta.credits >= costFor(id) && (id !== "bastion" || bastionReady);

  function breach() {
    if (locked(selected)) return;
    startRun(selected, seed);
    navigate({ to: "/run" });
  }

  function unlock(id: string) {
    if (!canUnlock(id)) return;
    const next = {
      ...meta,
      credits: meta.credits - costFor(id),
      unlockedHeroes: [...meta.unlockedHeroes, id],
    };
    try {
      window.localStorage.setItem("overtung_meta_v1", JSON.stringify(next));
    } catch {
      /* ignore */
    }
    useGame.setState({ meta: next });
  }

  const heroSel = HEROES[selected]!;

  return (
    <MenuShell
      title="RUN SETUP"
      glyph="▶"
      accent={locked(selected) ? "var(--primary)" : heroSel.color}
      crumb="Step 1 of 2 · choose your hero, then breach"
      aside={<Readout icon="⬢" value={meta.credits} />}
      {...(locked(selected)
        ? {}
        : {
            footer: (
              <PixelButton
                onClick={breach}
                color="danger"
                className="cta-throb sheen press relative w-full overflow-hidden px-8 py-5 text-[17px]"
              >
                ▶ BREACH AS {heroSel.name.toUpperCase()}
              </PixelButton>
            ),
          })}
    >
      {inRun && (
        <Link
          to="/run"
          className="text-pixel press mb-4 block border-2 border-accent bg-accent/15 px-3 py-3 text-center text-[9px] text-accent"
        >
          ▶ RESUME CURRENT RUN
        </Link>
      )}

      <SectionTitle right="tap to inspect">Select your hero</SectionTitle>

      <div className="grid w-full grid-cols-3 gap-1.5">
        {ROSTER.map((id, i) => {
          const hero = HEROES[id]!;
          const isLocked = locked(id);
          const isSel = selected === id;
          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 18 }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -3 }}
              onClick={() => {
                setSelected(id);
                if (!locked(id)) selectHero(id);
              }}
              className={`group relative flex flex-col items-center gap-0.5 p-1 transition-colors ${
                isLocked
                  ? "border-2 border-border/60 bg-card/40"
                  : isSel
                    ? "border-2 border-primary"
                    : "border-2 border-border bg-card/60 hover:border-primary/70"
              }`}
              {...(isSel && !isLocked ? { style: { background: hero.color } } : {})}
            >
              <img
                src={hero.asset}
                alt={hero.name}
                width={64}
                height={64}
                decoding="async"
                className={`pixelated h-12 w-12 object-contain ${isLocked ? "" : isSel ? "idle-bob" : "idle-bob-slow"}`}
                style={{ filter: isLocked ? "grayscale(1) brightness(0.4)" : "none" }}
              />
              <span
                className={`text-pixel text-[6px] leading-tight ${
                  isSel && !isLocked ? "text-black" : isLocked ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {hero.name}
              </span>
              {isLocked ? (
                <span className="text-pixel flex items-center gap-0.5 text-[6px] text-primary">
                  <Lock size={7} strokeWidth={3} />
                  {costFor(id)}
                </span>
              ) : (
                <span
                  className={`text-[10px] leading-none ${isSel ? "text-black/70" : "text-muted-foreground"}`}
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  {hero.role}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {locked(selected) ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          {selected === "bastion" && (
            <div
              className="w-full border-2 border-border bg-card/70 p-2 text-center text-[13px] text-muted-foreground"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              Mastery lock. Kill a boss with 3 different heroes. ({Math.min(3, bossHeroes.length)}/3)
            </div>
          )}
          <PixelButton
            onClick={() => unlock(selected)}
            disabled={!canUnlock(selected)}
            color="secondary"
            className="w-full"
          >
            Unlock for {costFor(selected)} ⬢
          </PixelButton>
        </div>
      ) : (
        <>
          <motion.div
            key={selected}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
          >
            <HeroInfo id={selected} />
          </motion.div>

          <SectionTitle>Run seed</SectionTitle>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="optional. same seed, same map"
            className="w-full border-2 border-border bg-card/40 px-2 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          />

          <p
            className="mt-2 text-[13px] text-muted-foreground"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            Step 2 of 2. Breach when you are ready.
          </p>
        </>
      )}

    </MenuShell>
  );
}

function HeroInfo({ id }: { id: string }) {
  const hero = HEROES[id]!;
  return (
    <div className="mt-4 w-full border-2 border-border bg-card p-3">
      <div className="text-pixel text-[9px]" style={{ color: hero.color }}>
        {hero.name}
      </div>
      <div className="mt-2 space-y-1" style={{ fontFamily: "var(--font-pixel-body)" }}>
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
    </div>
  );
}
