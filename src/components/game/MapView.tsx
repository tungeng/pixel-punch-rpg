import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { getStarts } from "@/game/mapgen";
import { BOSSES, ACT_BOSSES } from "@/game/enemies";
import type { MapNode } from "@/game/types";
import { AnimatePresence, motion } from "motion/react";

type NodeMeta = {
  glyph: string;
  color: string;
  label: string;
  title: string;
  blurb: string;
  risk: string;
  reward: string;
};

const NODE: Record<string, NodeMeta> = {
  combat: {
    glyph: "F",
    color: "#ff7a45",
    label: "FIGHT",
    title: "HOSTILE ZONE",
    blurb: "A standard skirmish. Enemies scale with how deep you are in the act.",
    risk: "Low. One or two attackers.",
    reward: "Gold, a card pick, contract progress.",
  },
  elite: {
    glyph: "E",
    color: "#c47bff",
    label: "ELITE",
    title: "ELITE PATROL",
    blurb: "Heavier units with traits like Aegis or Rampage. They hit through sloppy turns.",
    risk: "High. Expect to spend health.",
    reward: "Guaranteed relic, double gold, a stronger card pick.",
  },
  rest: {
    glyph: "+",
    color: "#54d98c",
    label: "REST",
    title: "SAFEHOUSE",
    blurb: "A quiet pocket in the fracture. Patch up or sharpen the deck.",
    risk: "None, but you burn a floor.",
    reward: "Heal, or permanently upgrade a card.",
  },
  shop: {
    glyph: "$",
    color: "#ffcc4d",
    label: "SHOP",
    title: "BLACK MARKET",
    blurb: "Cards, relics and a removal service. Gold only, no credit.",
    risk: "None. Costs gold.",
    reward: "Buy cards and relics, pay to delete a card.",
  },
  treasure: {
    glyph: "C",
    color: "#54a8ff",
    label: "CACHE",
    title: "SEALED CACHE",
    blurb: "A sealed drop from a collapsed timeline. Crack it safe or force it open.",
    risk: "Only if you force the lock.",
    reward: "Gold, a relic, or a gamble for more.",
  },
  boss: {
    glyph: "B",
    color: "#ff3b3b",
    label: "BOSS",
    title: "ACT BOSS",
    blurb: "The anchor holding this act together. Beating it opens the next act.",
    risk: "Extreme. Bring a plan and health.",
    reward: "Hero augment, max HP, and the next act.",
  },
};

const ROW_GAP = 96;
const PAD_TOP = 54;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const STARS = (() => {
  const rnd = seededRandom(12345);
  return Array.from({ length: 70 }, (_, i) => ({
    id: i,
    left: rnd() * 100,
    top: rnd() * 100,
    size: rnd() < 0.22 ? 2 : 1,
    layer: rnd() < 0.33 ? 0 : rnd() < 0.5 ? 1 : 2,
  }));
})();

