import { ACT_COUNT } from "@/game/enemies";
import { useGame, cardPrice, relicPrice } from "@/game/store";
import type { RunRecord } from "@/game/store";
import { HEROES } from "@/game/heroes";
import { RELICS, RELIC_TIER_COLOR, isExaltedTier, relicUnlockCost, ALL_RELIC_IDS } from "@/game/relics";
import { MUTATORS } from "@/game/mutators";
import { CardView } from "./CardView";
import { ScoreSubmit } from "./ScoreSubmit";
import { PixelButton } from "./PixelButton";
import { Bar } from "./Bar";
import { motion } from "motion/react";
import { RelicTray } from "./RelicTray";
import type { ReactNode } from "react";
import type { MotionStyle } from "motion/react";
import { AUGMENTS } from "@/game/progression";

export function RewardScreen() {
  const choices = useGame((s) => s.rewardChoices);
  const gold = useGame((s) => s.rewardGold);
  const pick = useGame((s) => s.pickRewardCard);
  const skip = useGame((s) => s.skipReward);
  const dropped = useGame((s) => s.pendingRelic);
  const relic = dropped ? RELICS[dropped] : null;
  return (
    <Screen title="TIMELINE SECURED" tone="#54d98c" scroll>
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 14 }}
        className="text-pixel mb-4 text-center text-[12px] text-primary"
      >
        +{gold} ⬢
      </motion.div>

      {relic && (
        <motion.div
          initial={{ scale: 0.4, rotate: -14, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: isExaltedTier(relic.tier) ? 160 : 240, damping: isExaltedTier(relic.tier) ? 11 : 13 }}
          className={`mb-4 flex w-full max-w-[320px] items-center gap-3 bg-black/50 p-2 ${
            isExaltedTier(relic.tier) ? "relic-exalted" : ""
          } ${relic.tier === "mythic" ? "relic-mythic" : ""}`}
          style={
            {
              border: `3px solid ${relic.color}`,
              boxShadow: `0 0 24px -6px ${relic.color}`,
              "--tier-color": RELIC_TIER_COLOR[relic.tier ?? "common"],
            } as unknown as MotionStyle
          }
        >
          <div className="breathe-glow shrink-0">
            <RelicIcon id={relic.id} />
          </div>
          <div className="min-w-0">
            <div className="text-pixel text-[7px]" style={{ color: RELIC_TIER_COLOR[relic.tier ?? "common"] }}>
              {isExaltedTier(relic.tier) ? "★ " : ""}
              {(relic.tier ?? "common").toUpperCase()} RELIC SALVAGED
            </div>
            <div className="text-pixel text-[9px] leading-[12px]" style={{ color: relic.color }}>
              {relic.name}
            </div>
            <div
              className="text-[14px] leading-[15px] text-foreground/85"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              {relic.text}
            </div>
          </div>
        </motion.div>
      )}

      <div className="mb-3 text-center text-[15px] text-foreground/75" style={{ fontFamily: "var(--font-pixel-body)" }}>
        Salvage one card from the wreckage.
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {choices.map((c, i) => (
          <motion.div
            key={c.uid}
            initial={{ y: 40, opacity: 0, rotate: -6 + i * 6 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.1 + i * 0.09, type: "spring", stiffness: 260, damping: 18 }}
          >
            <CardView card={c} size="reward" onClick={() => pick(c.id)} />
          </motion.div>
        ))}
      </div>
      <div className="mt-6 flex flex-col items-center gap-1 pb-4">
        <PixelButton onClick={skip} color="ghost">Skip card: stabilize deck</PixelButton>
        <span className="max-w-[300px] text-center text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
          Take no card. Permanently upgrades one card already in your deck, or pays 18 gold if nothing can be upgraded.
        </span>
      </div>
    </Screen>
  );
}

