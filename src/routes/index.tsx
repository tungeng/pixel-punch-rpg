import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGame } from "@/game/store";
import { HEROES, STARTER_HEROES, UNLOCKABLE_HEROES } from "@/game/heroes";
import { PixelButton } from "@/components/game/PixelButton";
import { motion } from "motion/react";
import { RELICS } from "@/game/relics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CHRONOBREAK — Pixel Deck Roguelike" },
      {
        name: "description",
        content:
          "A pixel-art Overwatch deck-roguelike. Bend time, break the breach. Slay-the-Spire-style card combat across a fractured timeline.",
      },
      { property: "og:title", content: "CHRONOBREAK" },
      {
        property: "og:description",
        content: "A pixel-art Overwatch deck-roguelike. Bend time. Break the breach.",
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
      window.localStorage.setItem("chronobreak_meta_v1", JSON.stringify(next));
    } catch { /* ignore */ }
    useGame.setState({ meta: next });
  }

  return (
    <div className="scanlines relative min-h-screen overflow-y-auto bg-background px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-pixel text-center text-[26px] leading-tight text-primary"
          style={{ textShadow: "3px 3px 0 oklch(0.1 0.02 265), 6px 6px 0 oklch(0.5 0.18 35)" }}
        >
          CHRONO
          <br />
          BREAK
        </motion.h1>
        <div className="text-pixel mt-2 text-center text-[8px] text-accent">PIXEL DECK ROGUELIKE</div>

        <p className="mt-5 text-center text-[15px] leading-[18px] text-foreground/85" style={{ fontFamily: "var(--font-pixel-body)" }}>
          A chrono-fracture tore open over King's Row. Null Sector poured through,
          and wraith-corrupted echoes of fallen agents march with them — Reaper
          leads the breach. Pick a hero. Dive the shattered timeline floor by floor.
          Die, and the timeline snaps back — but the Chrono Cores you banked persist.
        </p>

        <div className="text-pixel mt-6 mb-2 text-[8px] text-muted-foreground">SELECT YOUR HERO</div>
        <div className="grid grid-cols-3 gap-2">
          {all.map((id) => {
            const hero = HEROES[id]!;
            const isLocked = locked(id);
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.95 }}
                onClick={() => !isLocked && setSelected(id)}
                className="pix-border relative flex flex-col items-center p-1"
                style={{
                  background: selected === id ? hero.color : "oklch(0.16 0.03 265)",
                  opacity: isLocked ? 0.55 : 1,
                }}
              >
                <img src={hero.asset} alt={hero.name} className="pixelated h-16 w-16 object-contain" style={{ filter: isLocked ? "grayscale(1) brightness(0.6)" : "none" }} />
                <span className="text-pixel text-[7px] text-black">{hero.name}</span>
                <span className="text-[11px] text-black/70" style={{ fontFamily: "var(--font-pixel-body)" }}>{hero.role}</span>
                {isLocked && (
                  <span className="text-pixel absolute inset-0 flex items-center justify-center bg-black/60 text-[8px] text-primary">
                    🔒{unlockCost}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {locked(selected) ? (
          <div className="mt-3">
            <PixelButton onClick={() => unlock(selected)} disabled={meta.credits < unlockCost} color="secondary">
              Unlock for {unlockCost} ⬢
            </PixelButton>
          </div>
        ) : (
          <>
            <div className="mt-5 w-full">
              <div className="text-pixel mb-1 text-[7px] text-muted-foreground">RUN SEED (optional)</div>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="random"
                className="text-pixel pix-border w-full bg-card px-3 py-2 text-[8px] text-foreground outline-none"
              />
            </div>
            <HeroInfo id={selected} />
            <div className="mt-4">
              <PixelButton onClick={breach} color="danger" className="px-8 py-4 text-[12px]">
                ▶ BREACH
              </PixelButton>
            </div>
          </>
        )}

        <div className="mt-8 flex w-full justify-between border-t border-primary/30 pt-3 text-[13px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
          <span>⬢ {meta.credits} Chrono Cores</span>
          <span>Best: F{meta.bestFloor}</span>
          <span>Runs: {meta.totalRuns}</span>
        </div>
      </div>
    </div>
  );
}

function HeroInfo({ id }: { id: string }) {
  const hero = HEROES[id]!;
  return (
    <div className="mt-4 w-full pix-border bg-card p-3">
      <div className="text-pixel text-[8px] text-primary">{hero.name}</div>
      <div className="text-[13px] text-foreground/80" style={{ fontFamily: "var(--font-pixel-body)" }}>
        HP {hero.maxHp} · {hero.passive}
      </div>
      <div className="text-[12px] text-foreground/60" style={{ fontFamily: "var(--font-pixel-body)" }}>
        Ultimate: {hero.ultimate.name} — {hero.ultimate.text}
      </div>
    </div>
  );
}