export function MapView() {
  const map = useGame((s) => s.map);
  const currentId = useGame((s) => s.currentNodeId);
  const enterNode = useGame((s) => s.enterNode);
  const act = useGame((s) => s.act);
  const contract = useGame((s) => s.contract);
  const augments = useGame((s) => s.augments.length);
  const scroller = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const maxCol = map.reduce((m, n) => Math.max(m, n.col), 0);
  const totalH = PAD_TOP * 2 + maxCol * ROW_GAP;

  const current = map.find((n) => n.id === currentId) ?? null;
  const reachable = useMemo(() => {
    const r = new Set<number>();
    if (!current) getStarts(map).forEach((n) => r.add(n.id));
    else current.next.forEach((id) => r.add(id));
    return r;
  }, [current, map]);

  // Reset the inspector whenever the player actually moves.
  useEffect(() => setSelected(null), [currentId]);

  const posOf = (n: MapNode) => ({
    leftPct: 15 + n.y * 70,
    topPx: PAD_TOP + (maxCol - n.col) * ROW_GAP,
  });

  const byId = useMemo(() => new Map(map.map((n) => [n.id, n])), [map]);

  // Everything downstream of the inspected node, so a branch reads as a route.
  const preview = useMemo(() => {
    if (selected == null) return new Set<number>();
    // Only two floors ahead. Full-depth preview lights up the whole map and reads as noise.
    const seen = new Set<number>([selected]);
    let frontier = [selected];
    for (let depth = 0; depth < 2; depth++) {
      const nextFrontier: number[] = [];
      for (const id of frontier) {
        byId.get(id)?.next.forEach((t) => {
          if (!seen.has(t)) {
            seen.add(t);
            nextFrontier.push(t);
          }
        });
      }
      frontier = nextFrontier;
    }
    return seen;
  }, [selected, byId]);

  const lines = map.flatMap((n) =>
    n.next
      .map((id) => byId.get(id))
      .filter((t): t is MapNode => !!t)
      .map((t) => {
        const a = posOf(n);
        const b = posOf(t);
        const live = currentId === n.id && reachable.has(t.id);
        const onPreview = preview.has(n.id) && preview.has(t.id);
        const walked = n.visited && t.visited;
        return { a, b, live, onPreview, walked, key: `${n.id}-${t.id}` };
      }),
  );

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const target = current ? posOf(current).topPx : totalH;
    el.scrollTo({ top: Math.max(0, target - el.clientHeight * 0.62), behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, map]);

  const bossDef = BOSSES[ACT_BOSSES[act] ?? ""] ?? null;
  const floorsDone = map.filter((n) => n.visited).length;
  const selectedNode = selected != null ? byId.get(selected) : null;
  const meta = selectedNode ? (NODE[selectedNode.type] ?? NODE["combat"]!) : null;

  const onNode = (n: MapNode) => {
    if (!reachable.has(n.id)) return;
    if (selected === n.id) enterNode(n.id);
    else setSelected(n.id);
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* Command bar */}
      <div className="relative z-20 border-b-2 border-primary/30 bg-background/95 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-pixel text-[9px] text-primary">ACT {act + 1}</span>
          <span className="h-3 w-px bg-primary/30" />
          <span
            className="text-[13px] text-muted-foreground"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            FLOOR {Math.min(floorsDone + 1, maxCol + 1)}/{maxCol + 1}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-pixel border-2 border-accent/45 px-1.5 py-0.5 text-[8px] text-accent">
              ⚡{augments}
            </span>
            <button
              onClick={() => setShowLegend((v) => !v)}
              className="text-pixel border-2 border-primary/40 px-1.5 py-0.5 text-[8px] text-primary"
            >
              {showLegend ? "×" : "?"}
            </button>
          </div>
        </div>

        {/* Progress ladder */}
        <div className="mt-1.5 flex h-1.5 gap-[2px]">
          {Array.from({ length: maxCol + 1 }, (_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                background:
                  i < floorsDone
                    ? "var(--primary)"
                    : i === floorsDone
                      ? "color-mix(in oklab, var(--primary) 55%, transparent)"
                      : "color-mix(in oklab, var(--foreground) 12%, transparent)",
              }}
            />
          ))}
        </div>

        <div className="mt-1.5 flex items-center gap-2 border-t-2 border-primary/15 pt-1.5">
          <div className="min-w-0 flex-1">
            <div className="text-pixel truncate text-[7px] text-primary">
              ▣ {contract.name} {contract.progress}/{contract.goal}
            </div>
            <div
              className="truncate text-[12px] text-muted-foreground"
              style={{ fontFamily: "var(--font-pixel-body)" }}
            >
              {contract.text}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showLegend && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 grid grid-cols-3 gap-x-2 gap-y-1 border-t-2 border-primary/15 pt-1.5">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={scroller} className="relative flex-1 overflow-y-auto">
        <div className="relative w-full" style={{ height: totalH }}>
          <Starfield />
          <div className="rift-bg pointer-events-none absolute inset-0 opacity-35" />
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, color-mix(in oklab, var(--corrupt) 12%, transparent) 0 3px, transparent 3px 64px)",
            }}
          />
          {/* Floor rails */}
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: maxCol + 1 }, (_, i) => {
              const top = PAD_TOP + (maxCol - i) * ROW_GAP;
              return (
                <div key={i} className="absolute left-0 right-0" style={{ top }}>
                  <div
                    className="h-px w-full"
                    style={{
                      background:
                        "repeating-linear-gradient(90deg, color-mix(in oklab, var(--foreground) 12%, transparent) 0 4px, transparent 4px 10px)",
                    }}
                  />
                  <span
                    className="text-pixel absolute left-1 -top-2 text-[6px]"
                    style={{ color: "color-mix(in oklab, var(--foreground) 32%, transparent)" }}
                  >
                    F{i + 1}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="vignette scanlines pointer-events-none absolute inset-0 opacity-45" />

          <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "none" }}>
            {lines.map((l) => {
              const stroke = l.live
                ? "#ffcc4d"
                : l.onPreview
                  ? "rgba(84,168,255,0.75)"
                  : l.walked
                    ? "rgba(120,255,220,0.4)"
                    : "rgba(180,190,220,0.18)";
              return (
                <line
                  key={l.key}
                  x1={`${l.a.leftPct}%`}
                  y1={l.a.topPx}
                  x2={`${l.b.leftPct}%`}
                  y2={l.b.topPx}
                  stroke={stroke}
                  strokeWidth={l.live ? 3 : l.onPreview ? 2.5 : 2}
                  strokeDasharray={l.walked && !l.live ? undefined : "6 6"}
                  strokeLinecap="butt"
                  className={l.live ? "map-dash" : undefined}
                />
              );
            })}
          </svg>

          {map.map((n, i) => (
            <NodeButton
              key={n.id}
              node={n}
              index={i}
              pos={posOf(n)}
              canEnter={reachable.has(n.id)}
              isCurrent={n.id === currentId}
              isSelected={selected === n.id}
              onPreview={preview.has(n.id)}
              bossAsset={bossDef?.asset ?? null}
              bossName={bossDef?.name ?? "Boss"}
              onSelect={() => onNode(n)}
            />
          ))}
        </div>
      </div>

      {/* Inspector */}
      <AnimatePresence>
        {selectedNode && meta && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="absolute inset-x-0 bottom-0 z-30 border-t-2 bg-background/97 px-3 pb-3 pt-2"
            style={{ borderColor: meta.color }}
          >
            <div className="flex items-start gap-2">
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border-2"
                style={{ borderColor: "#07060c", background: meta.color, color: "#07060c" }}
              >
                <span className="text-pixel text-[12px]">{meta.glyph}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-pixel text-[9px]" style={{ color: meta.color }}>
                  {selectedNode.type === "boss"
                    ? (bossDef?.name ?? meta.title).toUpperCase()
                    : meta.title}
                </div>
                <p
                  className="mt-0.5 text-[12px] leading-tight text-muted-foreground"
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  {meta.blurb}
                </p>
                <div
                  className="mt-1 grid grid-cols-1 gap-0.5 text-[12px] leading-tight"
                  style={{ fontFamily: "var(--font-pixel-body)" }}
                >
                  <span className="text-corrupt">RISK: {meta.risk}</span>
                  <span className="text-primary">GAIN: {meta.reward}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="text-pixel border-2 border-muted-foreground/40 px-3 py-2 text-[8px] text-muted-foreground"
              >
                BACK
              </button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => enterNode(selectedNode.id)}
                className="text-pixel flex-1 border-2 py-2 text-[9px]"
                style={{ borderColor: "#07060c", background: meta.color, color: "#07060c" }}
              >
                ENTER ▶
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
                opacity: layer === 0 ? 0.7 : layer === 1 ? 0.45 : 0.25,
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
  isSelected,
  onPreview,
  bossAsset,
  bossName,
  onSelect,
}: {
  node: MapNode;
  index: number;
  pos: { leftPct: number; topPx: number };
  canEnter: boolean;
  isCurrent: boolean;
  isSelected: boolean;
  onPreview: boolean;
  bossAsset: string | null;
  bossName: string;
  onSelect: () => void;
}) {
  const cfg = NODE[node.type] ?? NODE["combat"]!;
  const size = node.type === "boss" ? 64 : canEnter ? 48 : 38;
  const dim = !canEnter && !isCurrent;
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isSelected ? 1.14 : 1, opacity: 1 }}
      transition={{
        delay: Math.min(index * 0.025, 0.4),
        type: "spring",
        stiffness: 260,
        damping: 16,
      }}
      whileTap={canEnter ? { scale: 0.92 } : {}}
      whileHover={canEnter ? { scale: 1.1 } : {}}
      onClick={canEnter ? onSelect : undefined}
      disabled={!canEnter}
      aria-label={`${cfg.label} node`}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${pos.leftPct}%`, top: pos.topPx, zIndex: isSelected ? 15 : 10 }}
    >
      <div
        className={`flex items-center justify-center ${canEnter && !isSelected ? "node-pulse" : ""}`}
        style={{
          width: size,
          height: size,
          border: "3px solid #07060c",
          background: node.visited
            ? "linear-gradient(180deg,#2a2836,#15131f)"
            : `linear-gradient(180deg, ${cfg.color}, #15131f)`,
          boxShadow: isSelected
            ? `0 0 0 4px #07060c, 0 0 0 7px ${cfg.color}, 0 0 26px 4px ${cfg.color}`
            : canEnter
              ? `0 0 0 3px ${cfg.color}, 0 0 16px 2px ${cfg.color}`
              : onPreview
                ? `0 0 0 2px ${cfg.color}aa`
                : `0 0 0 2px ${cfg.color}44`,
          opacity: dim ? (onPreview ? 0.8 : node.visited ? 0.7 : 0.34) : 1,
          filter: dim ? (onPreview ? "saturate(0.85)" : "saturate(0.35)") : "none",
        }}
      >
        {node.type === "boss" && bossAsset && !node.visited ? (
          <img
            src={bossAsset}
            alt={bossName}
            loading="lazy"
            width={512}
            height={512}
            className="pixelated h-[54px] w-[54px] object-contain"
          />
        ) : (
          <span
            className="text-pixel"
            style={{ fontSize: node.type === "boss" ? 20 : canEnter ? 14 : 11, color: "#07060c" }}
          >
            {node.visited ? "✓" : cfg.glyph}
          </span>
        )}
      </div>
      <span
        className="text-pixel mt-1 whitespace-nowrap text-[6px]"
        style={{
          color: canEnter ? cfg.color : onPreview ? `${cfg.color}cc` : "rgba(200,205,225,0.35)",
        }}
      >
        {node.type === "boss" ? bossName.toUpperCase() : cfg.label}
      </span>
      {canEnter && !isSelected && (
        <motion.span
          animate={{ y: [0, -3, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="text-pixel absolute -bottom-3 text-[7px]"
          style={{ color: cfg.color }}
        >
          ▲
        </motion.span>
      )}
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