export function AugmentChoiceScreen() {
  const ids = useGame((s) => s.augmentChoices);
  const choose = useGame((s) => s.chooseAugment);
  const tiers = useGame((s) => s.augmentTiers);
  const relics = useGame((s) => s.relics.length);
  const deck = useGame((s) => s.deck);
  const contract = useGame((s) => s.contractsCompleted);
  const upgraded = deck.filter((card) => card.upgraded).length;
  return (
    <Screen title="HERO EVOLUTION" tone="#ff7a45" scroll>
      <div className="mb-5 text-center text-[15px] text-foreground/75" style={{ fontFamily: "var(--font-pixel-body)" }}>
        Commit to one path. Deepening what you carry beats collecting everything.
      </div>
      <div className="text-pixel mb-4 grid w-full max-w-[360px] grid-cols-3 border-2 border-primary/30 bg-background/70 text-center text-[7px]">
        <span className="border-r-2 border-primary/20 px-1 py-2">RELICS<br /><b className="text-primary">{relics}</b></span>
        <span className="border-r-2 border-primary/20 px-1 py-2">DECK<br /><b className="text-primary">{deck.length} · +{upgraded}</b></span>
        <span className="px-1 py-2">CONTRACTS<br /><b className="text-primary">{contract}</b></span>
      </div>
      <div className="grid w-full max-w-[360px] gap-3">
        {ids.map((id, i) => {
          const augment = AUGMENTS[id];
          if (!augment) return null;
          return (
            <motion.button
              key={`${id}-${i}`}
              initial={{ x: i % 2 ? 40 : -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => choose(id)}
              className="flex items-center gap-3 border-2 border-primary/70 bg-card p-3 text-left hover:border-primary"
            >
              <span className="text-pixel flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-[15px] text-primary-foreground">{augment.icon}</span>
              <span>
                <span className="text-pixel block text-[9px] text-primary">
                  {augment.name}
                  {(tiers[id] ?? 0) > 0 ? ` · TIER ${(tiers[id] ?? 0) + 1}` : ""}
                </span>
                <span className="mt-1 block text-[14px] leading-[16px] text-foreground/80" style={{ fontFamily: "var(--font-pixel-body)" }}>
                  {(tiers[id] ?? 0) > 0
                    ? `Deepen this path. Every effect scales again: ${augment.text}`
                    : augment.text}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </Screen>
  );
}


export function RestScreen() {
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const deck = useGame((s) => s.deck);
  const heal = useGame((s) => s.restHeal);
  const upgrade = useGame((s) => s.restUpgrade);
  const recycle = useGame((s) => s.restRecycle);
  const upgradeable = deck.filter((c) => !c.upgraded);
  return (
    <Screen title="SAFEHOUSE" tone="#54d98c">
      <div className="mb-3 w-full max-w-[280px]">
        <Bar value={hp} max={maxHp} color="linear-gradient(90deg,#ff3b3b,#ffcc4d)" label={`${hp}/${maxHp}`} height={14} />
      </div>
      <div className="mb-4 text-center text-[15px] text-foreground/75" style={{ fontFamily: "var(--font-pixel-body)" }}>
        Nobody shooting at you for once. Stitch yourself up, or put an edge on one card.
      </div>
      <PixelButton onClick={heal} color="primary">Rest, heal 30%</PixelButton>
      <div className="text-pixel mb-2 mt-5 text-center text-[8px] text-muted-foreground">OR UPGRADE:</div>
      <div className="flex max-h-56 flex-wrap justify-center gap-2 overflow-y-auto px-2 pb-2">
        {upgradeable.map((c) => (
          <CardView key={c.uid} card={c} size="hand" onClick={() => upgrade(c.uid)} />
        ))}
        {upgradeable.length === 0 && (
          <div className="text-[14px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
            Every card is already upgraded.
          </div>
        )}
      </div>
      {deck.length > 6 && (
        <>
          <div className="text-pixel mb-2 mt-4 text-center text-[8px] text-accent">OR RECYCLE: REMOVE A CARD, +4 MAX HP</div>
          <div className="flex max-h-32 flex-wrap justify-center gap-2 overflow-y-auto px-2 pb-2">
            {deck.map((c) => <CardView key={`recycle-${c.uid}`} card={c} size="hand" onClick={() => recycle(c.uid)} />)}
          </div>
        </>
      )}
    </Screen>
  );
}

export function TreasureScreen() {
  const take = useGame((s) => s.takeTreasure);
  const pending = useGame((s) => s.pendingRelic);
  const confirm = useGame((s) => s.confirmRelic);

  if (pending) {
    const relic = RELICS[pending];
    return (
      <Screen title="RELIC ACQUIRED" tone="#ffcc4d">
        <motion.div
          initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14 }}
          className={`mb-4 flex flex-col items-center gap-3 p-3 ${
            isExaltedTier(relic?.tier) ? "relic-exalted" : ""
          } ${relic?.tier === "mythic" ? "relic-mythic" : ""}`}
          style={{ "--tier-color": RELIC_TIER_COLOR[relic?.tier ?? "common"] } as unknown as MotionStyle}
        >
          <div className="scale-[1.8]">
            <RelicIcon id={pending} />
          </div>
          <div className="text-pixel mt-3 text-center text-[11px]" style={{ color: relic?.color }}>
            {relic?.name}
          </div>
        </motion.div>
        <div
          className="mb-6 max-w-[280px] text-center text-[16px] leading-[18px] text-foreground/85"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          {relic?.text}
        </div>
        <PixelButton onClick={confirm} color="primary">Continue</PixelButton>
      </Screen>
    );
  }

  return (
    <Screen title="CHRONO CACHE" tone="#54a8ff">
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{ repeat: Infinity, duration: 2.4 }}
        className="text-pixel mb-5 text-[36px]"
        style={{ color: "#ffcc4d", textShadow: "0 0 18px #ffcc4d" }}
      >
        ▣
      </motion.div>
      <div className="mb-6 text-center text-[16px] text-foreground/80" style={{ fontFamily: "var(--font-pixel-body)" }}>
        A sealed pod, ticking a half-second behind everything else.
      </div>
      <div className="grid w-full max-w-[300px] gap-3">
        <PixelButton onClick={() => take("salvage")} color="secondary">SALVAGE · 3 UPGRADED CARDS</PixelButton>
        <PixelButton onClick={() => take("breach")} color="danger">BREACH · RELIC, LOSE 12% HP</PixelButton>
      </div>
    </Screen>
  );
}

export function ShopScreen() {
  const shopCards = useGame((s) => s.shopCards);
  const shopRelics = useGame((s) => s.shopRelics);
  const gold = useGame((s) => s.gold);
  const buyCard = useGame((s) => s.buyCard);
  const buyRelic = useGame((s) => s.buyRelic);
  const buyRemove = useGame((s) => s.buyRemove);
  const leave = useGame((s) => s.leaveShop);
  const deck = useGame((s) => s.deck);
  const canRemove = deck.length > 5 && gold >= 75;

  return (
    <Screen title="BLACK MARKET" tone="#ffcc4d" scroll>
      <div className="text-pixel mb-3 text-center text-[10px] text-primary">⬢ {gold}</div>

      <div className="flex flex-wrap justify-center gap-3">
        {shopCards.map((c, i) => {
          const price = cardPrice(c);
          return (
            <div key={c.uid} className="flex flex-col items-center gap-1">
              <CardView card={c} size="shop" onClick={() => buyCard(i)} dimmed={gold < price} />
              <span className="text-pixel text-[8px]" style={{ color: gold < price ? "#8b93a8" : "#ffcc4d" }}>
                ⬢{price}
              </span>
            </div>
          );
        })}
        {shopCards.length === 0 && (
          <span className="text-[14px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
            Card stock cleared out.
          </span>
        )}
      </div>

      <div className="text-pixel mt-5 text-center text-[8px] text-muted-foreground">RELICS</div>
      <div className="mt-2 flex flex-wrap items-start justify-center gap-3">
        {shopRelics.map((r, i) =>
          r ? (
            <motion.button
              key={i}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -4 }}
              onClick={() => buyRelic(i)}
              disabled={gold < relicPrice(r)}
              className={`flex w-32 flex-col items-center gap-1 bg-black/40 p-2 disabled:opacity-40 ${
                isExaltedTier(RELICS[r]?.tier) ? "relic-exalted" : ""
              } ${RELICS[r]?.tier === "mythic" ? "relic-mythic" : ""}`}
              style={
                {
                  border: `2px solid ${RELICS[r]?.color ?? "#07060c"}`,
                  "--tier-color": RELIC_TIER_COLOR[RELICS[r]?.tier ?? "common"],
                } as unknown as MotionStyle
              }
            >
              <RelicIcon id={r} />
              <span className="text-pixel text-center text-[8px] leading-[11px]" style={{ color: RELICS[r]?.color }}>
                {RELICS[r]?.name}
              </span>
              <span
                className="text-pixel text-[6px]"
                style={{ color: RELIC_TIER_COLOR[RELICS[r]?.tier ?? "common"] }}
              >
                {(RELICS[r]?.tier ?? "common").toUpperCase()} · {relicPrice(r)}⬢
              </span>
              <span className="text-center text-[12px] leading-[13px] text-foreground/75" style={{ fontFamily: "var(--font-pixel-body)" }}>
                {RELICS[r]?.text}
              </span>
            </motion.button>

          ) : null,
        )}
      </div>

      <div className="text-pixel mt-5 text-center text-[8px] text-muted-foreground">
        PURGE A CARD: 75⬢ {deck.length <= 5 ? "(deck too small)" : ""}
      </div>
      <div className="mt-2 flex max-h-40 flex-wrap justify-center gap-2 overflow-y-auto px-2 pb-2">
        {deck.map((c) => (
          <CardView key={c.uid} card={c} size="hand" onClick={() => buyRemove(c.uid)} dimmed={!canRemove} />
        ))}
      </div>

      <div className="mt-5 flex justify-center pb-4">
        <PixelButton onClick={leave} color="ghost">Leave</PixelButton>
      </div>
    </Screen>
  );
}

