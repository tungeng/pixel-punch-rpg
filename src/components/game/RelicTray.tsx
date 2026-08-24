import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RELICS, RELIC_TIER_COLOR } from "@/game/relics";
import { useGame } from "@/game/store";

export function RelicChip({ id, size = 26 }: { id: string; size?: number }) {
  const relic = RELICS[id];
  if (!relic) return null;
  const tierColor = RELIC_TIER_COLOR[relic.tier ?? "common"] ?? "#cbd5e1";
  return (
    <div
      className="text-pixel flex items-center justify-center"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.52),
        background: `radial-gradient(circle at 50% 30%, ${relic.color}, #0b0a12 130%)`,
        border: `2px solid ${tierColor}`,
        outline: "2px solid #07060c",
        boxShadow: `0 0 10px -1px ${relic.color}, 0 0 18px -6px ${tierColor}`,
      }}
      aria-hidden
    >
      {relic.icon}
    </div>
  );
}

/**
 * Persistent relic tray: icons for every owned relic, tap one to read its
 * name + full effect text (mobile-safe — no hover tooltips).
 */
export function RelicTray({
  size = 26,
  align = "left",
  className = "",
}: {
  size?: number;
  align?: "left" | "right";
  className?: string;
}) {
  const relics = useGame((s) => s.relics);
  const [open, setOpen] = useState<string | null>(null);
  if (relics.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div className={`flex flex-wrap gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {relics.map((r) => (
          <motion.button
            key={r}
            layout
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen((o) => (o === r ? null : r))}
            aria-label={RELICS[r]?.name ?? r}
            className={open === r ? "ring-2 ring-primary" : ""}
          >
            <RelicChip id={r} size={size} />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open && RELICS[open] && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={() => setOpen(null)}
            className={`absolute top-full z-50 mt-1 w-48 cursor-pointer bg-[#0b0a12] p-2 ${
              align === "right" ? "right-0" : "left-0"
            }`}
            style={{ border: `2px solid ${RELICS[open]!.color}`, boxShadow: "0 6px 0 -2px #07060c" }}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-pixel text-[8px]" style={{ color: RELICS[open]!.color }}>
                {RELICS[open]!.name}
              </span>
              <span
                className="text-pixel text-[6px]"
                style={{ color: RELIC_TIER_COLOR[RELICS[open]!.tier ?? "common"] }}
              >
                {(RELICS[open]!.tier ?? "common").toUpperCase()}
              </span>
            </div>
            <div
              className="text-[13px] leading-[14px] text-foreground/80"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              {RELICS[open]!.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
