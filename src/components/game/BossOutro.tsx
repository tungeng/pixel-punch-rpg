import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/game/store";

/** Boss last words — held over the transition out of the fight, then gone. */
export function BossOutro() {
  const line = useGame((s) => s.bossOutro);
  const clear = useGame((s) => s.clearBossOutro);

  useEffect(() => {
    if (!line) return;
    const t = setTimeout(clear, 2600);
    return () => clearTimeout(t);
  }, [line, clear]);

  return (
    <AnimatePresence>
      {line && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none fixed inset-0 z-[320] flex items-center justify-center bg-black/85 px-6"
        >
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="max-w-[360px] text-center"
          >
            <div className="text-pixel text-[9px] tracking-widest text-destructive">
              FINAL TRANSMISSION
            </div>
            <p
              className="mt-3 text-[17px] leading-[22px] text-foreground"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              “{line}”
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
