import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HEROES } from "@/game/heroes";
import { PixelButton } from "./PixelButton";

/**
 * Full-screen payoff for the rarest thing a player buys: a new hero.
 * Two beats — a hard containment-breach flash, then the hero standing there —
 * and it dismisses on tap so it never blocks a thumb for long.
 */
export function HeroUnlockCeremony({
  heroId,
  onClose,
}: {
  heroId: string | null;
  onClose: () => void;
}) {
  const [beat, setBeat] = useState(0);
  const hero = heroId ? HEROES[heroId] : null;

  useEffect(() => {
    if (!heroId) return;
    setBeat(0);
    const t = setTimeout(() => setBeat(1), 620);
    return () => clearTimeout(t);
  }, [heroId]);

  return (
    <AnimatePresence>
      {hero && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="scanlines fixed inset-0 z-[400] flex flex-col items-center justify-center px-6"
          style={{
            background: `radial-gradient(circle at 50% 42%, color-mix(in oklab, ${hero.color} 26%, #05040a) 0 22%, #05040a 62%)`,
          }}
        >
          <div className="vignette pointer-events-none absolute inset-0" />

          {/* breach flash */}
          <motion.div
            initial={{ scaleY: 0.02, opacity: 1 }}
            animate={{ scaleY: [0.02, 1, 0.02], opacity: [1, 1, 0] }}
            transition={{ duration: 0.6, times: [0, 0.35, 1] }}
            className="pointer-events-none absolute inset-x-0 top-1/2 h-40 -translate-y-1/2"
            style={{ background: hero.color, mixBlendMode: "screen" }}
          />

          {beat === 1 && (
            <>
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-pixel relative mb-5 px-3 py-2 text-[8px] tracking-widest text-black"
                style={{ background: hero.color, border: "3px solid #07060c" }}
              >
                HERO RECOVERED
              </motion.div>

              <motion.img
                src={hero.asset}
                alt={hero.name}
                width={96}
                height={96}
                decoding="async"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="pixelated idle-bob-slow relative h-32 w-32 object-contain"
                style={{ filter: `drop-shadow(0 0 22px ${hero.color})` }}
              />

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="relative mt-4 max-w-[340px] text-center"
              >
                <div className="text-pixel text-[18px]" style={{ color: hero.color }}>
                  {hero.name}
                </div>
                <div
                  className="mt-1 text-[15px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  {hero.role}
                </div>
                <p
                  className="mt-3 text-[15px] leading-[19px] text-foreground/85"
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  {hero.passive}
                </p>
                <div className="text-pixel mt-3 text-[7px] text-accent">
                  ULT · {hero.ultimate.name.toUpperCase()}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative mt-7 w-full max-w-[300px]"
              >
                <PixelButton onClick={onClose} color="danger" className="press w-full py-4 text-[12px]">
                  ▶ {hero.name.toUpperCase()} IS READY
                </PixelButton>
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
