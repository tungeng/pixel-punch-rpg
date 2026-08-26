export interface UpgradeDef {
  id: string;
  name: string;
  icon: string;
  maxTier: number;
  /** cost of each tier, index 0 = first purchase */
  costs: number[];
  /** short static blurb of what a tier gives */
  perTier: string;
  /** description of the effect at a given tier */
  effect: (tier: number) => string;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: "vitality_matrix",
    name: "VITALITY MATRIX",
    icon: "❤",
    maxTier: 5,
    costs: [60, 100, 150, 220, 320],
    perTier: "+5 Max HP per tier",
    effect: (t) => `+${t * 5} Max HP on every run`,
  },
  {
    id: "salvage_protocol",
    name: "SALVAGE PROTOCOL",
    icon: "⬢",
    maxTier: 3,
    costs: [120, 220, 380],
    perTier: "+10% Chrono Cores per tier",
    effect: (t) => `+${t * 10}% Chrono Cores earned at end of run`,
  },
  {
    id: "overcharge_battery",
    name: "OVERCHARGE BATTERY",
    icon: "⚡",
    maxTier: 3,
    costs: [90, 160, 260],
    perTier: "+5% starting gold per tier",
    effect: (t) => `Start each run with ${t * 5} Gold (+${t * 5}%)`,
  },
];

export function upgradeById(id: string): UpgradeDef | undefined {
  return UPGRADES.find((u) => u.id === id);
}

export function tierOf(upgrades: Record<string, number> | undefined, id: string): number {
  const t = upgrades?.[id] ?? 0;
  const def = upgradeById(id);
  if (!def) return 0;
  return Math.max(0, Math.min(def.maxTier, t));
}

export function nextCost(upgrades: Record<string, number> | undefined, id: string): number | null {
  const def = upgradeById(id);
  if (!def) return null;
  const t = tierOf(upgrades, id);
  if (t >= def.maxTier) return null;
  return def.costs[t]!;
}

// ---- effect resolvers ----
export function upgradeBonusMaxHp(upgrades?: Record<string, number>): number {
  return tierOf(upgrades, "vitality_matrix") * 5;
}

export function upgradeCreditMult(upgrades?: Record<string, number>): number {
  return 1 + tierOf(upgrades, "salvage_protocol") * 0.1;
}

export function upgradeStartGold(upgrades?: Record<string, number>): number {
  return tierOf(upgrades, "overcharge_battery") * 5;
}

export function upgradeCacheRelicChance(): number {
  // Cache nodes always mattered more as a relic than as a coin pile, so the
  // old "buy better cache odds" upgrade was replaced by a flat, readable rate.
  return 0.85;
}
