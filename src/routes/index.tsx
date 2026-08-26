import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGame } from "@/game/store";
import { HEROES, STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
import { PixelButton } from "@/components/game/PixelButton";
import { motion } from "motion/react";
import { Heart, Zap, Star, Lock } from "lucide-react";
import { ArchiveScreen } from "@/components/game/ArchiveScreen";
import { RelicCodexScreen } from "@/components/game/RelicCodexScreen";
import { LeaderboardScreen } from "@/components/game/LeaderboardScreen";
import { CabinetShell } from "@/components/game/CabinetShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overtung" },
      {
        name: "description",
        content: "TUNGVERWATCH",
      },
      { property: "og:title", content: "Overtung" },
      {
        property: "og:description",
        content: "TUNGVERWATCH",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const meta = useGame((s) => s.meta);
  const startRun = useGame((s) => s.startRun);
  const [selected, setSelected] = useState<string>("tracer");
  const [seed, setSeed] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const unlockCost = 150;

  const all = [...STARTER_HEROES, ...UNLOCKABLE_HEROES];
  const locked = (id: string) => !meta.unlockedHeroes.includes(id);

  function breach() {
    if (locked(selected)) return;
    startRun(selected, seed);
    navigate({ to: "/run" });
  }

  function unlock(id: string) {
    if (meta.credits < unlockCost) return;
    const next = { ...meta, credits: meta.credits - unlockCost, unlockedHeroes: [...meta.unlockedHeroes, id] };
    try {
      window.localStorage.setItem("overtung_meta_v1", JSON.stringify(next));
    } catch { /* ignore */ }
    useGame.setState({ meta: next });
  }

  return (
    <CabinetShell>
    <div className="scanlines relative min-h-screen overflow-y-auto bg-background px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-pixel title-flicker text-center text-[26px] leading-tight text-primary"
          style={{ textShadow: "3px 3px 0 oklch(0.1 0.02 265), 6px 6px 0 oklch(0.5 0.18 35)" }}
        >
          OVER
          <br />
          TUNG
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-pixel breathe-glow mt-2 text-center text-[8px] text-accent">TUNG. TUNG. TUNG. PIXEL DECK ROGUELIKE</motion.div>

        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="mt-5 text-center text-[15px] leading-[18px] text-foreground/85" style={{ fontFamily: "var(--font-pixel-body)" }}>
          Something tore a hole in the sky over King's Row at 4am. Null Sector walked
          out of it, and so did the dead: wraith-static copies of agents who were
          buried years ago. Reaper is leading them. Pick a hero, drop into the
          fracture, and fight down through it floor by floor. When you die the
          timeline edits you out. The Chrono Cores you banked are all that carries over.
        </motion.p>

        <div className="text-pixel mt-6 mb-2 text-[8px] text-muted-foreground">SELECT YOUR HERO</div>
        <div className="grid w-full grid-cols-3 gap-1.5">
          {all.map((id) => {
            const hero = HEROES[id]!;
            const isLocked = locked(id);
            const isSel = selected === id;
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + all.indexOf(id) * 0.07, type: "spring", stiffness: 260, damping: 18 }}
                whileTap={{ scale: 0.95 }}
                {...(isLocked ? {} : { whileHover: { y: -4, scale: 1.06 } })}
                onClick={() => !isLocked && setSelected(id)}
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
                    {unlockCost}
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
          <div className="mt-4">
            <PixelButton onClick={() => unlock(selected)} disabled={meta.credits < unlockCost} color="secondary">
              Unlock for {unlockCost} ⬢
            </PixelButton>
          </div>
        ) : (
          <>
            <motion.div key={selected} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="w-full"><HeroInfo id={selected} /></motion.div>
            <div className="mt-3 w-full">
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="run seed (optional)"
                className="w-full border border-border/60 bg-card/40 px-2 py-1.5 text-[13px] text-muted-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary/60"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              />
            </div>
            <motion.div
              className="mt-5 w-full"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 240, damping: 16 }}
            >
              <PixelButton onClick={breach} color="danger" className="cta-throb sheen relative w-full overflow-hidden px-8 py-6 text-[18px]">
                ▶ BREACH
              </PixelButton>
            </motion.div>
          </>
        )}

        <div className="mt-8 flex w-full justify-between border-t border-primary/30 pt-3 text-[13px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
          <span>⬢ {meta.credits} Chrono Cores</span>
          <span>Best: F{meta.bestFloor}</span>
          <span>Runs: {meta.totalRuns}</span>
        </div>
        <div className="mt-3 grid w-full grid-cols-2 gap-2">
          <PixelButton onClick={() => setArchiveOpen(true)} color="secondary" className="w-full">
            ▤ ARCHIVE
          </PixelButton>
          <PixelButton onClick={() => setCodexOpen(true)} color="secondary" className="w-full">
            ✦ CODEX
          </PixelButton>
          <PixelButton onClick={() => setBoardOpen(true)} color="secondary" className="col-span-2 w-full">
            ★ LEADERBOARD
          </PixelButton>
        </div>
        {archiveOpen && <ArchiveScreen onClose={() => setArchiveOpen(false)} />}
        {codexOpen && <RelicCodexScreen onClose={() => setCodexOpen(false)} />}
        {boardOpen && <LeaderboardScreen onClose={() => setBoardOpen(false)} />}
      </div>
    </div>
    </CabinetShell>
  );
}

function HeroInfo({ id }: { id: string }) {
  const hero = HEROES[id]!;
  return (
    <div className="mt-3 w-full border-2 border-border bg-card p-3">
      <div className="text-pixel text-[9px] text-primary">{hero.name}</div>
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
            {hero.ultimate.name} — {hero.ultimate.text}
          </span>
        </div>
      </div>
    </div>
  );
}

