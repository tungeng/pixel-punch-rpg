import type { RelicDef } from "./types";

/**
 * Relics are the run-defining permanent buffs. Tiers drive both the drop pools
 * and the visual prominence of a relic wherever it's shown.
 */
export const RELICS: Record<string, RelicDef> = {
  // ---------- common ----------
  energy_core: { id: "energy_core", name: "Energy Core", text: "+1 max Energy.", icon: "⚡", color: "#f59e0b", tier: "common" },
  draw_charm: { id: "draw_charm", name: "Holo Charm", text: "Draw +1 card each turn.", icon: "📜", color: "#38bdf8", tier: "common" },
  vampire_fang: { id: "vampire_fang", name: "Vampire Fang", text: "Heal 6 HP after each combat.", icon: "🦷", color: "#ef4444", tier: "common" },
  barrier_start: { id: "barrier_start", name: "Barrier Field", text: "Start each combat with 12 Block.", icon: "🛡️", color: "#22c55e", tier: "common" },
  thorn_mail: { id: "thorn_mail", name: "Thorn Mail", text: "Deal 4 damage to attackers when you're hit.", icon: "🌵", color: "#84cc16", tier: "common" },
  gold_heart: { id: "gold_heart", name: "Gold Heart", text: "+30 Max HP.", icon: "💛", color: "#eab308", tier: "common" },
  lucky_coin: { id: "lucky_coin", name: "Lucky Coin", text: "+75% gold from fights.", icon: "🪙", color: "#fbbf24", tier: "common" },
  berserker: { id: "berserker", name: "Berserker", text: "Start each combat with 2 Strength.", icon: "🔥", color: "#dc2626", tier: "common" },
  regen_drone: { id: "regen_drone", name: "Regen Drone", text: "Heal 2 HP at the start of each turn.", icon: "🤖", color: "#06b6d4", tier: "common" },
  static_shell: { id: "static_shell", name: "Static Shell", text: "Gain 3 Block each time you're hit.", icon: "🧊", color: "#7dd3fc", tier: "common" },
  salvage_claw: { id: "salvage_claw", name: "Salvage Claw", text: "+20 gold after every combat.", icon: "🔧", color: "#a3a3a3", tier: "common" },
  war_banner: { id: "war_banner", name: "War Banner", text: "Enemies start each combat with 2 Vulnerable.", icon: "🚩", color: "#fb7185", tier: "common" },

  // ---------- uncommon ----------
  power_cell: { id: "power_cell", name: "Power Cell", text: "Ultimate charges 60% faster.", icon: "🔋", color: "#a855f7", tier: "uncommon" },
  hex_emitter: { id: "hex_emitter", name: "Hex Emitter", text: "Enemies start each combat with 2 Weak.", icon: "🕸️", color: "#c084fc", tier: "uncommon" },
  ult_battery: { id: "ult_battery", name: "Ult Battery", text: "Start each combat with 30% Ultimate charge.", icon: "🎇", color: "#f472b6", tier: "uncommon" },
  dragon_ember: { id: "dragon_ember", name: "Dragon Ember", text: "Gain 1 Strength at the start of every turn.", icon: "🐉", color: "#f97316", tier: "uncommon" },
  volt_capacitor: { id: "volt_capacitor", name: "Volt Capacitor", text: "Deal 5 damage to a random enemy each turn.", icon: "🌩️", color: "#facc15", tier: "uncommon" },
  aegis_loop: { id: "aegis_loop", name: "Aegis Loop", text: "Keep half your Block between turns.", icon: "♾️", color: "#34d399", tier: "uncommon" },
  haste_module: { id: "haste_module", name: "Haste Module", text: "The first card you play each turn costs 1 less.", icon: "💨", color: "#22d3ee", tier: "uncommon" },
  phoenix_core: { id: "phoenix_core", name: "Phoenix Core", text: "Heal 3 HP whenever a card is exhausted.", icon: "🔆", color: "#fdba74", tier: "uncommon" },
  blood_pact: { id: "blood_pact", name: "Blood Pact", text: "Heal 8% of Max HP after each combat.", icon: "🩸", color: "#b91c1c", tier: "uncommon" },
  codex_shard: { id: "codex_shard", name: "Codex Shard", text: "Card rewards offer 4 choices instead of 3.", icon: "📘", color: "#60a5fa", tier: "uncommon" },
  relic_scanner: { id: "relic_scanner", name: "Relic Scanner", text: "Elites and bosses always drop a relic.", icon: "📡", color: "#2dd4bf", tier: "uncommon" },

  // ---------- rare ----------
  soul_stone: { id: "soul_stone", name: "Soul Stone", text: "Revive once at 50% HP when you die.", icon: "💎", color: "#6366f1", tier: "rare" },
  reactor_surge: { id: "reactor_surge", name: "Reactor Surge", text: "+2 Energy on every other turn.", icon: "☢️", color: "#fde047", tier: "rare" },
  titan_plating: { id: "titan_plating", name: "Titan Plating", text: "+55 Max HP, but -1 max Energy.", icon: "🏗️", color: "#94a3b8", tier: "rare" },
  combat_visor: { id: "combat_visor", name: "Combat Visor", text: "Draw +2 cards each turn, but -15 Max HP.", icon: "🥽", color: "#38f8c0", tier: "rare" },
  execution_chip: { id: "execution_chip", name: "Execution Chip", text: "Start each combat with 3 Strength.", icon: "⚙️", color: "#ff6b3d", tier: "rare" },
  chrono_engine: { id: "chrono_engine", name: "Chrono Engine", text: "Start each combat with 20 Block and 1 extra card.", icon: "⏱️", color: "#8b5cf6", tier: "rare" },
};

export const ALL_RELIC_IDS = Object.keys(RELICS);

export const RELIC_TIER_COLOR: Record<string, string> = {
  common: "#cbd5e1",
  uncommon: "#54d98c",
  rare: "#ffcc4d",
};

/** Weighted relic roll — rarer tiers show up less often. */
export function pickRelicId(pool: string[], roll: number): string | undefined {
  if (pool.length === 0) return undefined;
  const byTier = (t: string) => pool.filter((id) => (RELICS[id]?.tier ?? "common") === t);
  const order = roll < 0.55 ? ["common", "uncommon", "rare"] : roll < 0.87 ? ["uncommon", "rare", "common"] : ["rare", "uncommon", "common"];
  for (const t of order) {
    const group = byTier(t);
    if (group.length > 0) return group[Math.floor(roll * 997) % group.length];
  }
  return pool[0];
}
