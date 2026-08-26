import { motion } from "motion/react";
import { useEffect, useState } from "react";

/** Heroes whose attacks read as a projected beam/bolt rather than a physical lunge. */
export const BEAM_HEROES = new Set(["mercy", "moira"]);

const EXPLOSION = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  const r = 40 + (i % 3) * 22;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.85, size: 4 + (i % 3) * 3 };
});

const SHRAPNEL = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2 + 0.3;
  const r = 55 + (i % 4) * 20;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.9, size: 3 + (i % 4) * 2 };
});

const PETALS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return { x: Math.cos(a) * 70, y: Math.sin(a) * 55 };
});

/**
 * Per-hero attack flourish drawn over the enemy arena. Mounted with a fresh key
 * on every damaging card and unmounts itself once the effect has played.
 *
 * `variant` picks between that hero's 3 distinct signature animations:
 *   0 = basic strike, 1 = multi-hit / combo, 2 = heavy or AoE finisher.
 */
export function HeroVfx({ heroId, variant = 0 }: { heroId: string; variant?: number }) {
  const [alive, setAlive] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setAlive(false), 900);
    return () => clearTimeout(t);
  }, []);
  if (!alive) return null;
  const v = ((variant % 3) + 3) % 3;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {/* ---------------- GENJI ---------------- */}
      {heroId === "genji" && v === 0 && (
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
      {heroId === "genji" && v === 1 &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.4, rotate: -20 + i * 14 }}
            animate={{ opacity: [0, 1, 0], scale: 1, rotate: 340 + i * 14 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: "linear" }}
            className="absolute left-1/2 top-1/2 h-1.5 w-9"
            style={{
              marginLeft: -18 + (i % 3) * 34 - 34,
              marginTop: -30 + i * 11,
              background: "linear-gradient(90deg, #86efac, #ffffff)",
              boxShadow: "0 0 8px 2px #22c55e",
            }}
          />
        ))}
      {heroId === "genji" && v === 2 && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleX: 0, rotate: -50 + i * 45 }}
              animate={{ opacity: [0, 1, 0], scaleX: 1.5, rotate: -35 + i * 45 }}
              transition={{ duration: 0.3, delay: i * 0.1, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-2.5 w-64 -translate-x-1/2 -translate-y-1/2"
              style={{
                background: "linear-gradient(90deg, transparent, #22c55e, #ffffff, transparent)",
                boxShadow: "0 0 22px 6px #22c55eaa",
              }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.2, x: -120 }}
            animate={{ opacity: [0, 0.9, 0], scale: 1.2, x: 90 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-24 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "radial-gradient(ellipse, #4ade8099 20%, transparent 70%)",
            }}
          />
        </>
      )}

      {/* ---------------- TRACER ---------------- */}
      {heroId === "tracer" && v === 0 &&
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
      {heroId === "tracer" && v === 1 &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, x: -160, y: -40 + i * 16 }}
            animate={{ opacity: [0, 1, 0], x: 90, y: -30 + i * 16 }}
            transition={{ duration: 0.24, delay: i * 0.045, ease: "linear" }}
            className="absolute left-1/2 top-1/2 h-1 w-16"
            style={{
              background: "linear-gradient(90deg, transparent, #ffffff, #ffcc4d)",
              boxShadow: "0 0 10px 2px #f59e0b",
            }}
          />
        ))}
      {heroId === "tracer" && v === 2 && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.8, scale: 0.3 }}
              animate={{ opacity: 0, scale: 2.2 + i * 0.5 }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ border: "4px solid #38bdf8", boxShadow: "0 0 20px 6px #0ea5e9" }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], rotate: 300 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, transparent, #38bdf888, transparent 60%)",
            }}
          />
        </>
      )}

      {/* ---------------- DOOMFIST ---------------- */}
      {heroId === "doomfist" && v === 0 && (
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
      {heroId === "doomfist" && v === 1 &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.4, y: 30, x: -30 + i * 30 }}
            animate={{ opacity: [0, 1, 0], scale: 1.4, y: -60 - i * 10 }}
            transition={{ duration: 0.42, delay: i * 0.09, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-20 w-8 -translate-x-1/2"
            style={{
              background: "linear-gradient(0deg, transparent, #a855f7, #ffffff)",
              boxShadow: "0 0 18px 5px #7c3aed",
            }}
          />
        ))}
      {heroId === "doomfist" && v === 2 && (
        <>
          <motion.div
            initial={{ opacity: 1, scale: 0.1 }}
            animate={{ opacity: 0, scale: 3 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle, #ffffff 5%, #c084fc 30%, transparent 65%)",
            }}
          />
          {SHRAPNEL.slice(0, 14).map((p, i) => (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: p.x, y: Math.abs(p.y) * -0.6, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2"
              style={{
                width: p.size + 2,
                height: p.size + 2,
                background: i % 2 ? "#6b21a8" : "#d8b4fe",
                boxShadow: "0 0 8px #a855f7",
              }}
            />
          ))}
        </>
      )}

      {/* ---------------- JUNKRAT ---------------- */}
      {heroId === "junkrat" && v === 0 && (
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
      {heroId === "junkrat" && v === 1 &&
        [0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -150, y: 40 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: -40 + i * 40,
              y: [40, -50, 20, -10],
              rotate: 540,
            }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-4 w-4 rounded-full"
            style={{ background: "#ffcc4d", boxShadow: "0 0 12px 4px #ff5a1f" }}
          />
        ))}
      {heroId === "junkrat" && v === 2 && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div
            initial={{ opacity: 1, scale: 0.2 }}
            animate={{ opacity: 0, scale: 3.2 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="h-32 w-32 rounded-full"
            style={{
              background: "radial-gradient(circle, #ffffff 8%, #ffcc4d 30%, #ff5a1f 55%, #7c2d12 70%, transparent 80%)",
            }}
          />
          {SHRAPNEL.map((p, i) => (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: p.y, opacity: 0, rotate: 360 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2"
              style={{
                width: p.size,
                height: p.size,
                background: i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#facc15" : "#ea580c",
                boxShadow: "0 0 8px #ff9f43",
              }}
            />
          ))}
        </div>
      )}

      {/* ---------------- MERCY / MOIRA BEAMS ---------------- */}
      {BEAM_HEROES.has(heroId) && v === 0 && (
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
      {heroId === "moira" && v === 1 &&
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, x: -80 + i * 6, y: 60, scale: 0.6 }}
            animate={{ opacity: [0, 0.9, 0], y: -70, scale: 1.6 }}
            transition={{ duration: 0.7, delay: i * 0.05, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-5 w-5 rounded-full"
            style={{ background: "#a855f7", boxShadow: "0 0 14px 6px #7e22ce" }}
          />
        ))}
      {heroId === "moira" && v === 2 && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.2, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], scale: 2.4, rotate: 220 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "conic-gradient(from 0deg, #4c1d95, #a855f7, #f0abfc, #4c1d95)",
              opacity: 0.65,
              mixBlendMode: "screen",
            }}
          />
          {PETALS.map((p, i) => (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, opacity: 0.9 }}
              animate={{ x: p.x, y: p.y, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-3 w-3"
              style={{ background: "#f0abfc", boxShadow: "0 0 10px #a855f7" }}
            />
          ))}
        </>
      )}
      {heroId === "mercy" && v === 1 &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 60, x: -60 + i * 24, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], y: -60, scale: 1.3 }}
            transition={{ duration: 0.7, delay: i * 0.06, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-4 w-4"
            style={{
              background: "#fcd34d",
              clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
              boxShadow: "0 0 12px 4px #fde68a",
            }}
          />
        ))}
      {heroId === "mercy" && v === 2 && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.9, 0], scale: 2.2 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle, #fffbe6 10%, #fcd34d 40%, transparent 70%)",
            }}
          />
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleY: 0.2, x: i ? 40 : -40 }}
              animate={{ opacity: [0, 1, 0], scaleY: 1, y: -14 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-24 w-16 -translate-x-1/2 -translate-y-1/2"
              style={{
                background: `linear-gradient(${i ? "-" : ""}70deg, #fffbe6, #fcd34d88, transparent)`,
                clipPath: i
                  ? "polygon(0% 50%, 100% 0%, 100% 100%)"
                  : "polygon(100% 50%, 0% 0%, 0% 100%)",
                boxShadow: "0 0 18px 6px #fde68a",
              }}
            />
          ))}
        </>
      )}

      {/* ---------------- BASTION ---------------- */}
      {heroId === "bastion" && v === 0 && (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: -120, y: -20 + i * 8 }}
              animate={{ opacity: [1, 1, 0], x: 90 }}
              transition={{ duration: 0.28, delay: i * 0.045, ease: "linear" }}
              className="absolute left-1/2 top-1/2 h-1.5 w-6"
              style={{ background: "#fde68a", boxShadow: "0 0 8px #facc15" }}
            />
          ))}
        </>
      )}
      {heroId === "bastion" && v === 1 && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: [0, 1, 0], scale: 1.5 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, #fb923c, #84cc1600)", boxShadow: "0 0 30px 10px #f9731699" }}
          />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{ opacity: 0, x: Math.cos((i / 8) * 6.28) * 70, y: Math.sin((i / 8) * 6.28) * 70 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-2 w-2"
              style={{ background: "#facc15", boxShadow: "0 0 10px #f97316" }}
            />
          ))}
        </>
      )}
      {heroId === "bastion" && v === 2 && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -140 - i * 30, scaleY: 0.6 }}
              animate={{ opacity: [0, 1, 0], y: 30, scaleY: 1 }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: "easeIn" }}
              className="absolute top-0 h-14 w-3"
              style={{ left: `${25 + i * 16}%`, background: "linear-gradient(180deg, transparent, #84cc16, #ffffff)" }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0, scaleX: 0.2 }}
            animate={{ opacity: [0, 1, 0], scaleX: 1.5 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="absolute bottom-8 left-1/2 h-5 w-64 -translate-x-1/2"
            style={{ background: "linear-gradient(90deg, transparent, #fb923c, #ffffff, #fb923c, transparent)" }}
          />
        </>
      )}

      {/* ---------------- REINHARDT ---------------- */}
      {heroId === "reinhardt" && v === 0 && (
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
      {heroId === "reinhardt" && v === 1 && (
        <>
          <motion.div
            initial={{ opacity: 0, scaleX: 0.1, x: -150 }}
            animate={{ opacity: [0, 1, 0], scaleX: 1.3, x: 60 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-10 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #fb923c, #fde68a, #ffffff)",
              boxShadow: "0 0 26px 10px #ea580c99",
            }}
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 1, x: -40, y: -30 + i * 12 }}
              animate={{ opacity: 0, x: 80, y: -50 + i * 20 }}
              transition={{ duration: 0.55, delay: i * 0.03, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 h-2 w-2"
              style={{ background: "#fdba74", boxShadow: "0 0 10px #f97316" }}
            />
          ))}
        </>
      )}
      {heroId === "reinhardt" && v === 2 && (
        <>
          <motion.div
            initial={{ opacity: 0, scaleX: 0.2, y: 60 }}
            animate={{ opacity: [0, 1, 0], scaleX: 1.6, y: 40 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="absolute left-1/2 bottom-6 h-6 w-72 -translate-x-1/2"
            style={{
              background: "linear-gradient(90deg, transparent, #38bdf8, #ffffff, #38bdf8, transparent)",
              boxShadow: "0 0 30px 10px #0ea5e9aa",
            }}
          />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleY: 0, y: 30 }}
              animate={{ opacity: [0, 1, 0], scaleY: 1, y: -10 }}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.04, ease: "easeOut" }}
              className="absolute bottom-8 h-16 w-4"
              style={{
                left: `${10 + i * 12}%`,
                transformOrigin: "bottom center",
                background: "linear-gradient(0deg, #1e3a8a, #38bdf8, #ffffff)",
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                boxShadow: "0 0 14px 4px #38bdf8",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
