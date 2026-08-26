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
      { title: "Overtung — Pixel Deck Roguelike" },
      {
        name: "description",
        content:
          "Fight through a fractured King's Row in a pixel-art deck roguelike. Seven heroes, run-warping Breach Protocols, four acts, permadeath.",
      },
      { property: "og:title", content: "Overtung — Pixel Deck Roguelike" },
      {
        property: "og:description",
        content:
          "Seven heroes, run-warping Breach Protocols, four acts of card combat. One wrong route ends the run.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://overtung.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://overtung.lovable.app/" }],
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
  const BASTION_COST = 200;
  const bossHeroes = meta.bossHeroes ?? [];
  const bastionReady = bossHeroes.length >= 3;
  const costFor = (id: string) => (id === "bastion" ? BASTION_COST : unlockCost);
  const canUnlock = (id: string) =>
    meta.credits >= costFor(id) && (id !== "bastion" || bastionReady);

  const all = [...STARTER_HEROES, ...UNLOCKABLE_HEROES];
  const locked = (id: string) => !meta.unlockedHeroes.includes(id);

  function breach() {
    if (locked(selected)) return;
    startRun(selected, seed);
    navigate({ to: "/run" });
  }

  function unlock(id: string) {
    if (!canUnlock(id)) return;
    const next = { ...meta, credits: meta.credits - costFor(id), unlockedHeroes: [...meta.unlockedHeroes, id] };
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
        


        {meta.totalRuns === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 w-full border-2 border-primary/40 bg-card/50 p-2"
          >
            <div className="text-pixel mb-1 text-[7px] text-primary">FIRST BREACH</div>
            <ul
              className="space-y-0.5 text-[13px] leading-[15px] text-foreground/75"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              <li>Play cards with Energy each turn. Unspent Block is gone by your next turn.</li>
              <li>Pick your route on the map. Every node is a choice you live with.</li>
              <li>Death is permanent, but Chrono Cores are not. They buy permanent upgrades.</li>
            </ul>
          </motion.div>
        )}
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
                whileHover={{ y: -4, scale: 1.06 }}
                onClick={() => setSelected(id)}
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
            <PixelButton onClick={() => unlock(selected)} disabled={!canUnlock(selected)} color="secondary">
              Unlock for {costFor(selected)} ⬢
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
          <PixelButton
            onClick={() => {
              if (typeof window !== "undefined") window.location.reload();
            }}
            color="secondary"
            className="col-span-2 w-full"
          >
            ⟳ CHECK FOR UPDATES
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
            {hero.ultimate.name}: {hero.ultimate.text}
          </span>
        </div>
      </div>
    </div>
  );
}

