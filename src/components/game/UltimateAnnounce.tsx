import { motion } from "motion/react";
import { useEffect } from "react";
import type { HeroDef } from "@/game/types";

/**
 * Full-screen ultimate announcement. Purely visual: it darkens the screen,
 * zooms the hero sprite in and slams the ultimate's name on screen, then
 * calls onDone() so the real ultimate resolves right after the name reads.
 * Deliberately heavier and slower than the "TURN X" marquee banner.
 */
export function UltimateAnnounce({
  hero,
  onDone,
  holdMs = 820,
}: {
  hero: HeroDef;
  onDone: () => void;
  holdMs?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, holdMs);
    return () => clearTimeout(t);
  }, [onDone, holdMs]);

  const c = hero.color;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[300] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* screen darkener */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.78 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* radial hero-colour bloom */}
      <motion.div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 46%, ${c}55 0%, transparent 62%)` }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1.15 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />

      {/* speed streaks */}
      <motion.div
        className="absolute inset-x-0 top-1/2 h-[46%] -translate-y-1/2"
        style={{
          background: `repeating-linear-gradient(115deg, ${c}22 0px, ${c}22 2px, transparent 2px, transparent 12px)`,
        }}
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 0.5, x: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />

      <div className="relative flex flex-col items-center">
        {/* hero sprite zoom-in */}
        <motion.img
          src={hero.asset}
          alt={hero.name}
          className="h-40 w-40 object-contain"
          style={{ imageRendering: "pixelated", filter: `drop-shadow(0 0 18px ${c})` }}
          initial={{ scale: 0.35, opacity: 0, rotate: -4 }}
          animate={{ scale: [0.35, 1.18, 1.04], opacity: 1, rotate: 0 }}
          transition={{ duration: 0.42, ease: "easeOut", times: [0, 0.7, 1] }}
        />

        {/* impact bar behind the name */}
        <motion.div
          className="absolute bottom-4 h-[74px] w-[130vw]"
          style={{ background: `linear-gradient(90deg, transparent, ${c}cc, ${c}cc, transparent)` }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.35 }}
          transition={{ delay: 0.16, duration: 0.32, ease: "easeOut" }}
        />

        {/* ultimate name */}
        <motion.div
          className="relative -mt-3 px-4 text-center"
          initial={{ scale: 2.4, opacity: 0, letterSpacing: "0.6em" }}
          animate={{ scale: 1, opacity: 1, letterSpacing: "0.12em" }}
          transition={{ delay: 0.14, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="font-pixel text-[22px] uppercase leading-tight text-white"
            style={{
              textShadow: `0 0 6px ${c}, 0 0 20px ${c}, 0 4px 0 #000, 4px 0 0 #000`,
            }}
          >
            {hero.ultimate.name}
          </div>
          <div
            className="mt-2 font-pixel text-[9px] uppercase tracking-[0.4em]"
            style={{ color: c }}
          >
            Ultimate
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
