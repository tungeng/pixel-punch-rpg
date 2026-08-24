import type { CardInstance } from "@/game/types";
import { CARD_ICONS, FALLBACK_ICON } from "@/game/icons";
import {
  useGame,
  effectiveCost,
  scaledDamage,
  cardDealsDamage,
  cardSynergyActive,
} from "@/game/store";
import { motion } from "motion/react";

type Family = "attack" | "defense" | "utility" | "ultimate";

const FAMILY: Record<Family, { accent: string; deep: string; glyph: string; label: string }> = {
  attack: { accent: "#ff4f3c", deep: "#4a1008", glyph: "⚔", label: "ATTACK" },
  defense: { accent: "#3fa9ff", deep: "#052440", glyph: "🛡", label: "DEFENSE" },
  utility: { accent: "#3fd98c", deep: "#04331f", glyph: "✦", label: "UTILITY" },
  ultimate: { accent: "#c47bff", deep: "#2a0b45", glyph: "★", label: "ULTIMATE" },
};

const RARITY: Record<string, { color: string; label: string }> = {
  starter: { color: "#7b8794", label: "STARTER" },
  common: { color: "#cbd5e1", label: "COMMON" },
  uncommon: { color: "#54d98c", label: "UNCOMMON" },
  rare: { color: "#ffcc4d", label: "RARE" },
};

export function cardFamily(card: CardInstance): Family {
  if (card.type === "ultimate") return "ultimate";
  if (card.type === "attack") return "attack";
  if ((card.block ?? 0) > 0) return "defense";
  return "utility";
}

