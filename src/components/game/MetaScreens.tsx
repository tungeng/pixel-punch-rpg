import { useGame } from "@/game/store";
import { HEROES } from "@/game/heroes";
import { RELICS } from "@/game/relics";
import { CardView } from "./CardView";
import { PixelButton } from "./PixelButton";
import { Bar } from "./Bar";
import { motion } from "motion/react";

export function RewardScreen() {
  const choices = useGame((s) => s.rewardChoices);
  const gold = useGame((s) => s.rewardGold);
  const pick = useGame((s) => s.pickRewardCard);
  const skip = useGame((s) => s.skipReward);
  return (
    <Screen title="VICTORY">
      <div className="mb-4 text-center text-[18px] text-primary" style={{ fontFamily: "var(--font-pixel-body)" }}>
        +{gold} gold earned. Choose a card to add:
      </div>
      <div className="flex justify-center gap-3">
        {choices.map((c) => (
          <CardView key={c.uid} card={c} size="reward" onClick={() => pick(c.id)} />
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
    <Screen title="REST SITE">
      <div className="mb-4 text-center text-[16px] text-foreground/80" style={{ fontFamily: "var(--font-pixel-body)" }}>
        HP {hp}/{maxHp} — Heal 30% or upgrade a card.
      </div>
      <div className="mb-4 flex justify-center gap-3">
        <PixelButton onClick={heal} color="primary">Rest (heal)</PixelButton>
      </div>
      <div className="text-pixel mb-2 text-center text-[8px] text-muted-foreground">UPGRADE A CARD:</div>
      <div className="flex max-h-64 flex-wrap justify-center gap-2 overflow-y-auto px-2">
        {upgradeable.map((c) => (
          <CardView key={c.uid} card={c} size="reward" onClick={() => upgrade(c.uid)} />
        ))}
        {upgradeable.length === 0 && (
          <div className="text-[14px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
            No upgradeable cards.
          </div>
        )}
      </div>
    </Screen>
  );
}

export function TreasureScreen() {
  const take = useGame((s) => s.takeTreasure);
  return (
    <Screen title="TREASURE">
      <div className="mb-6 text-center text-[18px] text-primary" style={{ fontFamily: "var(--font-pixel-body)" }}>
        A relic awaits. Claim it?
      </div>
      <div className="flex justify-center">
        <PixelButton onClick={take} color="primary">Claim relic</PixelButton>
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
  const cost = (c: any) => (c.cost === 999 ? "SOLD" : (c.rarity === "rare" ? 90 : c.rarity === "uncommon" ? 60 : 40) + (c.upgraded ? 20 : 0));
  return (
    <Screen title="SHOP">
      <div className="mb-3 text-center text-[16px] text-primary" style={{ fontFamily: "var(--font-pixel-body)" }}>
        Gold: {gold}
      </div>
      <div className="flex flex-wrap justify-center gap-2 px-2">
        {shopCards.map((c, i) => (
          <div key={c.uid} className="flex flex-col items-center gap-1">
            <CardView card={c} size="shop" onClick={() => buyCard(i)} dimmed={gold < (typeof cost(c) === "number" ? (cost(c) as number) : 999)} />
            <span className="text-pixel text-[7px] text-primary">{cost(c)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-pixel text-center text-[8px] text-muted-foreground">RELICS — 150g</div>
      <div className="mt-1 flex justify-center gap-3">
        {shopRelics.map((r, i) =>
          r ? (
            <button key={i} onClick={() => buyRelic(i)} disabled={gold < 150} className="flex flex-col items-center gap-1 disabled:opacity-40">
              <RelicIcon id={r} />
              <span className="text-[12px] text-foreground/80" style={{ fontFamily: "var(--font-pixel-body)" }}>{RELICS[r]?.name}</span>
            </button>
          ) : null,
        )}
      </div>
      <div className="mt-4 text-pixel text-center text-[8px] text-muted-foreground">REMOVE CARD — 75g</div>
      <div className="mt-1 flex max-h-32 flex-wrap justify-center gap-1 overflow-y-auto px-2">
        {deck.map((c) => (
          <CardView key={c.uid} card={c} size="hand" onClick={() => buyRemove(c.uid)} dimmed={gold < 75} />
        ))}
      </div>
      <div className="mt-4 flex justify-center">
        <PixelButton onClick={leave} color="ghost">Leave</PixelButton>
      </div>
    </Screen>
  );
}

export function DeathScreen() {
  const floors = useGame((s) => s.floorsCleared);
  const abandon = useGame((s) => s.abandon);
  return (
    <Screen title="THE BREACH CONSUMED YOU">
      <div className="mb-2 text-center text-[20px] text-destructive" style={{ fontFamily: "var(--font-pixel-body)" }}>
        You fell on floor {floors}.
      </div>
      <div className="mb-6 text-center text-[14px] text-foreground/70" style={{ fontFamily: "var(--font-pixel-body)" }}>
        The timeline snaps back. Your Chrono Cores persist.
      </div>
      <div className="flex justify-center">
        <PixelButton onClick={abandon} color="primary">Return to hub</PixelButton>
      </div>
    </Screen>
  );
}

export function VictoryScreen() {
  const floors = useGame((s) => s.floorsCleared);
  const abandon = useGame((s) => s.abandon);
  return (
    <Screen title="BREACH SEALED">
      <div className="mb-2 text-center text-[20px] text-primary" style={{ fontFamily: "var(--font-pixel-body)" }}>
        You shattered the chrono-fracture and closed the breach.
      </div>
      <div className="mb-6 text-center text-[14px] text-foreground/70" style={{ fontFamily: "var(--font-pixel-body)" }}>
        Floors cleared: {floors}. The city breathes again.
      </div>
      <div className="flex justify-center">
        <PixelButton onClick={abandon} color="primary">Return to hub</PixelButton>
      </div>
    </Screen>
  );
}

function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="scanlines flex h-full flex-col items-center justify-center bg-black/70 px-4"
    >
      <div className="text-pixel mb-5 text-center text-[14px] text-primary pix-border bg-card px-4 py-3">
        {title}
      </div>
      {children}
    </motion.div>
  );
}

export function RelicIcon({ id }: { id: string }) {
  const relic = RELICS[id];
  if (!relic) return null;
  return (
    <div
      className="text-pixel pix-border flex h-12 w-12 items-center justify-center text-[16px]"
      style={{ background: relic.color }}
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
    <div className="flex items-center gap-2 border-b-2 border-primary/40 bg-card/80 px-2 py-1.5">
      <img src={hero.asset} alt={hero.name} className="pixelated h-9 w-9 object-contain" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-pixel text-[8px] text-foreground">{hero.name}</span>
          <span className="text-[13px] text-primary" style={{ fontFamily: "var(--font-pixel-body)" }}>⬢{gold}</span>
        </div>
        <Bar value={hp} max={maxHp} color="linear-gradient(90deg,#e85d3a,#f59e0b)" label={`${hp}/${maxHp}`} height={12} />
        <div className="mt-0.5 flex items-center justify-between text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
          <span>F{floors} · ACT {act + 1} · 🂠{deckCount}</span>
          <div className="flex gap-0.5">
            {relics.slice(0, 6).map((r) => (
              <div key={r} className="scale-75 origin-center">
                <RelicIcon id={r} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <button onClick={abandon} className="text-pixel text-[7px] text-destructive/80">✖</button>
    </div>
  );
}