/** Records broken by the run just finished. Legendary beats read louder. */
function RecordReel({ records }: { records: NonNullable<RunRecord["records"]> }) {
  if (!records.length) return null;
  return (
    <div className="mb-4 w-full max-w-[320px] space-y-2">
      {records.map((r, i) => {
        const legendary = r.tier === "legendary";
        const tone = legendary ? "#ffcf4d" : "#5ff2e0";
        return (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, scale: legendary ? 0.6 : 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.35 + i * 0.18, type: "spring", stiffness: 240, damping: 14 }}
            className="flex items-center justify-between gap-3 px-3 py-2"
            style={{
              border: `3px solid ${tone}`,
              background: legendary ? `${tone}1f` : "rgba(6,10,20,0.7)",
              boxShadow: legendary ? `0 0 26px -6px ${tone}` : "none",
            }}
          >
            <div className="text-pixel text-[7px]" style={{ color: tone }}>
              {legendary ? "★ " : ""}NEW {r.label}
            </div>
            <div className="text-pixel text-[9px] text-foreground">{r.value}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** The single most important screen for retention: it has to make you tap again. */
function RunOverTail() {
  const abandon = useGame((s) => s.abandon);
  const rerun = useGame((s) => s.rerun);
  const last = useGame((s) => s.lastRun);
  const credits = useGame((s) => s.meta.credits);
  const unlocked = useGame((s) => s.meta.unlockedRelics);
  const hero = last ? HEROES[last.heroId] : null;
  const mut = last?.mutator ? MUTATORS[last.mutator] : null;
  const next = ALL_RELIC_IDS
    .filter((id) => !unlocked.includes(id))
    .map((id) => ({ id, cost: relicUnlockCost(id) }))
    .sort((a, b) => a.cost - b.cost)[0];
  return (
    <>
      <RecordReel records={last?.records ?? []} />

      {last && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-3 w-full max-w-[320px] border-2 border-primary/40 bg-background/70"
        >
          <div className="flex items-center gap-3 border-b-2 border-primary/25 p-3">
            {hero && (
              <img
                src={hero.asset}
                alt={hero.name}
                width={64}
                height={64}
                decoding="async"
                className="pixelated h-12 w-12 shrink-0 object-contain"
              />
            )}
            <div className="min-w-0">
              <div className="text-pixel text-[9px]" style={{ color: hero?.color }}>
                {hero?.name ?? "AGENT"}
              </div>
              <div className="text-pixel mt-1 text-[7px] text-muted-foreground">
                ACT {last.act} · FLOOR {last.floorsCleared}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-pixel text-[6px] text-muted-foreground">SCORE</div>
              <div className="text-pixel text-[13px] text-primary">{last.score}</div>
            </div>
          </div>
          <div className="text-pixel grid grid-cols-3 text-center text-[6px] text-muted-foreground">
            <span className="border-r-2 border-primary/20 px-1 py-2">
              CORES<br /><b className="text-[9px] text-primary">+{last.cores ?? 0}</b>
            </span>
            <span className="border-r-2 border-primary/20 px-1 py-2">
              BIG HIT<br /><b className="text-[9px] text-foreground">{last.bestHit ?? 0}</b>
            </span>
            <span className="px-1 py-2">
              BOSSES<br /><b className="text-[9px] text-foreground">{last.bossKills ?? 0}</b>
            </span>
          </div>
        </motion.div>
      )}

      {last?.highlight && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-3 w-full max-w-[320px] border-2 border-primary/50 bg-background/70 p-3 text-center"
        >
          <div className="text-pixel mb-1 text-[7px] text-primary">RUN HIGHLIGHT</div>
          <div className="text-[15px] leading-[17px] text-foreground/85" style={{ fontFamily: "var(--font-pixel-body)" }}>
            {last.highlight}
          </div>
          {mut && (
            <div className="text-pixel mt-2 text-[6px]" style={{ color: mut.color }}>
              UNDER {mut.name}
            </div>
          )}
        </motion.div>
      )}
      {next && (
        <div className="mb-4 w-full max-w-[320px] border-2 border-primary/25 bg-background/60 p-2 text-center">
          <div className="text-pixel mb-1 text-[6px] text-muted-foreground">NEXT UNLOCK</div>
          <div className="text-[14px] text-foreground/70" style={{ fontFamily: "var(--font-pixel-body)" }}>
            {credits >= next.cost
              ? `You can unlock ${RELICS[next.id]?.name} in the Codex right now.`
              : `${next.cost - credits} Cores from unlocking ${RELICS[next.id]?.name}.`}
          </div>
        </div>
      )}
      <ScoreSubmit />
      <div className="flex w-full max-w-[320px] flex-col gap-2">
        <PixelButton onClick={rerun} color="danger" className="cta-throb press w-full py-4 text-[12px]">
          ▶ BREACH AGAIN{hero ? ` AS ${hero.name.toUpperCase()}` : ""}
        </PixelButton>
        <PixelButton onClick={abandon} color="primary">Return to hub</PixelButton>
      </div>
    </>
  );
}

export function DeathScreen() {
  const floors = useGame((s) => s.floorsCleared);
  const best = useGame((s) => s.meta.bestFloor);
  const shy = Math.max(0, best - floors);
  return (
    <Screen title="THE BREACH CONSUMED YOU" tone="#ff3b3b" scroll>
      <motion.div
        initial={{ opacity: 0, scale: 1.4 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-pixel glitch mb-2 text-center text-[16px] text-destructive"
      >
        FLOOR {floors}
      </motion.div>
      <div className="mb-4 max-w-[300px] text-center text-[15px] leading-[17px] text-foreground/70" style={{ fontFamily: "var(--font-pixel-body)" }}>
        {shy > 0
          ? `Your best still stands at floor ${best}. ${shy} more floor${shy === 1 ? "" : "s"} next time.`
          : "The timeline snaps back. Only the Chrono Cores you banked survive the rewrite."}
      </div>
      <RunOverTail />
    </Screen>
  );
}

export function VictoryScreen() {
  const floors = useGame((s) => s.floorsCleared);
  const last = useGame((s) => s.lastRun);
  const wins = useGame((s) => s.meta.stats?.wins ?? 0);
  const hero = last ? HEROES[last.heroId] : null;
  return (
    <Screen title="BREACH SEALED" tone="#54d98c" scroll>
      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
        className="mb-3 flex w-full max-w-[320px] flex-col items-center border-4 border-[#ffcf4d] bg-[#ffcf4d]/10 px-4 py-4"
        style={{ boxShadow: "0 0 34px -8px #ffcf4d" }}
      >
        {hero && (
          <img
            src={hero.asset}
            alt={hero.name}
            width={64}
            height={64}
            decoding="async"
            className="pixelated idle-bob-slow h-16 w-16 object-contain"
            style={{ filter: "drop-shadow(0 0 16px #ffcf4d)" }}
          />
        )}
        <div className="text-pixel mt-2 text-[11px]" style={{ color: "#ffcf4d" }}>
          ALL FOUR BOSSES DOWN
        </div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-pixel mt-2 text-[14px] text-primary"
        >
          ✦ {floors} FLOORS ✦
        </motion.div>
        <div className="text-pixel mt-2 text-[7px] text-muted-foreground">
          CAREER FULL CLEARS · {wins}
        </div>
      </motion.div>
      <div className="mb-4 max-w-[300px] text-center text-[15px] leading-[17px] text-foreground/75" style={{ fontFamily: "var(--font-pixel-body)" }}>
        The fracture folds shut over King's Row. Another you wakes up and never hears a shot.
      </div>
      <RunOverTail />
    </Screen>
  );
}

function Screen({
  title,
  children,
  tone = "#ff7a45",
  scroll,
}: {
  title: string;
  children: ReactNode;
  tone?: string;
  scroll?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`scanlines relative flex h-full flex-col items-center ${
        scroll ? "overflow-y-auto py-5" : "justify-center"
      } px-4`}
      style={{
        background:
          `linear-gradient(135deg, ${tone}18 0 12%, transparent 12% 22%, ${tone}10 22% 30%, transparent 30%), #0b0a12`,
      }}
    >
      <div className="vignette pointer-events-none absolute inset-0" />
      <motion.div
        initial={{ scaleX: 0.4, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        className="text-pixel relative mb-5 px-4 py-3 text-center text-[11px] text-black"
        style={{ background: tone, border: "3px solid #07060c", boxShadow: `0 0 20px -2px ${tone}` }}
      >
        {title}
      </motion.div>
      <div className="relative flex w-full flex-col items-center">{children}</div>
    </motion.div>
  );
}

export function RelicIcon({ id }: { id: string }) {
  const relic = RELICS[id];
  if (!relic) return null;
  return (
    <div
      className="text-pixel flex h-11 w-11 items-center justify-center text-[15px]"
      style={{
        background: relic.color,
        border: "3px solid #07060c",
        boxShadow: `0 0 10px -1px ${relic.color}`,
      }}
    >
      {relic.icon}
    </div>
  );
}

export function Hud() {
  const heroId = useGame((s) => s.heroId);
  const hp = useGame((s) => s.hp);
  const maxHp = useGame((s) => s.maxHp);
  const gold = useGame((s) => s.gold);
  const floors = useGame((s) => s.floorsCleared);
  const act = useGame((s) => s.act);
  const deckCount = useGame((s) => s.deck.length);
  const abandon = useGame((s) => s.abandon);
  const contract = useGame((s) => s.contract);
  const augments = useGame((s) => s.augments);
  const hero = HEROES[heroId]!;
  return (
    <div className="relative z-30 flex items-center gap-2 border-b-[3px] border-primary/50 bg-[#0b0a12] px-2 py-1.5" title={`${contract.name}: ${contract.progress}/${contract.goal}`}>
      <img src={hero.asset} alt={hero.name} className="pixelated h-10 w-10 object-contain" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-pixel text-[8px] text-foreground">{hero.name}</span>
          <motion.span
            key={gold}
            initial={{ scale: 1.3, color: "#ffe27a" }}
            animate={{ scale: 1, color: "#ffcc4d" }}
            className="text-[14px]"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            ⬢{gold}
          </motion.span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-pixel text-[5px] text-muted-foreground">
          <span className={contract.complete ? "text-primary" : ""}>▣ {contract.name} {contract.progress}/{contract.goal}</span>
          {augments.length > 0 && <span className="text-accent">⚡{augments.length}</span>}
        </div>
        <Bar value={hp} max={maxHp} color="linear-gradient(90deg,#ff3b3b,#ffcc4d)" label={`${hp}/${maxHp}`} height={18} />
        <div className="mt-0.5 flex items-center justify-between text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
          <span>F{floors} · ACT {act + 1}/{ACT_COUNT} · 🂠{deckCount}</span>
          <RelicTray size={18} align="right" />
        </div>
      </div>
      <button
        onClick={abandon}
        className="text-pixel px-1 text-[8px] text-destructive/80 hover:text-destructive"
        aria-label="Abandon run"
      >
        ✖
      </button>
    </div>
  );
}

export function RelicChoiceScreen() {
  const choices = useGame((s) => s.startingRelicChoices);
  const choose = useGame((s) => s.chooseStartingRelic);
  return (
    <Screen title="BREACH RELIC" tone="#ffcc4d" scroll>
      <div
        className="mb-4 max-w-[300px] text-center text-[15px] leading-[17px] text-foreground/75"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        Step 1 of 2. One artifact makes it through with you. Choose it, or go in empty-handed.
      </div>
      <div className="flex w-full max-w-[440px] flex-col gap-3 pb-6">
        {choices.map((id, i) => {
          const relic = RELICS[id];
          if (!relic) return null;
          const tierColor = RELIC_TIER_COLOR[relic.tier ?? "common"] ?? "#cbd5e1";
          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => choose(id, i)}
              className={`flex items-center gap-3 bg-[#0b0a12] p-3 text-left ${
                isExaltedTier(relic.tier) ? "relic-exalted" : ""
              } ${relic.tier === "mythic" ? "relic-mythic" : ""}`}
              style={
                {
                  border: `3px solid ${tierColor}`,
                  boxShadow: `0 0 16px -6px ${relic.color ?? tierColor}`,
                  "--tier-color": tierColor,
                } as unknown as MotionStyle
              }
            >
              <RelicIcon id={id} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-pixel text-[9px]" style={{ color: relic.color }}>
                    {relic.name}
                  </span>
                  <span className="text-pixel text-[6px]" style={{ color: tierColor }}>
                    {(relic.tier ?? "common").toUpperCase()}
                  </span>
                </div>
                <div
                  className="text-[14px] leading-[15px] text-foreground/80"
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  {relic.text}
                </div>
              </div>
            </motion.button>
          );
        })}
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: choices.length * 0.08 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => choose("")}
          className="border-2 border-border bg-[#0b0a12] p-2.5 text-center"
        >
          <span className="text-pixel text-[8px] text-muted-foreground">TAKE NOTHING →</span>
        </motion.button>
      </div>
    </Screen>
  );
}

export function ProtocolChoiceScreen() {
  const protocols = useGame((s) => s.startingMutators);
  const choose = useGame((s) => s.chooseStartingMutator);
  return (
    <Screen title="BREACH PROTOCOL" tone="#e05cff" scroll>
      <div
        className="mb-4 max-w-[300px] text-center text-[15px] leading-[17px] text-foreground/75"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        Step 2 of 2. The fracture offers one distortion. It shapes the whole run, so read the fine print.
      </div>
      <div className="flex w-full max-w-[440px] flex-col gap-3 pb-6">
        {protocols.map((id, i) => {
          const proto = MUTATORS[id];
          if (!proto) return null;
          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => choose(id)}
              className="bg-[#0b0a12] p-3 text-left"
              style={{ border: `3px solid ${proto.color}`, boxShadow: `0 0 16px -6px ${proto.color}` }}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-pixel text-[9px]" style={{ color: proto.color }}>
                  {proto.name}
                </span>
                <span className="text-pixel text-[6px]" style={{ color: proto.color }}>
                  PROTOCOL
                </span>
              </div>
              <div
                className="text-[14px] leading-[15px] text-foreground/80"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                {proto.text}
              </div>
            </motion.button>
          );
        })}
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: protocols.length * 0.08 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => choose(null)}
          className="border-2 border-border bg-[#0b0a12] p-2.5 text-center"
        >
          <span className="text-pixel text-[8px] text-muted-foreground">RUN CLEAN →</span>
        </motion.button>
      </div>
    </Screen>
  );
}
