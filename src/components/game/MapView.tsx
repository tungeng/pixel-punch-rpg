import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { getStarts } from "@/game/mapgen";
import type { MapNode } from "@/game/types";
import { motion } from "motion/react";

const NODE: Record<string, { glyph: string; color: string; label: string }> = {
  combat: { glyph: "⚔", color: "#ff7a45", label: "FIGHT" },
  elite: { glyph: "☠", color: "#c47bff", label: "ELITE" },
  rest: { glyph: "+", color: "#54d98c", label: "REST" },
  shop: { glyph: "$", color: "#ffcc4d", label: "SHOP" },
  treasure: { glyph: "?", color: "#54a8ff", label: "CACHE" },
  boss: { glyph: "☠", color: "#ff3b3b", label: "BOSS" },
};

const ROW_GAP = 92;
const PAD_TOP = 46;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const STARS = (() => {
  const rnd = seededRandom(12345);
  return Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: rnd() * 100,
    top: rnd() * 100,
    size: rnd() < 0.25 ? 2 : 1,
    layer: rnd() < 0.33 ? 0 : rnd() < 0.5 ? 1 : 2,
  }));
})();

export function MapView() {
  const map = useGame((s) => s.map);
  const currentId = useGame((s) => s.currentNodeId);
  const enterNode = useGame((s) => s.enterNode);
  const act = useGame((s) => s.act);
  const scroller = useRef<HTMLDivElement>(null);

  const maxCol = map.reduce((m, n) => Math.max(m, n.col), 0);
  const totalH = PAD_TOP * 2 + maxCol * ROW_GAP;

  const current = map.find((n) => n.id === currentId) ?? null;
  const reachable = new Set<number>();
  if (!current) getStarts(map).forEach((n) => reachable.add(n.id));
  else current.next.forEach((id) => reachable.add(id));

  // Single source of truth for placement — SVG + buttons both use it.
  const posOf = (n: MapNode) => ({
    leftPct: 14 + n.y * 72,
    topPx: PAD_TOP + (maxCol - n.col) * ROW_GAP,
  });

  const byId = new Map(map.map((n) => [n.id, n]));
  const lines = map.flatMap((n) =>
    n.next
      .map((id) => byId.get(id))
      .filter((t): t is MapNode => !!t)
      .map((t) => {
        const a = posOf(n);
        const b = posOf(t);
        const live = currentId === n.id && reachable.has(t.id);
        return { a, b, live, key: `${n.id}-${t.id}` };
      }),
  );

  // Scroll so the player's position sits in view.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const target = current ? posOf(current).topPx : totalH;
    el.scrollTo({ top: Math.max(0, target - el.clientHeight * 0.6), behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, map]);

  return (
    <div className="relative flex h-full flex-col">
      <div className="relative z-20 border-b-2 border-primary/30 bg-background/90 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-pixel text-[9px] text-primary">ACT {act + 1} · BREACH NAV</span>
          <span
            className="text-[13px] text-muted-foreground"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            {map.filter((n) => n.visited).length}/{map.length} nodes
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {Object.entries(NODE).map(([k, v]) => (
            <span
              key={k}
              className="text-[12px]"
              style={{ fontFamily: "var(--font-pixel-body)", color: v.color }}
            >
              {v.glyph} {v.label}
            </span>
          ))}
        </div>
      </div>

      <div ref={scroller} className="relative flex-1 overflow-y-auto">
        <div className="relative w-full" style={{ height: totalH }}>
          <Starfield />

          <div
            className="rift-bg pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse at 0% 0%, rgba(196,123,255,0.22), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(255,122,69,0.20), transparent 55%)",
            }}
          />

          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(196,123,255,0.16), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(255,122,69,0.14), transparent 55%)",
            }}
          />
          <div className="scanlines pointer-events-none absolute inset-0 opacity-60" />

          <svg
            className="absolute inset-0 h-full w-full"
            style={{ pointerEvents: "none" }}
          >
            {lines.map((l) => (
              <line
                key={l.key}
                x1={`${l.a.leftPct}%`}
                y1={l.a.topPx}
                x2={`${l.b.leftPct}%`}
                y2={l.b.topPx}
                stroke={l.live ? "#ffcc4d" : "rgba(180,190,220,0.28)"}
                strokeWidth={l.live ? 3 : 2}
                strokeDasharray="6 6"
                strokeLinecap="round"
                className={l.live ? "map-dash" : undefined}
              />
            ))}
          </svg>

          {map.map((n, i) => (
            <NodeButton
              key={n.id}
              node={n}
              index={i}
              pos={posOf(n)}
              canEnter={reachable.has(n.id)}
              isCurrent={n.id === currentId}
              onEnter={() => enterNode(n.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[0, 1, 2].map((layer) => (
        <motion.div
          key={layer}
          className="absolute inset-0"
          animate={{ x: layer % 2 === 0 ? ["-4%", "4%"] : ["4%", "-4%"] }}
          transition={{
            duration: 28 + layer * 14,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        >
          {STARS.filter((s) => s.layer === layer).map((s) => (
            <span
              key={s.id}
              className="absolute bg-foreground"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                opacity: layer === 0 ? 0.85 : layer === 1 ? 0.55 : 0.3,
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

function NodeButton({
  node,
  index,
  pos,
  canEnter,
  isCurrent,
  onEnter,
}: {
  node: MapNode;
  index: number;
  pos: { leftPct: number; topPx: number };
  canEnter: boolean;
  isCurrent: boolean;
  onEnter: () => void;
}) {
  const cfg = NODE[node.type] ?? NODE["combat"]!;
  const size = node.type === "boss" ? 62 : 46;
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), type: "spring", stiffness: 260, damping: 16 }}
      whileTap={canEnter ? { scale: 0.9 } : {}}
      whileHover={canEnter ? { scale: 1.12 } : {}}
      onClick={canEnter ? onEnter : undefined}
      disabled={!canEnter}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${pos.leftPct}%`, top: pos.topPx }}
    >
      <div
        className={`flex items-center justify-center ${canEnter ? "node-pulse" : ""}`}
        style={{
          width: size,
          height: size,
          border: "3px solid #07060c",
          background: node.visited
            ? "linear-gradient(180deg,#2a2836,#15131f)"
            : `linear-gradient(180deg, ${cfg.color}, #15131f)`,
          boxShadow: canEnter
            ? `0 0 0 3px ${cfg.color}, 0 0 18px 2px ${cfg.color}`
            : `0 0 0 2px ${cfg.color}55`,
          opacity: canEnter || isCurrent ? 1 : node.visited ? 0.75 : 0.4,
          filter: canEnter || isCurrent ? "none" : "saturate(0.5)",
        }}
      >
        <span
          className="text-pixel"
          style={{ fontSize: node.type === "boss" ? 20 : 14, color: "#07060c" }}
        >
          {node.visited ? "✓" : cfg.glyph}
        </span>
      </div>
      <span
        className="text-pixel mt-1 whitespace-nowrap text-[6px]"
        style={{ color: canEnter ? cfg.color : "rgba(200,205,225,0.45)" }}
      >
        {cfg.label}
      </span>
      {isCurrent && (
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="text-pixel absolute -top-6 text-[8px] text-primary"
        >
          ▼YOU
        </motion.span>
      )}
    </motion.button>
  );
}
