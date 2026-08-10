import { useGame, cardPrice } from "@/game/store";
import { HEROES } from "@/game/heroes";
import { RELICS } from "@/game/relics";
import { CardView } from "./CardView";
import { PixelButton } from "./PixelButton";
import { Bar } from "./Bar";
import { motion } from "motion/react";
import type { ReactNode } from "react";

export function RewardScreen() {
  const choices = useGame((s) => s.rewardChoices);
  const gold = useGame((s) => s.rewardGold);
  const pick = useGame((s) => s.pickRewardCard);
  const skip = useGame((s) => s.skipReward);
  return (
    <Screen title="TIMELINE SECURED" tone="#54d98c">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 14 }}
        className="text-pixel mb-4 text-center text-[12px] text-primary"
      >
        +{gold} ⬢
      </motion.div>
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
      <div className="mt-6 flex justify-center">
        <PixelButton onClick={skip} color="ghost">Skip</PixelButton>
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
  const upgradeable = deck.filter((c) => !c.upgraded);
  return (
    <Screen title="SAFEHOUSE" tone="#54d98c">
      <div className="mb-3 w-full max-w-[280px]">
        <Bar value={hp} max={maxHp} color="linear-gradient(90deg,#ff3b3b,#ffcc4d)" label={`${hp}/${maxHp}`} height={14} />
      </div>
      <div className="mb-4 text-center text-[15px] text-foreground/75" style={{ fontFamily: "var(--font-pixel-body)" }}>
        The rift hums quietly here. Patch up, or sharpen a card.
      </div>
      <PixelButton onClick={heal} color="primary">Rest — heal 30%</PixelButton>
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
    </Screen>
  );
}

export function TreasureScreen() {
  const take = useGame((s) => s.takeTreasure);
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
        A sealed relic pod, humming out of sync with time.
      </div>
      <PixelButton onClick={take} color="primary">Crack it open</PixelButton>
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

      <div className="text-pixel mt-5 text-center text-[8px] text-muted-foreground">RELICS — 150⬢</div>
      <div className="mt-2 flex justify-center gap-4">
        {shopRelics.map((r, i) =>
          r ? (
            <motion.button
              key={i}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -4 }}
              onClick={() => buyRelic(i)}
              disabled={gold < 150}
              className="flex w-20 flex-col items-center gap-1 disabled:opacity-40"
            >
              <RelicIcon id={r} />
              <span className="text-center text-[12px] leading-[13px] text-foreground/80" style={{ fontFamily: "var(--font-pixel-body)" }}>
                {RELICS[r]?.name}
              </span>
            </motion.button>
          ) : null,
        )}
      </div>

      <div className="text-pixel mt-5 text-center text-[8px] text-muted-foreground">
        PURGE A CARD — 75⬢ {deck.length <= 5 ? "(deck too small)" : ""}
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
        The timeline snaps back and swallows the version of you that fell here.
        The Chrono Cores you banked survive the reset.
      </div>
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
        The fracture folds shut. King's Row exhales. Somewhere down the line,
        another you never had to fight at all.
      </div>
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
          `radial-gradient(ellipse at 50% 0%, ${tone}22, transparent 60%), #0b0a12`,
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
      title={relic.name}
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
  const relics = useGame((s) => s.relics);
  const deckCount = useGame((s) => s.deck.length);
  const abandon = useGame((s) => s.abandon);
  const hero = HEROES[heroId]!;
  return (
    <div className="relative z-30 flex items-center gap-2 border-b-[3px] border-primary/50 bg-[#0b0a12] px-2 py-1.5">
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
        <Bar value={hp} max={maxHp} color="linear-gradient(90deg,#ff3b3b,#ffcc4d)" label={`${hp}/${maxHp}`} height={12} />
        <div className="mt-0.5 flex items-center justify-between text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
          <span>F{floors} · ACT {act + 1} · 🂠{deckCount}</span>
          <div className="flex items-center gap-1">
            {relics.slice(0, 6).map((r) => (
              <div key={r} className="origin-center scale-[0.55]" style={{ width: 24, height: 24 }}>
                <RelicIcon id={r} />
              </div>
            ))}
          </div>
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
