import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RELICS } from "@/game/relics";
import { useGame } from "@/game/store";

export function RelicChip({ id, size = 22 }: { id: string; size?: number }) {
  const relic = RELICS[id];
  if (!relic) return null;
  return (
    <div
      className="text-pixel flex items-center justify-center"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.5),
        background: relic.color,
        border: "2px solid #07060c",
        boxShadow: `0 0 8px -2px ${relic.color}`,
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
  size = 22,
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
          <button
            key={r}
            onClick={() => setOpen((o) => (o === r ? null : r))}
            aria-label={RELICS[r]?.name ?? r}
            className={open === r ? "ring-2 ring-primary" : ""}
          >
            <RelicChip id={r} size={size} />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open && RELICS[open] && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={() => setOpen(null)}
            className={`absolute top-full z-50 mt-1 w-44 cursor-pointer bg-[#0b0a12] p-2 ${
              align === "right" ? "right-0" : "left-0"
            }`}
            style={{ border: `2px solid ${RELICS[open]!.color}`, boxShadow: "0 6px 0 -2px #07060c" }}
          >
            <div className="text-pixel mb-1 text-[8px]" style={{ color: RELICS[open]!.color }}>
              {RELICS[open]!.name}
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
