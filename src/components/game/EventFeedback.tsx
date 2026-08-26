import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/game/store";

/**
 * Global feedback layer. Two jobs:
 *  - a small toast that spells out what the last action actually did
 *  - a full-screen beat when a fight ends, so a kill never just cuts away
 */
export function EventFeedback() {
  const lastEvent = useGame((s) => s.lastEvent);
  const lastEventAt = useGame((s) => s.lastEventAt);
  const banner = useGame((s) => s.banner);
  const clearBanner = useGame((s) => s.clearBanner);

  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);

  useEffect(() => {
    if (!lastEvent) return;
    setToast({ text: lastEvent, key: lastEventAt });
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [lastEvent, lastEventAt]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(clearBanner, 1900);
    return () => clearTimeout(t);
  }, [banner, clearBanner]);

  const accent = banner?.tone === "boss" ? "#ff5cf0" : "#5ff2e0";

  return (
    <>
      <AnimatePresence>
        {banner && (
          <motion.button
            type="button"
            onClick={clearBanner}
            className="fixed inset-0 z-[120] flex flex-col items-center justify-center"
            style={{ background: "rgba(4,6,14,0.82)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              initial={{ scale: 0.7, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="px-6 text-center"
            >
              <div
                className="font-pixel text-2xl"
                style={{ color: accent, textShadow: `0 0 18px ${accent}` }}
              >
                {banner.title}
              </div>
              <div className="mx-auto mt-3 h-[3px] w-40" style={{ background: accent }} />
              <div className="mt-4 space-y-1">
                {banner.lines.map((line) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="font-mono text-sm text-foreground"
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
              <div className="mt-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                tap to continue
              </div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed left-1/2 top-[104px] z-[110] w-[min(420px,88vw)] -translate-x-1/2 border-2 px-3 py-2 text-center"
            style={{
              borderColor: "#5ff2e0",
              background: "rgba(6,10,20,0.94)",
              boxShadow: "0 0 0 2px rgba(0,0,0,0.6), 0 0 18px rgba(95,242,224,0.25)",
            }}
          >
            <span className="font-mono text-xs text-foreground">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
