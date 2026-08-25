import { motion } from "motion/react";
import { useEffect, useState } from "react";

/** Heroes whose attacks read as a projected beam/bolt rather than a physical lunge. */
export const BEAM_HEROES = new Set(["mercy", "moira"]);

const EXPLOSION = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  const r = 40 + (i % 3) * 22;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.85, size: 4 + (i % 3) * 3 };
});

/**
 * Per-hero attack flourish drawn over the enemy arena. Mounted with a fresh key
 * on every damaging card and unmounts itself once the effect has played.
 */
export function HeroVfx({ heroId }: { heroId: string }) {
  const [alive, setAlive] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAlive(false), 750);
    return () => clearTimeout(t);
  }, []);
  if (!alive) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {heroId === "genji" && (
        <motion.div
          initial={{ opacity: 0, rotate: -60, scale: 0.5, x: -60 }}
          animate={{ opacity: [0, 1, 0], rotate: 25, scale: 1.4, x: 40 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 h-2 w-56 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "linear-gradient(90deg, transparent, #ffffff, #b9f6ff, transparent)",
            boxShadow: "0 0 20px 6px #ffffffaa",
          }}
        />
      )}

      {heroId === "tracer" &&
        [0, 1].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleX: 0.1, x: -140 }}
            animate={{ opacity: [0, 1, 0], scaleX: 1, x: 30 }}
            transition={{ duration: 0.22, delay: i * 0.11, ease: "easeOut" }}
            className="absolute left-1/2 h-1.5 w-48 -translate-x-1/2"
            style={{
              top: `calc(50% + ${i === 0 ? -14 : 12}px)`,
              transformOrigin: "left center",
              background: "linear-gradient(90deg, #fff7d6, #ffcc4d, transparent)",
              boxShadow: "0 0 12px 3px #ffcc4d",
            }}
          />
        ))}

      {heroId === "doomfist" && (
        <motion.div
          initial={{ opacity: 0.95, scale: 0.2 }}
          animate={{ opacity: 0, scale: 2.4 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            border: "6px solid #c084fc",
            boxShadow: "0 0 26px 8px #7c3aed, inset 0 0 18px 4px #ffffff88",
          }}
        />
      )}

      {heroId === "junkrat" && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 1, scale: 0.3 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="h-24 w-24 rounded-full"
            style={{
              background: "radial-gradient(circle, #fffbe6 10%, #ffcc4d 35%, #ff5a1f 60%, transparent 75%)",
            }}
          />
          {EXPLOSION.map((p, i) => (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2"
              style={{
                width: p.size,
                height: p.size,
                background: i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ffcc4d" : "#ff5a1f",
                boxShadow: "0 0 8px #ff9f43",
              }}
            />
          ))}
        </div>
      )}

      {BEAM_HEROES.has(heroId) && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scaleX: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute h-2 w-[130%]"
          style={{
            left: "-12%",
            bottom: "6%",
            transformOrigin: "left center",
            rotate: "-24deg",
            background:
              heroId === "moira"
                ? "linear-gradient(90deg, #4c1d95, #a855f7, #f0abfc, #ffffff)"
                : "linear-gradient(90deg, #78350f, #fcd34d, #fffbe6, #ffffff)",
            boxShadow: heroId === "moira" ? "0 0 20px 6px #a855f7" : "0 0 20px 6px #fcd34d",
          }}
        />
      )}

      {heroId === "reinhardt" && (
        <motion.div
          initial={{ opacity: 0, rotate: -95, y: -40 }}
          animate={{ opacity: [0, 1, 0], rotate: 20, y: 10 }}
          transition={{ duration: 0.42, ease: "easeIn" }}
          className="absolute left-1/2 top-1/2 h-3 w-52 -translate-x-1/2 -translate-y-1/2"
          style={{
            transformOrigin: "left center",
            background: "linear-gradient(90deg, transparent, #38bdf8, #ffffff, #fb923c)",
            boxShadow: "0 0 24px 8px #38bdf8aa",
          }}
        />
      )}
    </div>
  );
}
