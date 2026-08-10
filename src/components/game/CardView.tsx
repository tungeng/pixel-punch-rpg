import type { CardInstance } from "@/game/types";
import { motion } from "motion/react";

const TYPE_COLOR: Record<string, string> = {
  attack: "#e85d3a",
  skill: "#3b82f6",
  ultimate: "#a855f7",
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
  const accent = TYPE_COLOR[card.type] ?? "#888";
  const heroColor = card.hero;
  const w = size === "hand" ? 96 : 120;
  const h = size === "hand" ? 132 : 162;
  const hover = dimmed ? undefined : { y: -8, scale: 1.04 };
  const tap = dimmed ? undefined : { scale: 0.97 };
  return (
    <motion.button
      layout
      {...(hover ? { whileHover: hover } : {})}
      {...(tap ? { whileTap: tap } : {})}
      onClick={onClick}
      disabled={dimmed}
      animate={selected ? { y: -16 } : { y: 0 }}
      className="relative flex-col items-center text-left pix-border shrink-0"
      style={{
        width: w,
        height: h,
        background: `linear-gradient(160deg, oklch(0.16 0.03 265), oklch(0.22 0.02 265))`,
        boxShadow: `0 0 0 3px ${accent}, 0 4px 0 0 oklch(0.1 0.02 265)`,
        opacity: dimmed ? 0.45 : 1,
      }}
    >
      <div className="flex items-center gap-1 px-1 pt-1">
        <span
          className="text-pixel flex h-5 w-5 items-center justify-center rounded-[2px] text-[9px] text-black"
          style={{ background: "#fcd34d" }}
        >
          {card.cost}
        </span>
        <span className="text-pixel text-[7px] uppercase text-foreground/70">{card.type}</span>
      </div>
      <div className="px-1.5 text-center">
        <div className="text-pixel text-[7.5px] leading-tight" style={{ color: heroColor ? accent : "#fff" }}>
          {card.name}
        </div>
      </div>
      <div className="mx-1.5 my-1 h-px" style={{ background: `${accent}55` }} />
      <div
        className="flex-1 overflow-hidden px-1.5 text-[13px] leading-[15px] text-foreground/90"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        {card.text}
      </div>
      {card.upgraded && (
        <div className="absolute right-1 top-1 text-pixel text-[7px] text-primary">+</div>
      )}
    </motion.button>
  );
}
