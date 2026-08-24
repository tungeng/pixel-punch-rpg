import type { RelicDef } from "./types";

export const RELICS: Record<string, RelicDef> = {
  energy_core: { id: "energy_core", name: "Energy Core", text: "+1 max Energy.", icon: "⚡", color: "#f59e0b" },
  draw_charm: { id: "draw_charm", name: "Holo Charm", text: "Draw +1 card each turn.", icon: "📜", color: "#38bdf8" },
  vampire_fang: { id: "vampire_fang", name: "Vampire Fang", text: "Heal 3 HP after each combat.", icon: "🦷", color: "#ef4444" },
  barrier_start: { id: "barrier_start", name: "Barrier Field", text: "Start each combat with 10 Block.", icon: "🛡️", color: "#22c55e" },
  thorn_mail: { id: "thorn_mail", name: "Thorn Mail", text: "Deal 2 damage to attackers when hit.", icon: "🌵", color: "#84cc16" },
  power_cell: { id: "power_cell", name: "Power Cell", text: "Ultimate charges 50% faster.", icon: "🔋", color: "#a855f7" },
  gold_heart: { id: "gold_heart", name: "Gold Heart", text: "+25 Max HP.", icon: "💛", color: "#eab308" },
  lucky_coin: { id: "lucky_coin", name: "Lucky Coin", text: "+50% gold from fights.", icon: "🪙", color: "#fbbf24" },
  berserker: { id: "berserker", name: "Berserker", text: "Start each combat with 1 Strength.", icon: "🔥", color: "#dc2626" },
  soul_stone: { id: "soul_stone", name: "Soul Stone", text: "Revive once at 50% HP when you die.", icon: "💎", color: "#6366f1" },
  regen_drone: { id: "regen_drone", name: "Regen Drone", text: "Heal 1 HP at the start of each turn.", icon: "🤖", color: "#06b6d4" },
  chrono_anchor: { id: "chrono_anchor", name: "Chrono Anchor", text: "+1 Chrono Rewind each combat.", icon: "⏳", color: "#c47bff" },
};

export const ALL_RELIC_IDS = Object.keys(RELICS);
