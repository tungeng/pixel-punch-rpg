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

  // Reward hierarchy: an ordinary clear gets out of the way fast, a boss kill
  // holds the screen and earns its weight.
  const isBoss = banner?.tone === "boss";
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(clearBanner, banner.tone === "boss" ? 3200 : 1600);
    return () => clearTimeout(t);
  }, [banner, clearBanner]);

  const accent = isBoss ? "#ff5cf0" : "#5ff2e0";

  return (
    <>
      <AnimatePresence>
        {banner && (
          <motion.button
            type="button"
            onClick={clearBanner}
            className="absolute inset-0 z-[120] flex flex-col items-center justify-center"
            style={{
              background: isBoss
                ? `radial-gradient(circle at 50% 45%, ${accent}33 0 24%, rgba(3,4,10,0.95) 62%)`
                : "rgba(4,6,14,0.82)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <motion.div
              initial={{ scale: isBoss ? 0.45 : 0.7, y: 14 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: isBoss ? 180 : 260, damping: isBoss ? 12 : 16 }}
              className="px-6 text-center"
            >
              {isBoss && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: [0, 1, 0.5] }}
                  transition={{ duration: 0.7 }}
                  className="mx-auto mb-4 h-[6px] w-56"
                  style={{ background: accent, boxShadow: `0 0 26px ${accent}` }}
                />
              )}
              <div
                className={`font-pixel ${isBoss ? "text-4xl" : "text-2xl"}`}
                style={{ color: accent, textShadow: `0 0 ${isBoss ? 34 : 18}px ${accent}` }}
              >
                {banner.title}
              </div>
              {isBoss && (
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.4em] text-foreground/70">
                  major threat neutralised
                </div>
              )}
              <div className="mx-auto mt-3 h-[3px]" style={{ background: accent, width: isBoss ? "14rem" : "10rem" }} />
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
            className="pointer-events-none absolute left-1/2 top-2 z-[110] w-[min(420px,88vw)] -translate-x-1/2 border-2 px-3 py-2 text-center"
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
