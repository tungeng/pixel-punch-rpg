import talonImg from "../assets/enemy_talon.png";
import bastionImg from "../assets/enemy_bastion.png";
import sniperImg from "../assets/enemy_sniper.png";
import omnicImg from "../assets/enemy_omnic.png";
import rusherImg from "../assets/enemy_rusher.png";
import shieldDroneImg from "../assets/enemy_shielddrone.png";
import hexDroneImg from "../assets/enemy_hexdrone.png";
import podImg from "../assets/enemy_pod.png";
import breacherImg from "../assets/enemy_breacher.png";
import stalkerImg from "../assets/enemy_stalker.png";
import titanImg from "../assets/enemy_titan.png";
import arcImg from "../assets/enemy_arc.png";
import wraithImg from "../assets/enemy_wraith.png";
import nullImg from "../assets/boss_nullsector.png";
import reaperImg from "../assets/boss_reaper.png";
import widowImg from "../assets/boss_widowmaker.png";
import sigmaImg from "../assets/boss_sigma.png";
import moiraImg from "../assets/boss_moira.png";
import type { EnemyDef } from "./types";

export const ENEMIES: Record<string, EnemyDef> = {
  // ---------------- Act 1 fodder ----------------
  talon_trooper: {
    id: "talon_trooper",
    name: "Talon Trooper",
    asset: talonImg,
    hp: [22, 28],
    moves: [
      { type: "attack", text: "Burst 7", damage: 7 },
      { type: "attack", text: "Spray 5", damage: 5 },
      { type: "block", text: "Bunker 4", block: 4 },
    ],
  },
  omnic_grunt: {
    id: "omnic_grunt",
    name: "Omnic Grunt",
    asset: omnicImg,
    hp: [14, 18],
    moves: [
      { type: "attack", text: "Pulse 5", damage: 5 },
      { type: "attack", text: "Jab 4", damage: 4 },
      { type: "block", text: "Shield 3", block: 3 },
    ],
  },
  sniper: {
    id: "sniper",
    name: "Sniper",
    asset: sniperImg,
    hp: [18, 22],
    moves: [
      { type: "attack", text: "Headshot 12", damage: 12 },
      { type: "debuff", text: "Suppression 2 Weak", weak: 2 },
      { type: "attack", text: "Potshot 6", damage: 6 },
    ],
  },
  bastion: {
    id: "bastion",
    name: "Bastion Bot",
    asset: bastionImg,
    hp: [30, 36],
    moves: [
      { type: "attack", text: "Minigun 9", damage: 9 },
      { type: "block", text: "Deploy 6 Block", block: 6 },
      { type: "attack", text: "Burst x2 6", damage: 6, hits: 2 },
    ],
  },
  sweeper_bot: {
    id: "sweeper_bot",
    name: "Sweeper Bot",
    asset: omnicImg,
    hp: [16, 20],
    moves: [
      { type: "attack", text: "Sweep x2 4", damage: 4, hits: 2 },
      { type: "debuff", text: "Mark 1 Vuln", vulnerable: 1 },
      { type: "attack", text: "Slam 6", damage: 6 },
    ],
  },
  talon_rusher: {
    id: "talon_rusher",
    name: "Talon Rusher",
    asset: rusherImg,
    hp: [12, 15],
    moves: [
      { type: "attack", text: "Knife Flurry x2 4", damage: 4, hits: 2 },
      { type: "attack", text: "Lunge x3 3", damage: 3, hits: 3 },
      { type: "buff", text: "Adrenaline +1 Str", strength: 1 },
    ],
  },
  shield_drone: {
    id: "shield_drone",
    name: "Bulwark Drone",
    asset: shieldDroneImg,
    hp: [15, 18],
    trait: "aegis",
    traitName: "AEGIS FIELD",
    moves: [
      { type: "attack", text: "Repulsor 6", damage: 6 },
      { type: "block", text: "Barrier 8", block: 8 },
      { type: "attack_block", text: "Ram 4+4", damage: 4, block: 4 },
    ],
  },
  hex_drone: {
    id: "hex_drone",
    name: "Hex Drone",
    asset: hexDroneImg,
    hp: [12, 15],
    moves: [
      { type: "debuff", text: "Hex 1 Weak", weak: 1 },
      { type: "debuff", text: "Fracture 1 Vuln", vulnerable: 1 },
      { type: "attack", text: "Arc Bolt 6", damage: 6 },
    ],
  },
  assembler_pod: {
    id: "assembler_pod",
    name: "Assembler Pod",
    asset: podImg,
    hp: [19, 23],
    moves: [
      { type: "summon", text: "Assemble Grunt", summonId: "omnic_grunt" },
      { type: "block", text: "Seal Hatch 7", block: 7 },
      { type: "attack", text: "Scrap Shot 7", damage: 7 },
      { type: "summon", text: "Assemble Sweeper", summonId: "sweeper_bot" },
    ],
  },

  // ---------------- Act 2+ escalation ----------------
  talon_breacher: {
    id: "talon_breacher",
    name: "Talon Breacher",
    asset: breacherImg,
    hp: [26, 31],
    trait: "aegis",
    traitName: "RIOT SHIELD",
    moves: [
      { type: "attack", text: "Slug x2 7", damage: 7, hits: 2 },
      { type: "attack_block", text: "Shield Bash 6+8", damage: 6, block: 8 },
      { type: "attack", text: "Breach Charge 13", damage: 13 },
    ],
  },
  venom_stalker: {
    id: "venom_stalker",
    name: "Venom Stalker",
    asset: stalkerImg,
    hp: [21, 25],
    moves: [
      { type: "debuff", text: "Venom Spit 2 Poison", poison: 2 },
      { type: "attack", text: "Pounce x2 6", damage: 6, hits: 2 },
      { type: "debuff", text: "Corrode 1 Vuln", vulnerable: 1 },
      { type: "attack", text: "Mandibles 11", damage: 11 },
    ],
  },
  arc_caster: {
    id: "arc_caster",
    name: "Arc Caster",
    asset: arcImg,
    hp: [17, 21],
    moves: [
      { type: "buff", text: "Overclock +2 Str", strength: 2 },
      { type: "attack", text: "Chain Lightning x3 5", damage: 5, hits: 3 },
      { type: "debuff", text: "Static 1 Weak", weak: 1 },
    ],
  },
  null_titan: {
    id: "null_titan",
    name: "Null Titan",
    asset: titanImg,
    hp: [32, 38],
    trait: "regen",
    traitName: "SELF-REPAIR",
    moves: [
      { type: "attack", text: "Siege Cannon 16", damage: 16 },
      { type: "attack_block", text: "Stomp 9+10", damage: 9, block: 10 },
      { type: "attack", text: "Twin Guns x2 9", damage: 9, hits: 2 },
    ],
  },
  wraith_echo: {
    id: "wraith_echo",
    name: "Wraith Echo",
    asset: wraithImg,
    hp: [24, 28],
    trait: "leech",
    traitName: "SOUL DRAIN",
    moves: [
      { type: "attack", text: "Rend x2 8", damage: 8, hits: 2 },
      { type: "debuff", text: "Dread 1 Weak", weak: 1, poison: 1 },
      { type: "attack", text: "Echo Scythe 14", damage: 14 },
    ],
  },
  talon_heavy: {
    id: "talon_heavy",
    name: "Talon Heavy",
    asset: talonImg,
    hp: [34, 40],
    moves: [
      { type: "attack", text: "Slug 8", damage: 8 },
      { type: "attack_block", text: "Bulwark 5+5", damage: 5, block: 5 },
      { type: "buff", text: "Rage +2 Str", strength: 2 },
      { type: "attack", text: "Suppress 11", damage: 11 },
    ],
  },

  // ---------------- Elites (unique modifiers) ----------------
  elite_heavy: {
    id: "elite_heavy",
    name: "Talon Warlord",
    asset: talonImg,
    hp: [34, 39],
    isElite: true,
    trait: "rampage",
    traitName: "WARCRY",
    moves: [
      { type: "attack", text: "Slug 10", damage: 10 },
      { type: "attack_block", text: "Bulwark 7+7", damage: 7, block: 7 },
      { type: "attack", text: "Suppress x2 8", damage: 8, hits: 2 },
    ],
  },
  elite_bastion: {
    id: "elite_bastion",
    name: "Bastion Sentry",
    asset: bastionImg,
    hp: [39, 44],
    isElite: true,
    trait: "aegis",
    traitName: "SENTRY LOCK",
    moves: [
      { type: "attack", text: "Minigun x3 6", damage: 6, hits: 3 },
      { type: "block", text: "Fortify 12", block: 12 },
      { type: "attack", text: "Tank Shell 17", damage: 17 },
    ],
  },
  elite_warden: {
    id: "elite_warden",
    name: "Null Warden",
    asset: shieldDroneImg,
    hp: [42, 48],
    isElite: true,
    trait: "aegis",
    traitName: "PHALANX FIELD",
    moves: [
      { type: "attack_block", text: "Crush 9+10", damage: 9, block: 10 },
      { type: "debuff", text: "Lockdown 1 Weak", weak: 1 },
      { type: "attack", text: "Repulsor Beam x2 8", damage: 8, hits: 2 },
    ],
  },
  elite_matriarch: {
    id: "elite_matriarch",
    name: "Assembler Matriarch",
    asset: podImg,
    hp: [46, 52],
    isElite: true,
    trait: "regen",
    traitName: "NANO-FORGE",
    moves: [
      { type: "summon", text: "Deploy Rusher", summonId: "talon_rusher" },
      { type: "attack", text: "Scrap Storm x2 8", damage: 8, hits: 2 },
      { type: "summon", text: "Deploy Hex Drone", summonId: "hex_drone" },
      { type: "attack", text: "Foundry Blast 15", damage: 15 },
    ],
  },
  elite_venom: {
    id: "elite_venom",
    name: "Venom Broodmother",
    asset: stalkerImg,
    hp: [49, 56],
    isElite: true,
    trait: "curse",
    traitName: "TOXIC AURA",
    moves: [
      { type: "debuff", text: "Necrotoxin 2 Poison", poison: 2 },
      { type: "attack", text: "Pounce x3 7", damage: 7, hits: 3 },
      { type: "attack_block", text: "Carapace 10+10", damage: 10, block: 10 },
    ],
  },
  elite_titan: {
    id: "elite_titan",
    name: "Null Siege Titan",
    asset: titanImg,
    hp: [61, 68],
    isElite: true,
    trait: "rampage",
    traitName: "SIEGE PROTOCOL",
    moves: [
      { type: "attack", text: "Siege Cannon 16", damage: 16 },
      { type: "attack_block", text: "Stomp 11+14", damage: 11, block: 14 },
      { type: "attack", text: "Twin Guns x3 8", damage: 8, hits: 3 },
    ],
  },
  elite_wraith: {
    id: "elite_wraith",
    name: "Wraith Revenant",
    asset: wraithImg,
    hp: [53, 60],
    isElite: true,
    trait: "leech",
    traitName: "REVENANT FEAST",
    moves: [
      { type: "attack", text: "Rend x3 8", damage: 8, hits: 3 },
      { type: "debuff", text: "Death Mark 1 Vuln", vulnerable: 1, poison: 1 },
      { type: "attack", text: "Echo Scythe 18", damage: 18 },
    ],
  },
};

