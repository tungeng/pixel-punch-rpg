import type { MapNode, NodeType } from "./types";
import { Rng } from "./rng";

// Slay-the-Spire style branching map. Each act = ROWS columns of nodes;
// each node links forward to 1-2 nodes in the next column. The last column
// is always a boss.

const ROWS = 8;

// Weighted node pool for a normal (non-boss) column.
const POOL: NodeType[] = [
  "combat", "combat", "combat", "combat",
  "elite", "elite",
  "rest",
  "shop",
  "treasure",
];

export function generateMap(rng: Rng): MapNode[] {
  const nodes: MapNode[] = [];
  let id = 0;
  // rows[0..ROWS-1] are path columns, row ROWS is boss
  const grid: MapNode[][] = [];
  for (let r = 0; r <= ROWS; r++) {
    grid[r] = [];
  }

  const width = 3; // vertical bands per column
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
      grid[r].push(node);
      nodes.push(node);
    }
  }
  // boss
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
  grid[ROWS].push(boss);
  nodes.push(boss);

  // Assign types to non-start, non-boss columns
  for (let r = 0; r < ROWS; r++) {
    for (const node of grid[r]) {
      if (r === 0) {
        node.type = rng.pick(POOL.filter((t) => t !== "elite" && t !== "treasure" && t !== "shop"));
      } else {
        node.type = rng.pick(POOL);
      }
    }
  }
  // Guarantee at least one rest and one shop and one treasure per act
  const allNormal = nodes.filter((n) => n.type !== "boss");
  ensureType(allNormal, rng, "rest");
  ensureType(allNormal, rng, "shop");
  ensureType(allNormal, rng, "treasure");
  ensureType(allNormal, rng, "elite");

  // Connect: each node links to 1-2 nodes in next column, ensure next col fully reached
  for (let r = 0; r < ROWS; r++) {
    const cur = grid[r];
    const nextCol = grid[r + 1];
    for (const node of cur) {
      const links = rng.chance(0.5) ? 1 : 2;
      const shuffled = rng.shuffle(nextCol).slice(0, links);
      for (const nx of shuffled) {
        if (!node.next.includes(nx.id)) node.next.push(nx.id);
      }
    }
    // ensure every node in next col has at least one predecessor
    for (const nx of nextCol) {
      const hasPred = cur.some((c) => c.next.includes(nx.id));
      if (!hasPred && cur.length > 0) {
        const pred = rng.pick(cur);
        pred.next.push(nx.id);
      }
    }
  }

  // Position: x by column, y spread within band. Keep only reachable from start.
  const reachable = computeReachable(nodes, grid[0]);
  const positioned = nodes.filter((n) => reachable.has(n.id));
  // re-link filtered (already via ids)
  const COL_W = 14; // percent-ish handled in component; here give raw x/y 0..1
  for (const node of positioned) {
    node.x = node.col / ROWS;
  }
  // vertical position within column
  for (let r = 0; r <= ROWS; r++) {
    const col = grid[r].filter((n) => reachable.has(n.id));
    col.forEach((n, i) => {
      n.y = col.length === 1 ? 0.5 : i / (col.length - 1);
    });
  }
  return positioned;
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
  const stack = [...starts.map((s) => s.id)];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = byId.get(id);
    if (!node) continue;
    for (const nx of node.next) stack.push(nx);
  }
  return seen;
}
