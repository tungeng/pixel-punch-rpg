import talonImg from "../assets/enemy_talon.png";
import bastionImg from "../assets/enemy_bastion.png";
import sniperImg from "../assets/enemy_sniper.png";
import omnicImg from "../assets/enemy_omnic.png";
import nullImg from "../assets/boss_nullsector.png";
import reaperImg from "../assets/boss_reaper.png";
import widowImg from "../assets/boss_widowmaker.png";
import sigmaImg from "../assets/boss_sigma.png";
import moiraImg from "../assets/boss_moira.png";
import type { EnemyDef } from "./types";

export const ENEMIES: Record<string, EnemyDef> = {
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
};

export const ELITE_POOL = ["talon_heavy", "bastion", "sniper"];

export const BOSSES: Record<string, EnemyDef> = {
  reaper: {
    id: "reaper",
    name: "Reaper",
    asset: reaperImg,
    hp: [130, 130],
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
    hp: [175, 175],
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
    hp: [215, 215],
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
    hp: [280, 280],
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