/** Normal fight pools per act (index 0 = Act 1) — later acts skew tougher. */
export const ACT_ENEMY_POOLS: string[][] = [
  ["talon_trooper", "omnic_grunt", "sweeper_bot", "talon_rusher", "shield_drone", "hex_drone"],
  ["talon_trooper", "sniper", "talon_rusher", "shield_drone", "hex_drone", "assembler_pod", "bastion"],
  ["talon_breacher", "venom_stalker", "arc_caster", "assembler_pod", "bastion", "sniper", "talon_heavy"],
  ["null_titan", "wraith_echo", "venom_stalker", "arc_caster", "talon_breacher", "talon_heavy"],
];

/** Elite pools per act — every entry carries a unique modifier trait. */
export const ACT_ELITE_POOLS: string[][] = [
  ["elite_heavy", "elite_bastion"],
  ["elite_warden", "elite_heavy", "elite_bastion"],
  ["elite_matriarch", "elite_venom", "elite_warden"],
  ["elite_titan", "elite_wraith", "elite_venom"],
];

export const ELITE_POOL = ACT_ELITE_POOLS[0]!;

export function enemyPoolFor(act: number): string[] {
  return ACT_ENEMY_POOLS[Math.min(act, ACT_ENEMY_POOLS.length - 1)]!;
}

