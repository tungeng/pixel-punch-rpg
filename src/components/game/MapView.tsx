import { useGame } from "@/game/store";
import { getStarts } from "@/game/mapgen";
import type { MapNode } from "@/game/types";
import { motion } from "motion/react";

const NODE_GLYPH: Record<string, string> = {
  combat: "⚔",
  elite: "★",
  rest: "♥",
  shop: "$",
  treasure: "?",
  boss: "☠",
};
const NODE_COLOR: Record<string, string> = {
  combat: "#e85d3a",
  elite: "#a855f7",
  rest: "#22c55e",
  shop: "#fcd34d",
  treasure: "#38bdf8",
  boss: "#ef4444",
};

export function MapView() {
  const map = useGame((s) => s.map);
  const currentId = useGame((s) => s.currentNodeId);
  const enterNode = useGame((s) => s.enterNode);
  const act = useGame((s) => s.act);

  const current = map.find((n) => n.id === currentId) ?? null;
  const reachable = new Set<number>();
  if (!current) getStarts(map).forEach((n) => reachable.add(n.id));
  else current.next.forEach((id) => reachable.add(id));

  // connectors
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const n of map) {
    for (const nx of n.next) {
      const t = map.find((m) => m.id === nx);
      if (t) lines.push({ x1: n.x, y1: n.y, x2: t.x, y2: t.y });
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="text-pixel px-4 pt-3 text-[10px] text-primary">
        ACT {act + 1} — BREACH NAV
      </div>
      <div className="relative mx-auto my-2 w-full flex-1 overflow-hidden px-2">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none">
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="oklch(0.55 0.18 35)"
              strokeWidth={0.012}
              strokeLinecap="round"
            />
          ))}
        </svg>
        {map.map((n) => (
          <NodeButton
            key={n.id}
            node={n}
            canEnter={reachable.has(n.id)}
            isCurrent={n.id === currentId}
            onEnter={() => enterNode(n.id)}
          />
        ))}
      </div>
      <div className="px-4 pb-3 text-center text-[14px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel-body)" }}>
        Tap a glowing node to advance. ☠ = boss breach.
      </div>
    </div>
  );
}

function NodeButton({
  node,
  canEnter,
  isCurrent,
  onEnter,
}: {
  node: MapNode;
  canEnter: boolean;
  isCurrent: boolean;
  onEnter: () => void;
}) {
  const color = NODE_COLOR[node.type] ?? "#888";
  return (
    <motion.button
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      onClick={canEnter ? onEnter : undefined}
      disabled={!canEnter}
      className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center pix-border disabled:opacity-40"
      style={{
        left: `${10 + node.y * 80}%`,
        top: `${6 + node.x * 86}%`,
        background: node.visited ? "oklch(0.2 0.02 265)" : `linear-gradient(160deg, ${color}, oklch(0.16 0.03 265))`,
        boxShadow: canEnter
          ? `0 0 0 3px ${color}, 0 0 12px 2px ${color}aa`
          : `0 0 0 2px ${color}66`,
      }}
    >
      <span className="text-pixel text-[14px] text-black">{NODE_GLYPH[node.type]}</span>
      {isCurrent && (
        <span className="absolute -bottom-3 text-pixel text-[7px] text-primary">YOU</span>
      )}
    </motion.button>
  );
}
