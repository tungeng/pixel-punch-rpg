import type { RelicDef } from "./types";

/**
 * Relics are the run-defining permanent buffs. Tiers drive both the drop pools
 * and the visual prominence of a relic wherever it's shown.
 */
export const RELICS: Record<string, RelicDef> = {
  // ---------- common ----------
  energy_core: { id: "energy_core", name: "Fusion Core", text: "+1 max Energy.", icon: "⚡", color: "#f59e0b", tier: "common" },
  draw_charm: { id: "draw_charm", name: "Hana's Lucky Cat", text: "Draw +1 card each turn.", icon: "🐱", color: "#38bdf8", tier: "common" },
  vampire_fang: { id: "vampire_fang", name: "Biotic Field", text: "Heal 6 HP after each combat.", icon: "💉", color: "#facc15", tier: "common" },
  barrier_start: { id: "barrier_start", name: "Projected Barrier", text: "Start each combat with 12 Block.", icon: "🛡️", color: "#22c55e", tier: "common" },
  thorn_mail: { id: "thorn_mail", name: "Sentry Turret", text: "Deal 4 damage to attackers when you're hit.", icon: "🔩", color: "#84cc16", tier: "common" },
  gold_heart: { id: "gold_heart", name: "Roadhog's Scrap Gut", text: "+30 Max HP.", icon: "🐷", color: "#eab308", tier: "common" },
  lucky_coin: { id: "lucky_coin", name: "Junker Payday", text: "+75% gold from fights.", icon: "🪙", color: "#fbbf24", tier: "common" },
  berserker: { id: "berserker", name: "Whole Hog Fury", text: "Start each combat with 2 Strength.", icon: "🔥", color: "#dc2626", tier: "common" },
  regen_drone: { id: "regen_drone", name: "Repair Pack", text: "Heal 2 HP at the start of each turn.", icon: "🧰", color: "#06b6d4", tier: "common" },
  static_shell: { id: "static_shell", name: "Crystalline Aegis", text: "Gain 3 Block each time you're hit.", icon: "🧊", color: "#7dd3fc", tier: "common" },
  salvage_claw: { id: "salvage_claw", name: "Torbjörn's Scrap Claw", text: "+20 gold after every combat.", icon: "🔧", color: "#a3a3a3", tier: "common" },
  war_banner: { id: "war_banner", name: "Sonic Amplifier", text: "Enemies start each combat with 2 Vulnerable.", icon: "🎶", color: "#fb7185", tier: "common", startsLocked: true },

  // ---------- uncommon ----------
  power_cell: { id: "power_cell", name: "Ultimate Accelerator", text: "Ultimate charges 60% faster.", icon: "🔋", color: "#a855f7", tier: "uncommon", startsLocked: true },
  hex_emitter: { id: "hex_emitter", name: "Sombra's Virus", text: "Enemies start each combat with 2 Weak.", icon: "🕷️", color: "#c084fc", tier: "uncommon" },
  ult_battery: { id: "ult_battery", name: "Nano Canister", text: "Start each combat with 30% Ultimate charge.", icon: "🎇", color: "#f472b6", tier: "uncommon" },
  dragon_ember: { id: "dragon_ember", name: "Dragonstrike Ember", text: "Gain 1 Strength at the start of every turn.", icon: "🐉", color: "#f97316", tier: "uncommon", startsLocked: true },
  volt_capacitor: { id: "volt_capacitor", name: "Tesla Cannon", text: "Deal 5 damage to a random enemy each turn.", icon: "🌩️", color: "#facc15", tier: "uncommon", startsLocked: true },
  aegis_loop: { id: "aegis_loop", name: "Photon Projector", text: "Keep half your Block between turns.", icon: "♾️", color: "#34d399", tier: "uncommon", startsLocked: true },
  haste_module: { id: "haste_module", name: "Pulse Booster", text: "The first card you play each turn costs 1 less.", icon: "💨", color: "#22d3ee", tier: "uncommon", startsLocked: true },
  phoenix_core: { id: "phoenix_core", name: "Immortality Field", text: "Heal 3 HP whenever a card is exhausted.", icon: "🔆", color: "#fdba74", tier: "uncommon" },
  blood_pact: { id: "blood_pact", name: "Vampiric Gauntlet", text: "Heal 8% of Max HP after each combat.", icon: "🩸", color: "#b91c1c", tier: "uncommon" },
  codex_shard: { id: "codex_shard", name: "Athena Uplink", text: "Card rewards offer 4 choices instead of 3.", icon: "📘", color: "#60a5fa", tier: "uncommon" },
  relic_scanner: { id: "relic_scanner", name: "Translocator Beacon", text: "Elites and bosses always drop a relic.", icon: "📡", color: "#2dd4bf", tier: "uncommon", startsLocked: true },

  // ---------- rare ----------
  soul_stone: { id: "soul_stone", name: "Resurrect Protocol", text: "Revive once at 50% HP when you die.", icon: "🕊️", color: "#6366f1", tier: "rare", startsLocked: true },
  reactor_surge: { id: "reactor_surge", name: "Zero-Point Reactor", text: "+2 Energy on every other turn.", icon: "☢️", color: "#fde047", tier: "rare", startsLocked: true },
  titan_plating: { id: "titan_plating", name: "Crusader Plating", text: "+55 Max HP, but -1 max Energy.", icon: "🏗️", color: "#94a3b8", tier: "rare" },
  combat_visor: { id: "combat_visor", name: "Tactical Visor", text: "Draw +2 cards each turn, but -15 Max HP.", icon: "🥽", color: "#38f8c0", tier: "rare", startsLocked: true },
  execution_chip: { id: "execution_chip", name: "Death Blossom Chip", text: "Start each combat with 3 Strength.", icon: "💀", color: "#ff6b3d", tier: "rare" },
  chrono_engine: { id: "chrono_engine", name: "Chronal Accelerator", text: "Start each combat with 20 Block and 1 extra card.", icon: "⏱️", color: "#8b5cf6", tier: "rare", startsLocked: true },

  // ---------- legendary ----------
  singularity_anchor: { id: "singularity_anchor", name: "Singularity Anchor", text: "Whenever you gain Strength, gain it twice.", icon: "🌑", color: "#ff7a18", tier: "legendary", startsLocked: true },
  chrono_duplicator: { id: "chrono_duplicator", name: "Chrono Duplicator", text: "The first card you play each combat is played twice.", icon: "🔁", color: "#ff9d3c", tier: "legendary", startsLocked: true },
  overclocked_core: { id: "overclocked_core", name: "Overclocked Core", text: "+2 max Energy, but take 1 damage at the start of your turn.", icon: "🔥", color: "#ff4d2e", tier: "legendary", startsLocked: true },

  // ---------- mythic (Codex unlock only) ----------
  null_sector_core: { id: "null_sector_core", name: "Null Sector Core", text: "Once per combat, your Ultimate costs no charge.", icon: "🜲", color: "#e879f9", tier: "mythic", startsLocked: true },
  timeline_fracture: { id: "timeline_fracture", name: "Timeline Fracture", text: "At the start of each combat, choose one: 40 Block, 15 damage to all enemies, or draw 3 cards.", icon: "🪞", color: "#c084fc", tier: "mythic", startsLocked: true },
};

