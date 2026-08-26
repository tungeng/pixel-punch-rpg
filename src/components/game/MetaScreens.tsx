import { ACT_COUNT } from "@/game/enemies";
import { useGame, cardPrice, relicPrice } from "@/game/store";
import { HEROES } from "@/game/heroes";
import { RELICS, RELIC_TIER_COLOR, isExaltedTier } from "@/game/relics";
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
          transition={{ type: "spring", stiffness: 240, damping: 13 }}
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
            <div className="text-pixel text-[7px] text-primary">RELIC SALVAGED</div>
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
  const relics = useGame((s) => s.relics.length);
  const deck = useGame((s) => s.deck);
  const contract = useGame((s) => s.contractsCompleted);
  const upgraded = deck.filter((card) => card.upgraded).length;
  return (
    <Screen title="HERO EVOLUTION" tone="#ff7a45" scroll>
      <div className="mb-5 text-center text-[15px] text-foreground/75" style={{ fontFamily: "var(--font-pixel-body)" }}>
        The last boss left a combat protocol exposed. Install one.
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
              key={id}
              initial={{ x: i % 2 ? 40 : -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => choose(id)}
              className="flex items-center gap-3 border-2 border-primary/70 bg-card p-3 text-left hover:border-primary"
            >
              <span className="text-pixel flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-[15px] text-primary-foreground">{augment.icon}</span>
              <span>
                <span className="text-pixel block text-[9px] text-primary">{augment.name}</span>
                <span className="mt-1 block text-[14px] leading-[16px] text-foreground/80" style={{ fontFamily: "var(--font-pixel-body)" }}>{augment.text}</span>
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

export function DeathScreen() {
  const floors = useGame((s) => s.floorsCleared);
  const abandon = useGame((s) => s.abandon);
  return (
    <Screen title="THE BREACH CONSUMED YOU" tone="#ff3b3b">
      <motion.div
        initial={{ opacity: 0, scale: 1.4 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-pixel glitch mb-3 text-center text-[16px] text-destructive"
      >
        FLOOR {floors}
      </motion.div>
      <div className="mb-6 max-w-[300px] text-center text-[15px] leading-[17px] text-foreground/70" style={{ fontFamily: "var(--font-pixel-body)" }}>
        The timeline snaps back. The version of you that fell here is edited out.
        Only the Chrono Cores you banked survive the rewrite.
      </div>
      <ScoreSubmit />
      <PixelButton onClick={abandon} color="primary">Return to hub</PixelButton>
    </Screen>
  );
}

export function VictoryScreen() {
  const floors = useGame((s) => s.floorsCleared);
  const abandon = useGame((s) => s.abandon);
  return (
    <Screen title="BREACH SEALED" tone="#54d98c">
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="text-pixel mb-3 text-center text-[14px] text-primary"
      >
        ✦ {floors} FLOORS ✦
      </motion.div>
      <div className="mb-6 max-w-[300px] text-center text-[15px] leading-[17px] text-foreground/75" style={{ fontFamily: "var(--font-pixel-body)" }}>
        The fracture folds shut over King's Row. Somewhere down the line, another
        you wakes up and never hears a single shot.
      </div>
      <ScoreSubmit />
      <PixelButton onClick={abandon} color="primary">Return to hub</PixelButton>
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
        <Bar value={hp} max={maxHp} color="linear-gradient(90deg,#ff3b3b,#ffcc4d)" label={`${hp}/${maxHp}`} height={12} />
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
    <Screen title="CHOOSE YOUR RELIC" tone="#ffcc4d" scroll>
      <div
        className="mb-4 max-w-[300px] text-center text-[15px] leading-[17px] text-foreground/75"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        One artifact makes it through the breach intact. Pick the one you'll miss least without.
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
              onClick={() => choose(id)}
              className={`flex items-center gap-3 bg-[#0b0a12] p-3 text-left ${
                isExaltedTier(relic.tier) ? "relic-exalted" : ""
              } ${relic.tier === "mythic" ? "relic-mythic" : ""}`}
              style={
                {
                  border: `3px solid ${tierColor}`,
                  boxShadow: `0 0 16px -6px ${relic.color}`,
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
      </div>
    </Screen>
  );
}
