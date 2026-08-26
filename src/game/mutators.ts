/**
 * Fracture Protocols.
 *
 * Every run is warped by one protocol, chosen at the same moment as the
 * starting relic so it costs no extra screen. Each one bends a global rule
 * hard enough that the whole run plays differently, and each one hurts
 * somewhere else. This is the main source of run-to-run stories: the same
 * hero under OVERLOAD and under BULWARK are not the same character.
 */
export interface Mutator {
  id: string;
  name: string;
  text: string;
  color: string;
  /** flat change to max HP for the run */
  hpMod?: number;
  /** multiplier applied to every enemy's max HP */
  enemyHpMult?: number;
  /** extra Strength every enemy starts combat with */
  enemyStrength?: number;
  /** extra Energy each turn */
  energy?: number;
  /** extra cards drawn each turn */
  draw?: number;
  /** Block granted at the start of every combat */
  startBlock?: number;
  /** Strength granted at the start of every combat */
  startStrength?: number;
  /** multiplier on damage you deal */
  outMult?: number;
  /** multiplier on damage you take */
  inMult?: number;
  /** multiplier on gold rewards */
  goldMult?: number;
  /** multiplier on Ultimate charge gain */
  ultMult?: number;
}

export const MUTATORS: Record<string, Mutator> = {
  overload: {
    id: "overload",
    name: "OVERLOAD PROTOCOL",
    text: "+1 Energy every turn. Every enemy has 18% more HP.",
    color: "#4dd0ff",
    energy: 1,
    enemyHpMult: 1.18,
  },
  bloodpact: {
    id: "bloodpact",
    name: "BLOOD PACT",
    text: "Start every combat with 2 Strength. Lose 26 max HP.",
    color: "#ff3b6b",
    startStrength: 2,
    hpMod: -26,
  },
  bulwark: {
    id: "bulwark",
    name: "BULWARK CODE",
    text: "Start every combat with 14 Block. Your Ultimate charges 40% slower.",
    color: "#8ab4ff",
    startBlock: 14,
    ultMult: 0.6,
  },
  hemorrhage: {
    id: "hemorrhage",
    name: "HEMORRHAGE",
    text: "You deal 28% more damage. You take 30% more damage.",
    color: "#ff7a45",
    outMult: 1.28,
    inMult: 1.3,
  },
  scavenger: {
    id: "scavenger",
    name: "SCAVENGER LOOP",
    text: "Gold rewards are doubled. Every enemy starts with 2 Strength.",
    color: "#ffcc4d",
    goldMult: 2,
    enemyStrength: 2,
  },
  cascade: {
    id: "cascade",
    name: "CASCADE PROTOCOL",
    text: "Draw 1 extra card every turn. Lose 12 max HP.",
    color: "#c084fc",
    draw: 1,
    hpMod: -12,
  },
  martyr: {
    id: "martyr",
    name: "MARTYR CIRCUIT",
    text: "Ultimate charges 50% faster. Enemies hit 15% harder.",
    color: "#54d98c",
    ultMult: 1.5,
    inMult: 1.15,
  },
};

export const MUTATOR_IDS = Object.keys(MUTATORS);
