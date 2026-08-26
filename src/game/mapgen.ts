import type { MapNode, NodeType } from "./types";
import { Rng } from "./rng";

// Slay-the-Spire style branching map. Each act = ROWS columns of nodes;
// each node links forward to 1-2 nodes in the next column. The last column
// is always a boss.

const ROWS = 8;

// Weighted node pool for a normal (non-boss) column. Fights are the spine of
// an act; caches stay scarce so a relic still feels like an event.
const POOL: NodeType[] = [
  "combat", "combat", "combat", "combat", "combat",
  "elite",
  "rest",
  "shop",
  "treasure",
];



export function generateMap(rng: Rng): MapNode[] {
  const nodes: MapNode[] = [];
  let id = 0;
  const grid: MapNode[][] = [];
  for (let r = 0; r <= ROWS; r++) grid.push([]);

  for (let r = 0; r < ROWS; r++) {
    const count = rng.int(2, 3);
    for (let i = 0; i < count; i++) {
      const node: MapNode = {
        id: id++,
        type: "combat",
        col: r,
        row: i,
        next: [],
        x: 0,
        y: 0,
        visited: false,
      };
      grid[r]!.push(node);
      nodes.push(node);
    }
  }
  const boss: MapNode = {
    id: id++,
    type: "boss",
    col: ROWS,
    row: 0,
    next: [],
    x: 0,
    y: 0,
    visited: false,
  };
  grid[ROWS]!.push(boss);
  nodes.push(boss);

  for (let r = 0; r < ROWS; r++) {
    const col = grid[r]!;
    for (const node of col) {
      if (r === 0) {
        node.type = rng.pick(POOL.filter((t) => t !== "elite" && t !== "treasure" && t !== "shop"));
      } else {
        node.type = rng.pick(POOL);
      }
    }
  }

  const allNormal = nodes.filter((n) => n.type !== "boss");
  ensureType(allNormal, rng, "rest");
  ensureType(allNormal, rng, "shop");
  ensureType(allNormal, rng, "treasure");
  ensureType(allNormal, rng, "elite");

  for (let r = 0; r < ROWS; r++) {
    const cur = grid[r]!;
    const nextCol = grid[r + 1]!;
    for (const node of cur) {
      const links = rng.chance(0.5) ? 1 : 2;
      const shuffled = rng.shuffle(nextCol).slice(0, links);
      for (const nx of shuffled) {
        if (!node.next.includes(nx.id)) node.next.push(nx.id);
      }
    }
    for (const nx of nextCol) {
      const hasPred = cur.some((c) => c.next.includes(nx.id));
      if (!hasPred && cur.length > 0) {
        const pred = rng.pick(cur);
        pred.next.push(nx.id);
      }
    }
  }

  const starts = grid[0]!;
  const reachable = computeReachable(nodes, starts);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const node of nodes) {
    if (reachable.has(node.id)) {
      node.x = node.col / ROWS;
    }
  }
  for (let r = 0; r <= ROWS; r++) {
    const col = (grid[r] ?? []).filter((n) => reachable.has(n.id));
    col.forEach((n, i) => {
      n.y = col.length <= 1 ? 0.5 : i / (col.length - 1);
    });
  }
  return nodes.filter((n) => reachable.has(n.id));
}

function ensureType(pool: MapNode[], rng: Rng, type: NodeType) {
  if (pool.some((n) => n.type === type)) return;
  const candidates = pool.filter((n) => n.type === "combat");
  if (candidates.length === 0) return;
  rng.pick(candidates).type = type;
}

function computeReachable(nodes: MapNode[], starts: MapNode[]): Set<number> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<number>();
  const stack: number[] = [...starts.map((s) => s.id)];
  while (stack.length) {
    const id = stack.pop();
    if (id === undefined) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = byId.get(id);
    if (!node) continue;
    for (const nx of node.next) stack.push(nx);
  }
  return seen;
}

export function getStarts(map: MapNode[]): MapNode[] {
  return map.filter((n) => n.col === 0);
}