export const ALL_RELIC_IDS = Object.keys(RELICS);

/** Relics available from the very first run. The rest are unlocked in the Relic Codex. */
export const DEFAULT_UNLOCKED_RELIC_IDS = ALL_RELIC_IDS.filter((id) => !RELICS[id]?.startsLocked);

/** Tiers that never appear in random drops, shops or caches. Codex unlock only. */
export const CODEX_ONLY_TIERS = ["mythic"];

export function isDropEligible(id: string, allowMythic = false): boolean {
  const tier = RELICS[id]?.tier ?? "common";
  if (allowMythic && tier === "mythic") return true;
  return !CODEX_ONLY_TIERS.includes(tier);
}

export const RELIC_UNLOCK_COST: Record<string, number> = {
  common: 120,
  uncommon: 260,
  rare: 450,
  legendary: 800,
  mythic: 1600,
};

/** Permanent (meta) unlock price in Chrono Cores. */
export function relicUnlockCost(id: string): number {
  return RELIC_UNLOCK_COST[RELICS[id]?.tier ?? "common"] ?? 120;
}

export const RELIC_TIER_COLOR: Record<string, string> = {
  common: "#cbd5e1",
  uncommon: "#54d98c",
  rare: "#ffcc4d",
  legendary: "#ff6a1f",
  mythic: "#f472ff",
};

/** Tiers that get the animated, glowing card treatment. */
export function isExaltedTier(tier?: string): boolean {
  return tier === "legendary" || tier === "mythic";
}

/**
 * Weighted relic roll. Rarer tiers show up less often. Mythics only ever roll
 * from post-combat drops (allowMythic), never from shops or caches.
 */
export function pickRelicId(pool: string[], roll: number, allowMythic = false): string | undefined {
  const eligible = pool.filter((id) => isDropEligible(id, allowMythic));
  if (eligible.length === 0) return undefined;
  const byTier = (t: string) => eligible.filter((id) => (RELICS[id]?.tier ?? "common") === t);
  const order =
    roll < 0.55
      ? ["common", "uncommon", "rare"]
      : roll < 0.87
        ? ["uncommon", "rare", "common"]
        : allowMythic && roll > 0.997
          ? ["mythic", "legendary", "rare", "uncommon", "common"]
          : roll > 0.985
            ? ["legendary", "rare", "uncommon", "common"]
          : ["rare", "uncommon", "common"];
  for (const t of order) {
    const group = byTier(t);
    if (group.length > 0) return group[Math.floor(roll * 997) % group.length];
  }
  return eligible[0];
}