export function CardView({
  card,
  onClick,
  selected,
  dimmed,
  size = "hand",
}: {
  card: CardInstance;
  onClick?: () => void;
  selected?: boolean;
  dimmed?: boolean;
  size?: "hand" | "reward" | "shop";
}) {
  const fam = cardFamily(card);
  const t = FAMILY[fam];
  const big = size !== "hand";
  const w = big ? 132 : 96;
  const h = big ? 196 : 150;
  const icon = CARD_ICONS[card.id] ?? FALLBACK_ICON;
  const rar = RARITY[card.rarity] ?? RARITY["common"]!;

  // auto-shrink rules text so long card text never clips
  const len = (card.text ?? "").length;
  const bodySize = big
    ? len > 110
      ? 12
      : len > 80
        ? 13.5
        : 15
    : len > 110
      ? 9
      : len > 80
        ? 10
        : 11;
  const bodyLine = Math.round(bodySize * 1.05);


  // live values so scaling cards show what they'd actually do right now
  const combat = useGame((s) => s.combat);
  const live = !big && combat?.active ? combat : null;
  const shownCost = live ? effectiveCost(card, live) : card.cost;
  const discounted = shownCost < card.cost;
  const dynamicDamage =
    live && cardDealsDamage(card) && !card.randomDamage
      ? scaledDamage(card, live)
      : null;
  const scalingCard =
    !!card.damagePerCardPlayed || !!card.damagePerMissingHp || !!card.damagePerDiscard;


  const synergy = !!live && !dimmed && cardSynergyActive(card, live);

  const hover = dimmed ? undefined : { y: -14, scale: 1.06 };
  const tap = dimmed ? undefined : { scale: 0.96 };

  return (
    <motion.button
      layout
      {...(hover ? { whileHover: hover } : {})}
      {...(tap ? { whileTap: tap } : {})}
      onClick={onClick}
      disabled={dimmed}
      animate={selected ? { y: -18 } : { y: 0 }}
      className={`relative shrink-0 select-none text-left ${synergy ? "synergy-pulse" : ""}`}
      style={{
        width: w,
        height: h,
        padding: 3,
        background: `linear-gradient(180deg, ${t.accent}, ${t.deep})`,
        border: `3px solid ${synergy ? "#ffe27a" : rar.color}`,
        outline: "2px solid #07060c",
        boxShadow: dimmed
          ? "0 4px 0 0 #07060c"
          : synergy
            ? `0 4px 0 0 #07060c, 0 0 18px 2px #ffcc4d, 0 0 34px 4px ${t.accent}`
            : `0 4px 0 0 #07060c, 0 0 14px -2px ${t.accent}`,
        opacity: dimmed ? 0.42 : 1,
        filter: dimmed
          ? "saturate(0.15) brightness(0.7)"
          : synergy
            ? "saturate(1.25) brightness(1.18)"
            : "none",
      }}
    >
      {/* inner slab */}
      <div
        className="flex h-full w-full flex-col"
        style={{
          background: "linear-gradient(180deg,#171528,#0d0b16)",
          border: "2px solid #07060c",
        }}
      >
        {/* icon window */}
        <div
          className="relative overflow-hidden"
          style={{
            height: big ? 74 : 52,
            margin: 3,
            border: "2px solid #07060c",
            background: `radial-gradient(circle at 50% 55%, ${t.accent}44, #0b0a14 72%)`,
          }}
        >
          <img
            src={icon}
            alt=""
            className="pixelated absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain"
            style={{ height: big ? 62 : 44, imageRendering: "pixelated" }}
          />
          <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
        </div>

        {/* name banner */}
        <div
          className="text-pixel truncate px-1 py-[3px] text-center text-black"
          style={{
            background: t.accent,
            fontSize: big ? 7.5 : 6.5,
            margin: "0 3px",
          }}
        >
          {card.name}
          {card.upgraded ? "+" : ""}
        </div>

        {/* rules text */}
        <div
          className="flex-1 overflow-hidden px-1 pt-1 text-center leading-[13px]"
          style={{
            fontFamily: "var(--font-pixel-body)",
            fontSize: big ? 15 : 11,
            color: "#dfe3f2",
          }}
        >
          {card.text}
          {scalingCard && dynamicDamage !== null && (
            <div
              className="text-pixel mt-[2px]"
              style={{ fontSize: big ? 7 : 6, color: "#ffcc4d" }}
            >
              NOW {dynamicDamage}
            </div>
          )}
        </div>


        {/* footer */}
        <div
          className="text-pixel flex items-center justify-between px-1 py-[2px]"
          style={{ fontSize: 5.5, background: "#07060c", color: t.accent }}
        >
          <span>{t.label}</span>
          <span
            style={{
              width: 5,
              height: 5,
              background: rar.color,
              display: "inline-block",
              boxShadow: `0 0 5px ${rar.color}`,
            }}
          />
        </div>
      </div>

      {/* cost gem */}
      <div
        className="text-pixel absolute -left-2 -top-2 flex items-center justify-center"
        style={{
          width: big ? 28 : 24,
          height: big ? 28 : 24,
          fontSize: big ? 12 : 10,
          color: "#1a1200",
          background: dimmed
            ? "linear-gradient(180deg,#8f8f9c,#4c4c58)"
            : discounted
              ? "linear-gradient(180deg,#9dffc4,#22a45f)"
              : "linear-gradient(180deg,#ffe27a,#e0a021)",
          border: "3px solid #07060c",
          boxShadow: dimmed ? "none" : `0 0 10px -1px ${discounted ? "#54d98c" : "#ffcc4d"}`,
        }}
      >
        {shownCost}
      </div>


      {synergy && (
        <div
          className="text-pixel absolute -top-2 right-1 px-1 text-[5.5px] text-black"
          style={{ background: "#ffcc4d", border: "2px solid #07060c" }}
        >
          CHARGED
        </div>
      )}

      {card.exhaust && (
        <div
          className="text-pixel absolute -bottom-1 right-1 px-1 text-[5.5px] text-black"
          style={{ background: "#ff5555" }}
        >
          EXHAUST
        </div>
      )}
    </motion.button>
  );
}
