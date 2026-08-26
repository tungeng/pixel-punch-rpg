import { useGame } from "@/game/store";
import { motion, AnimatePresence } from "motion/react";

const OPTIONS = [
  { id: "block" as const, icon: "🛡️", label: "BULWARK", text: "Gain 40 Block.", color: "#54d98c" },
  { id: "damage" as const, icon: "💥", label: "COLLAPSE", text: "Deal 15 damage to all enemies.", color: "#ff6a1f" },
  { id: "draw" as const, icon: "🃏", label: "FORESIGHT", text: "Draw 3 cards.", color: "#54a8ff" },
];

/** Timeline Fracture (mythic): opening-of-combat choice. */
export function FractureChoice() {
  const pending = useGame((s) => s.combat?.fracturePending ?? false);
  const choose = useGame((s) => s.chooseFracture);

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[250] flex flex-col items-center justify-center gap-3 bg-black/85 p-4"
        >
          <div
            className="text-pixel relic-mythic relic-exalted px-3 py-2 text-center text-[10px]"
            style={{ color: "#f472ff", ["--tier-color" as string]: "#f472ff" }}
          >
            TIMELINE FRACTURE
          </div>
          <div
            className="mb-1 text-center text-[14px] text-foreground/75"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            The timeline splits. Choose one thread.
          </div>
          {OPTIONS.map((o, i) => (
            <motion.button
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => choose(o.id)}
              className="flex w-full max-w-[320px] items-center gap-3 bg-[#0b0a12] p-3 text-left"
              style={{ border: `3px solid ${o.color}`, boxShadow: `0 0 18px -8px ${o.color}` }}
            >
              <span className="text-[22px]">{o.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="text-pixel block text-[9px]" style={{ color: o.color }}>
                  {o.label}
                </span>
                <span
                  className="block text-[14px] leading-[15px] text-foreground/80"
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  {o.text}
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