export function elitePoolFor(act: number): string[] {
  return ACT_ELITE_POOLS[Math.min(act, ACT_ELITE_POOLS.length - 1)]!;
}

export const BOSSES: Record<string, EnemyDef> = {
  reaper: {
    id: "reaper",
    name: "Reaper",
    asset: reaperImg,
    hp: [120, 120],
    isBoss: true,
    mechanic: "wraith",
    mechanicName: "WRAITH FORM",
    moves: [
      { type: "attack", text: "Hellfire x2 9", damage: 9, hits: 2 },
      { type: "debuff", text: "Wraith Curse 2 Weak", weak: 2 },
      { type: "buff", text: "The Reaping +3 Str", strength: 3 },
      { type: "attack", text: "Death Blossom 20", damage: 20 },
    ],
  },
  widowmaker: {
    id: "widowmaker",
    name: "Widowmaker",
    asset: widowImg,
    hp: [150, 150],
    isBoss: true,
    mechanic: "venom",
    mechanicName: "VENOM MINE",
    moves: [
      { type: "attack", text: "Headshot 16", damage: 16 },
      { type: "attack_block", text: "Grapple 8+12", damage: 8, block: 12 },
      { type: "debuff", text: "Venom Cloud 2 Vuln", vulnerable: 2 },
      { type: "attack", text: "Widow's Kiss x3 7", damage: 7, hits: 3 },
    ],
  },
  sigma: {
    id: "sigma",
    name: "Sigma",
    asset: sigmaImg,
    hp: [185, 185],
    isBoss: true,
    mechanic: "gravity",
    mechanicName: "GRAVITIC FLUX",
    moves: [
      { type: "attack", text: "Hyperspheres x2 11", damage: 11, hits: 2 },
      { type: "block", text: "Experimental Barrier 22", block: 22 },
      { type: "buff", text: "Accretion +3 Str", strength: 3 },
      { type: "attack", text: "Gravitic Flux 24", damage: 24 },
    ],
  },
  moira: {
    id: "moira",
    name: "Moira",
    asset: moiraImg,
    hp: [240, 240],
    isBoss: true,
    mechanic: "phase",
    mechanicName: "BIOTIC DESCENT",
    moves: [
      { type: "attack_block", text: "Biotic Grasp 12+14", damage: 12, block: 14 },
      { type: "debuff", text: "Decay 3 Weak", weak: 3 },
      { type: "attack", text: "Coalescence x2 12", damage: 12, hits: 2 },
      { type: "attack", text: "Necrotic Burst 26", damage: 26 },
    ],
  },
  nullsector: {
    id: "nullsector",
    name: "Null Sector OR-14",
    asset: nullImg,
    hp: [110, 110],
    isBoss: true,
    moves: [
      { type: "attack", text: "Twin Cannons x2 8", damage: 8, hits: 2 },
      { type: "attack_block", text: "Bulwark 12+15", damage: 12, block: 15 },
      { type: "buff", text: "Overcharge +2 Str", strength: 2 },
      { type: "attack", text: "Annihilator 18", damage: 18 },
    ],
  },
};

export const ACT_BOSSES = ["reaper", "widowmaker", "sigma", "moira"];
export const ACT_COUNT = ACT_BOSSES.length;

