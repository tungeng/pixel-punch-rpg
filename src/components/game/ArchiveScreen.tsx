import { motion } from "motion/react";
import { useGame } from "@/game/store";
import { UPGRADES, tierOf } from "@/game/upgrades";
import { PixelButton } from "@/components/game/PixelButton";

export function ArchiveScreen({ onClose }: { onClose: () => void }) {
  const meta = useGame((s) => s.meta);
  const buyUpgrade = useGame((s) => s.buyUpgrade);

  return (
    <div className="scanlines fixed inset-0 z-50 overflow-y-auto bg-background px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col">
        <div className="flex items-center justify-between border-b border-primary/30 pb-3">
          <h2 className="text-pixel text-[13px] text-accent">ARCHIVE</h2>
          <span className="text-[13px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
            ⬢ {meta.credits} Cores
          </span>
        </div>

        <p
          className="mt-3 text-[13px] text-muted-foreground"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          Permanent upgrades. Bought once, they apply to every future run.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {UPGRADES.map((u, i) => {
            const tier = tierOf(meta.upgrades, u.id);
            const maxed = tier >= u.maxTier;
            const cost = maxed ? null : u.costs[tier]!;
            const affordable = cost !== null && meta.credits >= cost;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 240, damping: 18 }}
                className={`border-2 p-3 ${maxed ? "border-accent/70 bg-accent/10" : "border-border bg-card"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] text-primary">{u.icon}</span>
                    <span className="text-pixel text-[9px] text-primary">{u.name}</span>
                  </div>
                  <div className="flex shrink-0 gap-[3px]">
                    {Array.from({ length: u.maxTier }).map((_, t) => (
                      <span
                        key={t}
                        className={`h-3 w-2 border ${t < tier ? "border-accent bg-accent" : "border-border/70 bg-transparent"}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-2 space-y-1" style={{ fontFamily: "var(--font-pixel-body)" }}>
                  <div className="text-[14px] text-foreground/90">
                    TIER {tier}/{u.maxTier} — {tier > 0 ? u.effect(tier) : "no effect yet"}
                  </div>
                  <div className="text-[13px] text-muted-foreground">{u.perTier}</div>
                  {!maxed && (
                    <div className="text-[13px] text-foreground/75">
                      Next: {u.effect(tier + 1)}
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  {maxed ? (
                    <div
                      className="border border-accent/70 bg-accent/15 px-2 py-1.5 text-center text-[13px] text-accent"
                      style={{ fontFamily: "var(--font-pixel-body)" }}
                    >
                      ★ MAXED OUT
                    </div>
                  ) : (
                    <PixelButton
                      onClick={() => buyUpgrade(u.id)}
                      disabled={!affordable}
                      color="secondary"
                      className="w-full"
                    >
                      UPGRADE — ⬢ {cost}
                    </PixelButton>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-5 mb-2">
          <PixelButton onClick={onClose} className="w-full">
            ◀ BACK
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
