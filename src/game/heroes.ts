import tracerImg from "../assets/tracer.png";
import mercyImg from "../assets/mercy.png";
import genjiImg from "../assets/genji.png";
import junkratImg from "../assets/junkrat.png";
import doomfistImg from "../assets/doomfist.png";
import moiraImg from "../assets/moira.png";
import type { HeroDef } from "./types";

export const HEROES: Record<string, HeroDef> = {
  tracer: {
    id: "tracer",
    name: "Tracer",
    role: "Damage",
    maxHp: 64,
    color: "#f59e0b",
    asset: tracerImg,
    passive: "Chrono Battery: +1 max Energy.",
    startingDeck: [
      "tracer_blink", "tracer_blink", "tracer_pistols", "tracer_pistols",
      "tracer_recall", "tracer_strafe", "tracer_strafe", "tracer_hnr",
      "tracer_reload", "tracer_dual",
    ],
    cardPool: [
      "tracer_strafe", "tracer_charged", "tracer_adrenaline", "tracer_hnr",
      "tracer_reload", "tracer_dual", "tracer_flurry", "tracer_overclock",
    ],
    ultimate: {
      id: "tracer_pulse",
      name: "Pulse Bomb",
      type: "ultimate",
      cost: 0,
      rarity: "rare",
      hero: "tracer",
      damage: 30,
      text: "Deal 30 damage to one enemy.",
    },
  },
  mercy: {
    id: "mercy",
    name: "Mercy",
    role: "Support",
    maxHp: 66,
    color: "#fcd34d",
    asset: mercyImg,
    passive: "Regeneration: heal 1 HP at the start of each turn.",
    startingDeck: [
      "mercy_blaster", "mercy_blaster", "mercy_heal", "mercy_heal",
      "mercy_guardian", "mercy_pacify", "mercy_regen", "mercy_shot",
      "mercy_blight", "mercy_boost",
    ],
    cardPool: [
      "mercy_boost", "mercy_guardian", "mercy_resurrect", "mercy_shot",
      "mercy_blight", "mercy_lastrites", "mercy_overflow",
    ],
    ultimate: {
      id: "mercy_valkyrie",
      name: "Valkyrie",
      type: "ultimate",
      cost: 0,
      rarity: "rare",
      hero: "mercy",
      heal: 12,
      strength: 2,
      draw: 3,
      text: "Heal 12 HP. Gain 2 Strength. Draw 3 cards.",
    },
  },
  genji: {
    id: "genji",
    name: "Genji",
    role: "Combo",
    maxHp: 66,
    color: "#22c55e",
    asset: genjiImg,
    passive: "Cyber Agility: draw +1 card at the start of each turn.",
    startingDeck: [
      "genji_shuriken", "genji_shuriken", "genji_swift", "genji_swift",
      "genji_deflect", "genji_fang", "genji_agility", "genji_riposte",
      "genji_dash", "genji_storm",
    ],
    cardPool: [
      "genji_fang", "genji_agility", "genji_spirit", "genji_riposte",
      "genji_dash", "genji_storm", "genji_rush", "genji_windcut",
    ],
    ultimate: {
      id: "genji_dragon",
      name: "Dragonblade",
      type: "ultimate",
      cost: 0,
      rarity: "rare",
      hero: "genji",
      damage: 10,
      hits: 4,
      text: "Deal 10 damage 4 times to one enemy.",
    },
  },
  junkrat: {
    id: "junkrat",
    name: "Junkrat",
    role: "Damage",
    maxHp: 96,
    color: "#eab308",
    asset: junkratImg,
    passive: "Total Mayhem: enemies start each combat with 3 Vulnerable, and Junkrat ignores the first 3 damage of every self-inflicted blast.",
    startingDeck: [
      "junkrat_launcher", "junkrat_launcher", "junkrat_trap", "junkrat_rummage",
      "junkrat_concussive", "junkrat_mine", "junkrat_scatter", "junkrat_armor",
      "junkrat_frag", "junkrat_blast",
    ],
    cardPool: [
      "junkrat_concussive", "junkrat_mine", "junkrat_rpg", "junkrat_scatter",
      "junkrat_frag", "junkrat_blast", "junkrat_loose", "junkrat_scrap", "junkrat_rummage",
    ],
    ultimate: {
      id: "junkrat_riptire",
      name: "RIP-Tire",
      type: "ultimate",
      cost: 0,
      rarity: "rare",
      hero: "junkrat",
      damage: 24,
      aoe: true,
      text: "Deal 24 damage to ALL enemies.",
    },
  },
  moira: {
    id: "moira",
    name: "Moira",
    role: "Biotic",
    maxHp: 65,
    color: "#a855f7",
    asset: moiraImg,
    passive: "Biotic Grasp: whenever your Poison damages an enemy, heal for 30% of that damage.",
    startingDeck: [
      "moira_orb_dmg", "moira_orb_dmg", "moira_grasp", "moira_grasp",
      "moira_orb_heal", "moira_fade", "moira_decay", "moira_surge",
      "moira_contagion", "moira_bloom",
    ],
    cardPool: [
      "moira_decay", "moira_surge", "moira_bloom", "moira_miasma",
      "moira_bioticfield", "moira_rot", "moira_leech", "moira_contagion",
    ],
    ultimate: {
      id: "moira_coalescence",
      name: "Coalescence",
      type: "ultimate",
      cost: 0,
      rarity: "rare",
      hero: "moira",
      beam: { damage: 9, heal: 6, turns: 3 },
      text: "Beam an enemy for 9 damage and heal 6 HP at the start of each of your next 3 turns.",
    },
  },
  doomfist: {
    id: "doomfist",
    name: "Doomfist",
    role: "Tank",
    maxHp: 92,
    color: "#7c3aed",
    asset: doomfistImg,
    passive: "Best Defense: gain 4 Block whenever you play an Attack.",
    startingDeck: [
      "doomfist_punch", "doomfist_punch", "doomfist_slam", "doomfist_slam",
      "doomfist_shield", "doomfist_uppercut", "doomfist_grapple",
      "doomfist_charge", "doomfist_bruise", "doomfist_fortify",
    ],
    cardPool: [
      "doomfist_uppercut", "doomfist_bestdefense", "doomfist_charge",
      "doomfist_quake", "doomfist_executioner", "doomfist_momentum", "doomfist_grapple",
    ],
    ultimate: {
      id: "doomfist_meteor",
      name: "Meteor Strike",
      type: "ultimate",
      cost: 0,
      rarity: "rare",
      hero: "doomfist",
      damage: 18,
      vulnerable: 2,
      aoe: true,
      text: "Deal 18 damage to ALL enemies. Apply 2 Vulnerable.",
    },
  },
};

export const UNLOCKABLE_HEROES = ["junkrat", "doomfist"];
export const STARTER_HEROES = ["tracer", "mercy", "genji", "moira"];
