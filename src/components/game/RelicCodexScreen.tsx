import type { MotionStyle } from "motion/react";
import { motion } from "motion/react";
import { useGame } from "@/game/store";
import { ALL_RELIC_IDS, RELICS, RELIC_TIER_COLOR, relicUnlockCost, isExaltedTier } from "@/game/relics";
import { PixelButton } from "@/components/game/PixelButton";

const TIER_ORDER = ["common", "uncommon", "rare"] as const;

export function RelicCodexScreen({ onClose }: { onClose: () => void }) {
  const meta = useGame((s) => s.meta);
  const unlockRelic = useGame((s) => s.unlockRelic);
  const unlocked = new Set(meta.unlockedRelics);

  const ids = [...ALL_RELIC_IDS].sort(
    (a, b) =>
      TIER_ORDER.indexOf((RELICS[a]?.tier ?? "common") as (typeof TIER_ORDER)[number]) -
      TIER_ORDER.indexOf((RELICS[b]?.tier ?? "common") as (typeof TIER_ORDER)[number]),
  );

  return (
    <div className="scanlines fixed inset-0 z-50 overflow-y-auto bg-background px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flex items-center justify-between border-b border-primary/30 pb-3">
          <h2 className="text-pixel text-[13px] text-accent">RELIC CODEX</h2>
          <span
            className="text-[13px] text-muted-foreground"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            ⬢ {meta.credits} Cores
          </span>
        </div>

        <p
          className="mt-3 text-[13px] text-muted-foreground"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          Locked relics never appear in runs. Spend Chrono Cores to add them to the drop pool
          permanently. {unlocked.size}/{ALL_RELIC_IDS.length} decoded.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {ids.map((id, i) => {
            const relic = RELICS[id]!;
            const tier = relic.tier ?? "common";
            const tierColor = RELIC_TIER_COLOR[tier] ?? "#cbd5e1";
            const isUnlocked = unlocked.has(id);
            const cost = relicUnlockCost(id);
            const affordable = meta.credits >= cost;
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                whileTap={{ scale: isUnlocked ? 1 : 0.98 }}
                disabled={isUnlocked || !affordable}
                onClick={() => !isUnlocked && affordable && unlockRelic(id)}
                className={`flex items-center gap-3 border-2 p-2 text-left disabled:cursor-default ${
                  isUnlocked && isExaltedTier(tier) ? "relic-exalted" : ""
                } ${isUnlocked && tier === "mythic" ? "relic-mythic" : ""}`}
                style={
                  {
                    borderColor: isUnlocked ? tierColor : "#2a2740",
                    background: isUnlocked ? "#0b0a12" : "#0a0912",
                    "--tier-color": tierColor,
                  } as unknown as MotionStyle
                }
              >
                <div className="relative shrink-0">
                  <div
                    className="text-pixel flex items-center justify-center"
                    style={{
                      width: 34,
                      height: 34,
                      fontSize: 17,
                      background: isUnlocked
                        ? `radial-gradient(circle at 50% 30%, ${relic.color}, #0b0a12 130%)`
                        : "#15132099",
                      border: `2px solid ${isUnlocked ? tierColor : "#3a3556"}`,
                      outline: "2px solid #07060c",
                      filter: isUnlocked ? undefined : "grayscale(1) brightness(0.35)",
                    }}
                    aria-hidden
                  >
                    {relic.icon}
                  </div>
                  {!isUnlocked && (
                    <span className="absolute inset-0 flex items-center justify-center text-[15px]">
                      🔒
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-pixel text-[8px]"
                      style={{ color: isUnlocked ? relic.color : "#6b6890" }}
                    >
                      {isUnlocked ? relic.name : "??? ENCRYPTED"}
                    </span>
                    <span
                      className="text-pixel shrink-0 text-[6px]"
                      style={{ color: isUnlocked ? tierColor : "#6b6890" }}
                    >
                      {tier.toUpperCase()}
                    </span>
                  </div>
                  <div
                    className="mt-1 text-[13px] leading-[14px]"
                    style={{
                      fontFamily: "var(--font-pixel-body)",
                      color: isUnlocked ? "hsl(var(--foreground))" : undefined,
                    }}
                  >
                    <span className={isUnlocked ? "text-foreground/80" : "text-muted-foreground"}>
                      {relic.text}
                    </span>
                  </div>
                  {!isUnlocked && (
                    <div
                      className="mt-1 text-[13px]"
                      style={{ fontFamily: "var(--font-pixel-body)" }}
                    >
                      <span className={affordable ? "text-accent" : "text-muted-foreground"}>
                        {affordable ? `Tap to unlock — ⬢ ${cost}` : `Locked — ⬢ ${cost}`}
                      </span>
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-5 pb-4">
          <PixelButton onClick={onClose} color="primary" className="w-full">
            ◀ BACK
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
