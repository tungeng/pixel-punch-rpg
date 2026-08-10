import type { CardInstance } from "@/game/types";
import { HEROES } from "@/game/heroes";
import { motion } from "motion/react";

const TYPE: Record<
  string,
  { accent: string; deep: string; glyph: string; label: string }
> = {
  attack: { accent: "#ff7a45", deep: "#4a1508", glyph: "⚔", label: "ATTACK" },
  skill: { accent: "#54a8ff", deep: "#07223f", glyph: "✦", label: "SKILL" },
  ultimate: { accent: "#c47bff", deep: "#2a0b45", glyph: "★", label: "ULTIMATE" },
};

const RARITY_PIP: Record<string, string> = {
  starter: "#7b8794",
  common: "#cbd5e1",
  uncommon: "#54d98c",
  rare: "#ffcc4d",
};

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
  const t = TYPE[card.type] ?? TYPE["skill"]!;
  const big = size !== "hand";
  const w = big ? 132 : 96;
  const h = big ? 186 : 138;
  const art = card.hero ? HEROES[card.hero]?.asset : undefined;
  const pip = RARITY_PIP[card.rarity] ?? "#7b8794";

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
      className="relative shrink-0 select-none text-left"
      style={{
        width: w,
        height: h,
        padding: 3,
        background: `linear-gradient(180deg, ${t.accent}, ${t.deep})`,
        border: "3px solid #07060c",
        boxShadow: dimmed
          ? "0 4px 0 0 #07060c"
          : `0 4px 0 0 #07060c, 0 0 14px -2px ${t.accent}`,
        opacity: dimmed ? 0.5 : 1,
        filter: dimmed ? "saturate(0.35)" : "none",
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
        {/* art window */}
        <div
          className="relative overflow-hidden"
          style={{
            height: big ? 74 : 52,
            margin: 3,
            border: "2px solid #07060c",
            background: `radial-gradient(circle at 50% 85%, ${t.accent}55, #0b0a14 70%)`,
          }}
        >
          {art ? (
            <img
              src={art}
              alt=""
              className="pixelated absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain"
              style={{ height: big ? 84 : 68, imageRendering: "pixelated" }}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[22px]"
              style={{ color: t.accent }}
            >
              {t.glyph}
            </div>
          )}
          {/* scan overlay */}
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
        </div>

        {/* footer */}
        <div
          className="text-pixel flex items-center justify-between px-1 py-[2px]"
          style={{ fontSize: 5.5, background: "#07060c", color: t.accent }}
        >
          <span>{t.label}</span>
          <span style={{ width: 5, height: 5, background: pip, display: "inline-block" }} />
        </div>
      </div>

      {/* cost gem */}
      <div
        className="text-pixel absolute -left-2 -top-2 flex items-center justify-center"
        style={{
          width: big ? 26 : 22,
          height: big ? 26 : 22,
          fontSize: big ? 11 : 9,
          color: "#1a1200",
          background: "linear-gradient(180deg,#ffe27a,#e0a021)",
          border: "3px solid #07060c",
          boxShadow: "0 0 8px -1px #ffcc4d",
        }}
      >
        {card.cost}
      </div>

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
