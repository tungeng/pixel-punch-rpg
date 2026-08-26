import { create } from "zustand";
import type {
  CardInstance,
  EnemyDef,
  EnemyInstance,
  HeroDef,
  MapNode,
  NodeType,
} from "./types";
import { Rng, hashSeed, randomSeed } from "./rng";
import { makeCard, CARDS, NEUTRAL_POOL } from "./cards";
import { HEROES, UNLOCKABLE_HEROES, STARTER_HEROES } from "./heroes";
import { ENEMIES, BOSSES, ACT_BOSSES, enemyPoolFor, elitePoolFor } from "./enemies";
import { RELICS, ALL_RELIC_IDS, DEFAULT_UNLOCKED_RELIC_IDS, pickRelicId, relicUnlockCost, isDropEligible } from "./relics";
import { generateMap } from "./mapgen";
import tracerImg from "../assets/tracer.png";
import kingsrowImg from "../assets/bg_kingsrow.jpg";
import factoryImg from "../assets/bg_factory.jpg";
import { UPGRADES, tierOf, upgradeBonusMaxHp, upgradeCacheRelicChance, upgradeCreditMult, upgradeStartGold } from "./upgrades";
import { MUTATORS, MUTATOR_IDS } from "./mutators";
import { AUGMENTS, augmentPoolFor, makeContract, type ContractState } from "./progression";

export type Phase =
  | "map"
  | "relic_choice"
  | "augment_choice"
  | "combat"
  | "reward"
  | "rest"
  | "shop"
  | "treasure"
  | "dead"
  | "victory";

export interface Float {
  id: number;
  text: string;
  kind: "dmg" | "heal" | "block" | "buff" | "debuff" | "ult";
  target: string; // enemy uid or "player"
  at: number;
}

export interface Combat {
  active: boolean;
  turn: number;
  energy: number;
  maxEnergy: number;
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  vulnerable: number;
  weak: number;
  poison: number;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  enemies: EnemyInstance[];
  ultCharge: number;
  cardsPlayedThisTurn: number;
  attacksPlayedThisTurn: number;
  targetingCardUid: string | null;
  log: string[];
  floats: Float[];
  isBoss: boolean;
  bg: string;
  nodeType: NodeType;
  ultUsedThisCombat: boolean;
  damageTakenThisCombat: number;
  ragePaid: number;
  /** Tracer: Recall Protocol has already rewound this combat. */
  recallUsed?: boolean;
  /** Doomfist: Attacks thrown this combat (Cataclysm). */
  attacksThisCombat?: number;
  overclock: { blockPerEnergy: number; damagePerEnergy: number } | null;
  /** Heal-over-time stacks on the player (Moira). */
  regen: number;
  /** Bonus added to the next Poison application (Moira). */
  poisonBoost: number;
  /** Card type disabled this turn by Sombra's hack. */
  hackedType: "attack" | "skill" | null;
  /** Sombra hacks queued for the upcoming player turn. */
  hackEnergy: boolean;
  hackDraw: boolean;
  /** Active Coalescence beams (Moira ultimate). */
  beams: { targetUid: string; damage: number; heal: number; turns: number }[];
  /** Haste Module relic: first card each turn costs 1 less. */
  firstCardDiscount: boolean;
  /** Reinhardt: persistent Armor that soaks damage after Block and never expires. */
  armor: number;
  /** Bastion: current Configuration. Null for every other hero. */
  stance: import("./types").Stance | null;
  /** Bastion: Configuration changes made this combat. */
  stanceSwaps: number;
  /** Reinhardt: retaliation damage dealt back to attackers this turn. */
  thorns: number;
  /** Chrono Duplicator: the first card of the combat has already been echoed. */
  duplicatorUsed: boolean;
  /** Null Sector Core: the free ultimate has already been spent this combat. */
  freeUltUsed: boolean;
  /** Timeline Fracture: waiting on the player's opening choice. */
  fracturePending: boolean;
  /** Mirror Ward: percent bonus applied to your next Attack this turn. */
  nextAttackPct: number;
  /** Junkrat: self-blast counter for Total Mayhem tuning. */
  junkratBlastCount: number;
  /** Fracture Protocol warping this run's rules. */
  mutator: string | null;
  /** biggest single hit landed this combat, feeds the run highlight reel */
  bestHit: number;
}


export interface RunRecord {
  heroId: string;
  score: number;
  /** one-line "what you'll remember" beat, generated from run stats */
  highlight?: string;
  mutator?: string | null;
  floorsCleared: number;
  act: number;
  fullClear: boolean;
}

/** Final run score. Floors and act carry the most weight, full clears get a big bonus. */
export function computeScore(floorsCleared: number, act: number, gold: number, fullClear: boolean): number {
  return floorsCleared * 100 + act * 500 + gold + (fullClear ? 1000 : 0);
}

export interface HeroStat {
  runs: number;
  wins: number;
  bestScore: number;
  bestFloor: number;
}

export interface MetaStats {
  wins: number;
  losses: number;
  bossKills: number;
  bestScore: number;
  bestHit: number;
  /** fewest floors used to complete a full clear */
  fastestWinFloors: number | null;
  heroes: Record<string, HeroStat>;
}

export function emptyStats(): MetaStats {
  return { wins: 0, losses: 0, bossKills: 0, bestScore: 0, bestHit: 0, fastestWinFloors: null, heroes: {} };
}

export interface GameState {
  // meta (persisted)
  meta: {
    unlockedHeroes: string[];
    /** permanently unlocked relic ids (Relic Codex) */
    unlockedRelics: string[];
    credits: number;
    bestFloor: number;
    totalRuns: number;
    /** permanent Archive upgrades: upgrade id -> purchased tier */
    upgrades: Record<string, number>;
    /** leaderboard display name, asked for once */
    playerName: string;
    /** hero ids that have killed at least one boss (Bastion mastery unlock) */
    bossHeroes?: string[];
    /** lifetime accomplishments shown on the Statistics screen */
    stats?: MetaStats;
  };
  // run
  inRun: boolean;
  seed: number;
  seedLabel: string;
  heroId: string;
  hp: number;
  maxHp: number;
  gold: number;
  deck: CardInstance[];
  relics: string[];
  map: MapNode[];
  currentNodeId: number | null;
  act: number;
  floorsCleared: number;
  /** Fights cleared inside the current act. Drives the difficulty curve. */
  actFloors: number;
  augments: string[];
  /** Fracture Protocol bending this run's rules (paired with the starting relic) */
  mutator: string | null;
  /** protocol paired with each starting relic choice, same index */
  startingMutators: string[];
  /** highlight reel material, surfaced on the run-over screen */
  runStats: { bestHit: number; lowestHp: number; bossKills: number; clutch: boolean };
  augmentTiers: Record<string, number>;
  augmentChoices: string[];
  contract: ContractState;
  contractsCompleted: number;
  phase: Phase;
  rewardChoices: CardInstance[];
  startingRelicChoices: string[];
  rewardGold: number;
  pendingRelic: string | null;
  shopCards: CardInstance[];
  shopRelics: string[];
  combat: Combat | null;
  lastEvent: string;
  /** monotonically bumped each time lastEvent is set, so repeats still re-fire the toast */
  lastEventAt: number;
  /** big centred beat shown over a phase transition (combat cleared, act cleared) */
  banner: { title: string; lines: string[]; tone: "win" | "boss" | "info" } | null;
  /** boss last words, shown briefly over the transition out of a boss fight */
  bossOutro: string | null;
  /** final record of the run that just ended (score screen + leaderboard) */
  lastRun: RunRecord | null;
  scoreSubmitted: boolean;
  // actions
  loadMeta: () => void;
  startRun: (heroId: string, seedLabel?: string) => void;
  rerun: () => void;
  chooseStartingRelic: (relicId: string, index?: number) => void;
  chooseAugment: (augmentId: string) => void;
  enterNode: (nodeId: number) => void;
  startCombat: (nodeType: NodeType, rng: Rng) => void;
  playCard: (uid: string, targetUid?: string) => void;
  selectTarget: (enemyUid: string) => void;
  cancelTarget: () => void;
  endTurn: () => void;
  useUltimate: (targetUid?: string) => void;
  chooseFracture: (option: "block" | "damage" | "draw") => void;
  pickRewardCard: (cardId: string) => void;
  skipReward: () => void;
  restHeal: () => void;
  restUpgrade: (cardUid: string) => void;
  restRecycle: (cardUid: string) => void;
  takeTreasure: (mode?: "salvage" | "breach") => void;
  confirmRelic: () => void;
  buyCard: (index: number) => void;
  buyRelic: (index: number) => void;
  buyRemove: (cardUid: string) => void;
  leaveShop: () => void;
  toMap: () => void;
  abandon: () => void;
  clearBossOutro: () => void;
  clearBanner: () => void;
  setPlayerName: (name: string) => void;
  markScoreSubmitted: () => void;
  buyUpgrade: (id: string) => void;
  unlockRelic: (relicId: string) => void;
  addFloat: (f: Omit<Float, "id" | "at">) => void;
  pruneFloats: () => void;
}

const META_KEY = "overtung_meta_v1";
const LEGACY_META_KEY = "chronobreak_meta_v1";

/**
 * Hard ceiling on relics per run. Collecting the whole vault every run flattened
 * build identity and trivialised acts 2-4, so a satchel now holds ten.
 */
export const MAX_RELICS = 10;


function defaultMeta() {
  return { unlockedHeroes: [...STARTER_HEROES], unlockedRelics: [...DEFAULT_UNLOCKED_RELIC_IDS], credits: 0, bestFloor: 0, totalRuns: 0, upgrades: {} as Record<string, number>, playerName: "", bossHeroes: [] as string[], stats: emptyStats() };
}

let floatId = 1;

function loadMetaFromStorage() {
  if (typeof window === "undefined") return defaultMeta();
  try {
    const raw =
      window.localStorage.getItem(META_KEY) ?? window.localStorage.getItem(LEGACY_META_KEY);
    if (!raw) return defaultMeta();
    const m = { ...defaultMeta(), ...JSON.parse(raw) };
    if (!m.upgrades || typeof m.upgrades !== "object") m.upgrades = {};
    if (!Array.isArray(m.unlockedHeroes)) m.unlockedHeroes = [...STARTER_HEROES];
    if (!Array.isArray(m.bossHeroes)) m.bossHeroes = [];
    m.stats = { ...emptyStats(), ...(m.stats ?? {}) };
    if (!m.stats.heroes || typeof m.stats.heroes !== "object") m.stats.heroes = {};
    // starters are always available (new starter heroes reach old saves too)
    m.unlockedHeroes = Array.from(new Set([...STARTER_HEROES, ...m.unlockedHeroes]));
    if (!Array.isArray(m.unlockedRelics)) m.unlockedRelics = [...DEFAULT_UNLOCKED_RELIC_IDS];
    // relics that were never locked are always available
    m.unlockedRelics = Array.from(new Set([...DEFAULT_UNLOCKED_RELIC_IDS, ...m.unlockedRelics]));
    return m;
  } catch {
    return defaultMeta();
  }
}

function saveMeta(meta: GameState["meta"]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

/** Fold one finished run into the lifetime stat block. */
function withRunStats(
  meta: GameState["meta"],
  r: { heroId: string; win: boolean; score: number; floorsCleared: number; bestHit: number; bossKills: number },
): GameState["meta"] {
  const base = { ...emptyStats(), ...(meta.stats ?? {}) };
  const prev = base.heroes[r.heroId] ?? { runs: 0, wins: 0, bestScore: 0, bestFloor: 0 };
  const stats: MetaStats = {
    wins: base.wins + (r.win ? 1 : 0),
    losses: base.losses + (r.win ? 0 : 1),
    bossKills: base.bossKills + r.bossKills,
    bestScore: Math.max(base.bestScore, r.score),
    bestHit: Math.max(base.bestHit, r.bestHit),
    fastestWinFloors: r.win
      ? Math.min(base.fastestWinFloors ?? Number.MAX_SAFE_INTEGER, r.floorsCleared)
      : base.fastestWinFloors,
    heroes: {
      ...base.heroes,
      [r.heroId]: {
        runs: prev.runs + 1,
        wins: prev.wins + (r.win ? 1 : 0),
        bestScore: Math.max(prev.bestScore, r.score),
        bestFloor: Math.max(prev.bestFloor, r.floorsCleared),
      },
    },
  };
  return { ...meta, stats };
}

function getHero(heroId: string): HeroDef {
  return HEROES[heroId]!;
}

/** Strength gains are doubled by the Singularity Anchor. */
function gainStrength(c: Combat, amount: number, relics: string[]): number {
  const total = relics.includes("singularity_anchor") ? amount * 2 : amount;
  c.strength += total;
  return total;
}

function maxEnergyFor(heroId: string, relics: string[]): number {
  let e = 3;
  if (heroId === "tracer") e += 1;
  if (relics.includes("energy_core")) e += 1;
  if (relics.includes("overclocked_core")) e += 2;
  if (relics.includes("titan_plating")) e -= 1;
  return Math.max(1, e);
}

function drawCountFor(heroId: string, relics: string[]): number {
  let d = 5;
  if (heroId === "genji") d += 1;
  if (relics.includes("draw_charm")) d += 1;
  if (relics.includes("combat_visor")) d += 2;
  return d;
}

/**
 * Per-hero encounter pressure. Sustain kits gain value every extra turn a fight
 * runs, so they face deeper enemy HP pools; burst kits get a shallower curve
 * so their damage window still closes fights.
 */
const HERO_PRESSURE: Record<string, number> = {
  mercy: 0.74,
  moira: 1.2,
  reinhardt: 0.9,
  tracer: 1.06,
  genji: 1.32,
  junkrat: 0.74,
  doomfist: 1.1,
  bastion: 0.98,
};

const HERO_AGGRO: Record<string, number> = {
  mercy: 1,
  moira: 0,
  reinhardt: -1,
  junkrat: -1,
  doomfist: -1,
};


function maxHpFor(heroId: string, relics: string[], act = 0, upgrades?: Record<string, number>): number {
  let h = getHero(heroId).maxHp;
  if (relics.includes("gold_heart")) h += 30;
  if (relics.includes("titan_plating")) h += 55;
  if (relics.includes("combat_visor")) h -= 15;
  h += upgradeBonusMaxHp(upgrades);
  return Math.max(20, h + act * 12);
}


function rngForRun(seed: number, salt: number): Rng {
  return new Rng((seed ^ (salt * 0x9e3779b9)) >>> 0);
}

// ---- damage helpers (mutate combat + enemy) ----
function applyEnemyDamage(
  c: Combat,
  enemy: EnemyInstance,
  base: number,
  charge: { v: number },
  relicPower: boolean,
  ignoreBlock = false,
): number {
  if (enemy.untargetable) return 0;
  let dmg = base + c.strength;
  if (c.weak > 0) dmg = Math.floor(dmg * 0.75);
  if (enemy.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
  // formation: a living Conduit dampens damage dealt to its allies
  const dampened =
    enemy.trait !== "conduit" &&
    c.enemies.some((e) => !e.isDead && e.uid !== enemy.uid && e.trait === "conduit");
  if (dampened) dmg = Math.ceil(dmg * 0.65);
  const outMult = c.mutator ? MUTATORS[c.mutator]?.outMult ?? 1 : 1;
  if (outMult !== 1) dmg = Math.floor(dmg * outMult);
  dmg = Math.max(0, dmg);
  let remaining = dmg;
  if (enemy.block > 0 && !ignoreBlock) {
    const absorbed = Math.min(enemy.block, remaining);
    enemy.block -= absorbed;
    remaining -= absorbed;
  }
  enemy.hp -= remaining;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.isDead = true;
  }
  if (remaining > c.bestHit) c.bestHit = remaining;
  // Ults no longer charge off their own damage, so normal card damage charges faster.
  const ultMult = c.mutator ? MUTATORS[c.mutator]?.ultMult ?? 1 : 1;
  charge.v += dmg * (relicPower ? 2.2 : 1.4) * ultMult;
  return dmg;
}

function applyPlayerDamage(get: () => GameState, c: Combat, base: number, srcStrength: number, srcWeak: number): number {
  let dmg = base + srcStrength;
  if (srcWeak > 0) dmg = Math.floor(dmg * 0.75);
  if (c.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
  const inMult = c.mutator ? MUTATORS[c.mutator]?.inMult ?? 1 : 1;
  if (inMult !== 1) dmg = Math.ceil(dmg * inMult);
  // Bastion: SENTRY bolts him down. He hits more, he gets hit harder.
  if (c.stance === "sentry") dmg = Math.ceil(dmg * 1.15);
  dmg = Math.max(0, dmg);
  let remaining = dmg;
  if (c.block > 0) {
    const absorbed = Math.min(c.block, remaining);
    c.block -= absorbed;
    remaining -= absorbed;
  }
  // Reinhardt: Crusader Armor halves what gets past Block and barely chips away.
  if (remaining > 0 && c.armor > 0) {
    const reduced = Math.min(remaining, Math.ceil(remaining / 2) + Math.floor(c.armor / 8));
    remaining -= reduced;
    c.armor = Math.max(0, c.armor - 1);
  }
  c.hp -= remaining;
  c.damageTakenThisCombat += remaining;
  // Tracer: Recall Protocol rewinds her out of a lethal spiral, once per fight.
  const gs = get();
  if (
    gs.heroId === "tracer" &&
    gs.augments.includes("tracer_accelerant") &&
    !c.recallUsed &&
    c.hp > 0 &&
    c.hp < c.maxHp * 0.4
  ) {
    c.recallUsed = true;
    const t = gs.augmentTiers["tracer_accelerant"] ?? 1;
    const healed = Math.min(12 * t, c.maxHp - c.hp);
    c.hp += healed;
    drawCards(c, 2);
    pushFloat(c, `RECALL +${healed}`, "heal", "player");
    pushLog(c, "Recall Protocol rewinds Tracer out of danger.");
  }
  // thorn mail
  return remaining;
}

/** Does this card deal damage in any form (fixed, random or scaling)? */
export function cardDealsDamage(card: CardInstance): boolean {
  return (
    (card.damage ?? 0) > 0 ||
    !!card.randomDamage ||
    !!card.damagePerDiscard ||
    !!card.damagePerCardPlayed ||
    !!card.damagePerMissingHp ||
    !!card.damagePerBlock ||
    !!card.damagePerDebuff ||
    !!card.poisonDetonate ||
    !!card.damagePerPoison ||
    !!card.consumeRegenDamage ||
    !!card.damagePerArmor ||
    !!card.armorBurst ||
    !!card.damageEqualToBlock ||
    !!card.damagePerStanceSwap
  );
}

/** Cost after dynamic discounts (Genji free-if-attack, Doomfist momentum). */
export function effectiveCost(card: CardInstance, c: Combat): number {
  let cost = card.cost;
  if (card.freeIfAttack && c.attacksPlayedThisTurn > 0) return 0;
  if (card.freeIfCardsPlayed !== undefined && c.cardsPlayedThisTurn >= card.freeIfCardsPlayed) return 0;
  if (card.costPerDamageTaken) {
    cost -= Math.floor(c.damageTakenThisCombat / card.costPerDamageTaken);
  }
  // Haste Module relic
  if (c.firstCardDiscount && c.cardsPlayedThisTurn === 0) cost -= 1;
  return Math.max(0, cost);
}


/** Damage this card would deal right now, before enemy modifiers. */
export function scaledDamage(card: CardInstance, c: Combat, roll?: number): number {
  if (card.randomDamage) return roll ?? card.randomDamage[0];
  let dmg = card.damage ?? 0;
  if (card.damagePerCardPlayed) dmg += card.damagePerCardPlayed * c.cardsPlayedThisTurn;
  if (card.damagePerMissingHp) dmg += Math.floor((c.maxHp - c.hp) / card.damagePerMissingHp);
  if (card.damagePerDiscard) dmg += card.damagePerDiscard * c.discardPile.length;
  if (card.damagePerBlock) dmg += Math.floor(c.block / card.damagePerBlock);
  if (card.damageEqualToBlock) dmg += c.block;
  if (card.damagePerArmor) dmg += Math.floor(c.armor / card.damagePerArmor);
  if (card.armorBurst) dmg += c.armor * card.armorBurst;
  if (card.doubleIfArmor && c.armor >= card.doubleIfArmor) dmg *= 2;
  if (card.damagePerStanceSwap) dmg += card.damagePerStanceSwap * c.stanceSwaps;
  // Bastion: TANK trades all defense for raw output.
  if (c.stance === "tank" && card.type === "attack" && dmg > 0) dmg = Math.floor(dmg * 1.5);
  return dmg;
}

/** Block this card would grant right now. */
export function scaledBlock(card: CardInstance, c: Combat): number {
  let b = card.block ?? 0;
  if (card.blockPerAttackPlayed) b += card.blockPerAttackPlayed * c.attacksPlayedThisTurn;
  if (card.blockFromArmor) b += c.armor;
  if (card.blockPerExhaust) b += card.blockPerExhaust * c.exhaustPile.length;
  if (card.blockPerPoisonedEnemy)
    b += card.blockPerPoisonedEnemy * c.enemies.filter((e) => !e.isDead && e.poison > 0).length;
  if (card.blockPerStanceSwap) b += card.blockPerStanceSwap * c.stanceSwaps;
  // Bastion: RECON keeps the plating loose, TANK welds the vents shut.
  if (c.stance === "recon" && card.type === "skill" && b > 0) b += 3;
  if (c.stance === "tank" && b > 0) b = Math.floor(b * 0.5);
  return b;
}

/** Visual-only: is this card's conditional bonus currently "charged up"? */
export function cardSynergyActive(card: CardInstance, c: Combat): boolean {
  if (card.freeIfAttack && c.attacksPlayedThisTurn > 0) return true;
  if (card.bonusIfAttack && c.attacksPlayedThisTurn > 0) return true;
  if (card.comboCards !== undefined && c.cardsPlayedThisTurn >= card.comboCards) return true;
  if (card.damagePerCardPlayed && c.cardsPlayedThisTurn > 0) return true;
  if (card.damagePerDiscard && c.discardPile.length > 0) return true;
  if ((card.damagePerStanceSwap || card.blockPerStanceSwap) && c.stanceSwaps > 0) return true;
  if (card.damagePerMissingHp && c.hp < c.maxHp) return true;
  if (card.damagePerBlock && c.block >= card.damagePerBlock) return true;
  if (card.blockPerAttackPlayed && c.attacksPlayedThisTurn > 0) return true;
  if (card.hitsPerAttack && c.attacksPlayedThisTurn > 0) return true;
  if (card.bonusHealIfLowHp && c.hp * 2 <= c.maxHp) return true;
  if (card.damagePerDebuff && c.enemies.some((e) => !e.isDead && e.vulnerable + e.weak > 0)) return true;
  if (card.costPerDamageTaken && c.damageTakenThisCombat >= card.costPerDamageTaken) return true;
  if (card.poisonDetonate && c.enemies.some((e) => !e.isDead && e.poison > 0)) return true;
  if (card.poisonSpread && c.enemies.some((e) => !e.isDead && e.poison > 0)) return true;
  if (card.poison && c.poisonBoost > 0) return true;
  const anyPoisoned = c.enemies.some((e) => !e.isDead && e.poison > 0);
  if (card.damagePerPoison && anyPoisoned) return true;
  if (card.healPerPoisonBoard && anyPoisoned) return true;
  if (card.blockPerPoisonedEnemy && anyPoisoned) return true;
  if (card.poisonDouble && anyPoisoned) return true;
  if (card.consumeRegenDamage && c.regen > 0) return true;
  if (card.damagePerArmor && c.armor >= card.damagePerArmor) return true;
  if (card.armorBurst && c.armor > 0) return true;
  if (card.damageEqualToBlock && c.block > 0) return true;
  if (card.freeIfCardsPlayed !== undefined && c.cardsPlayedThisTurn >= card.freeIfCardsPlayed) return true;
  if (card.blockPerExhaust && c.exhaustPile.length > 0) return true;
  if (card.blockToHealRatio && c.block >= card.blockToHealRatio) return true;
  if (card.doubleIfHandEmpty && c.hand.length <= 1) return true;
  if ((card.lowHpStrength || card.lowHpBlock) && c.hp * 2 <= c.maxHp) return true;
  if (card.type === "attack" && c.nextAttackPct > 0) return true;
  if (card.doubleIfArmor && c.armor >= card.doubleIfArmor) return true;
  if (card.blockFromArmor && c.armor > 0) return true;
  if (card.blockToArmor && c.block > 0) return true;
  if (card.armorPerCardPlayed && c.cardsPlayedThisTurn > 0) return true;
  if (card.stealBlockAsArmor && c.enemies.some((e) => !e.isDead && e.block > 0)) return true;
  return false;
}



function pushLog(c: Combat, text: string) {
  c.log.push(text);
  if (c.log.length > 40) c.log.shift();
}

export const useGame = create<GameState>((set, get) => ({
  meta: loadMetaFromStorage(),
  inRun: false,
  seed: 0,
  seedLabel: "",
  heroId: "tracer",
  hp: 70,
  maxHp: 70,
  gold: 0,
  deck: [],
  relics: [],
  map: [],
  currentNodeId: null,
  act: 0,
  floorsCleared: 0,
  actFloors: 0,
  augments: [],
  mutator: null,
  startingMutators: [],
  runStats: { bestHit: 0, lowestHp: 999, bossKills: 0, clutch: false },
  augmentTiers: {},
  augmentChoices: [],
  contract: makeContract(0),
  contractsCompleted: 0,
  phase: "map",
  rewardChoices: [],
  startingRelicChoices: [],
  rewardGold: 0,
  pendingRelic: null,
  shopCards: [],
  shopRelics: [],
  combat: null,
  lastEvent: "",
  lastEventAt: 0,
  banner: null,
  bossOutro: null,
  lastRun: null,
  scoreSubmitted: false,

  loadMeta: () => set({ meta: loadMetaFromStorage() }),

  /** Straight back into the breach with the same hero. No hub round trip. */
  rerun: () => {
    const heroId = get().lastRun?.heroId ?? get().heroId;
    get().startRun(heroId);
  },

  startRun: (heroId, seedLabel) => {
    const label = seedLabel && seedLabel.trim() ? seedLabel.trim() : Math.floor(Math.random() * 999999).toString();
    const seed = hashSeed(label);
    const relics: string[] = [];
    const meta = get().meta;
    const maxHp = maxHpFor(heroId, relics, 0, meta.upgrades);
    const deck = getHero(heroId).startingDeck.map((id) => makeCard(id));
    const rng = rngForRun(seed, 1);
    const map = generateMap(rng);
    const unlocked = new Set(meta.unlockedRelics);
    const byTier = (t: string) =>
      ALL_RELIC_IDS.filter((id) => unlocked.has(id) && (RELICS[id]?.tier ?? "common") === t);
    const startingRelicChoices: string[] = [];
    const uncommons = rng.shuffle(byTier("uncommon"));
    if (uncommons[0]) startingRelicChoices.push(uncommons[0]);
    for (const id of rng.shuffle(byTier("common"))) {
      if (startingRelicChoices.length >= 3) break;
      if (!startingRelicChoices.includes(id)) startingRelicChoices.push(id);
    }
    // Protocols never depend on relic unlocks, so a brand new player still gets
    // a real opening decision (and a run identity) on their very first breach.
    const startingMutators = rng.shuffle([...MUTATOR_IDS]).slice(0, 3);
    while (startingRelicChoices.length < startingMutators.length) startingRelicChoices.push("");
    set({
      inRun: true,
      seed,
      seedLabel: label,
      mutator: null,
      startingMutators,
      runStats: { bestHit: 0, lowestHp: 999, bossKills: 0, clutch: false },
      heroId,
      hp: maxHp,
      maxHp,
      gold: upgradeStartGold(meta.upgrades),
      deck,
      relics,
      map,
      currentNodeId: null,
      act: 0,
      floorsCleared: 0,
      actFloors: 0,
      augments: [],
      augmentTiers: {},
      augmentChoices: [],
      contract: makeContract(seed % 3),
      contractsCompleted: 0,
      phase: "relic_choice",
      startingRelicChoices: rng.shuffle(startingRelicChoices),
      combat: null,
      lastEvent: "",
      lastEventAt: 0,
      banner: null,
    });
  },

  chooseStartingRelic: (relicId, index) => {
    const s = get();
    const idx = index ?? s.startingRelicChoices.indexOf(relicId);
    const relics = relicId ? [relicId] : [];
    const mutator = s.startingMutators[idx] ?? null;
    const maxHp = Math.max(20, maxHpFor(s.heroId, relics, s.act, s.meta.upgrades) + (mutator ? MUTATORS[mutator]?.hpMod ?? 0 : 0));
    set({
      relics,
      mutator,
      maxHp,
      hp: maxHp,
      startingRelicChoices: [],
      startingMutators: [],
      phase: "map",
      lastEvent: `${relicId ? RELICS[relicId]!.name + " equipped. " : ""}${mutator ? MUTATORS[mutator]!.name + " online." : ""}`.trim(),
      lastEventAt: Date.now(),
    });
  },

  chooseAugment: (augmentId) => {
    const s = get();
    if (!s.augmentChoices.includes(augmentId) || !AUGMENTS[augmentId]) return;
    const owned = s.augments.includes(augmentId);
    const tier = (s.augmentTiers[augmentId] ?? 0) + 1;
    const def = AUGMENTS[augmentId]!;
    set({
      augments: owned ? s.augments : [...s.augments, augmentId],
      augmentTiers: { ...s.augmentTiers, [augmentId]: tier },
      augmentChoices: [],
      phase: s.pendingRelic ? "treasure" : "map",
      lastEvent: owned
        ? `${def.name} deepened to Tier ${tier}. The path sharpens.`
        : `Augment installed: ${def.name}. ${def.text}`,
      lastEventAt: Date.now(),
    });
  },

  enterNode: (nodeId) => {
    const s = get();
    const node = s.map.find((n) => n.id === nodeId);
    if (!node) return;
    // must be adjacent to current (or current null + col 0)
    if (node.visited) return;
    set({ currentNodeId: nodeId });
    const rng = rngForRun(s.seed, 1000 + nodeId);
    if (node.type === "combat" || node.type === "elite" || node.type === "boss") {
      get().startCombat(node.type, rng);
    } else if (node.type === "rest") {
      set({ phase: "rest" });
    } else if (node.type === "shop") {
      openShop(set, get, rng);
    } else if (node.type === "treasure") {
      set({ phase: "treasure" });
    }
  },

  startCombat: (nodeType, rng) => {
    const s = get();
    const hero = getHero(s.heroId);
    let enemies: EnemyInstance[] = [];
    let isBoss = false;
    let bossIntro: string | null = null;
    if (nodeType === "boss") {
      const def = BOSSES[ACT_BOSSES[s.act] ?? ACT_BOSSES[ACT_BOSSES.length - 1]!]!;
      enemies = [spawnEnemy(def, rng, `e_${Date.now()}`)];
      isBoss = true;
      bossIntro = def.introLine ?? null;
    } else if (nodeType === "elite") {
      const elitePool = elitePoolFor(s.act);
      const id = rng.pick(elitePool);
      const def = ENEMIES[id]!;
      enemies = [spawnEnemy(def, rng, `e_${Date.now()}_0`)];
      if (rng.chance(0.2 + s.act * 0.1)) {
        const escort = rng.pick(enemyPoolFor(s.act));
        enemies.push(spawnEnemy(ENEMIES[escort]!, rng, `e_${Date.now()}_1`));
      }
    } else {
      const pool = enemyPoolFor(s.act);
      const r = rng.next();
      const count = s.act >= 2 ? (r < 0.4 ? 1 : r < 0.9 ? 2 : 3) : r < 0.25 ? 1 : r < 0.85 ? 2 : 3;
      for (let i = 0; i < count; i++) {
        const id = rng.pick(pool);
        enemies.push(spawnEnemy(ENEMIES[id]!, rng, `e_${Date.now()}_${i}`));
      }
    }
    // Difficulty is anchored to the act, then answers actual build power.
    // Augments, upgraded lean decks and relics should feel exciting, not free.
    const floor = s.actFloors;
    const relicCount = s.relics.length;
    const augmentCount = s.augments.length;
    const upgradedCount = s.deck.filter((card) => card.upgraded).length;
    const leanDeckBonus = s.deck.length < 24 ? (24 - s.deck.length) * 0.012 : 0;
    // Longer fights reward sustain and punish burst, so each hero meets a
    // difficulty curve tuned to how their kit ages across a combat.
    const heroPressure = HERO_PRESSURE[s.heroId] ?? 1;
    // Difficulty should live across the whole route, not in one boss spike.
    // Trash used to die in under two turns while bosses ran seven, so the run
    // was filler punctuated by a wall. Each encounter class now has its own
    // depth: skirmishes are real attrition, elites are puzzles, bosses stay
    // long but hit less brutally per turn.
    const DEPTH = nodeType === "boss" ? (s.act === 0 ? 0.82 : 0.9) : nodeType === "elite" ? 3.02 : 3.16;
    const hpScale =
      DEPTH *
      (1 + s.act * 0.6 + floor * 0.11 + relicCount * 0.06 + augmentCount * 0.1 + upgradedCount * 0.012 + leanDeckBonus) *
      heroPressure;
    // ...and hit softer per turn, so length creates tension instead of coin-flips.
    const pace = nodeType === "boss" ? 0.7 : nodeType === "elite" ? 0.8 : 0.55;
    const strBonus = Math.max(
      0,
      Math.round(
        (Math.floor(floor / 4) +
          Math.round(s.act * 1.1) +
          Math.floor(relicCount / 4) +
          Math.floor(augmentCount / 3) +
          (nodeType === "elite" ? 2 + s.act : 0) +
          (nodeType === "boss" ? 1 + Math.round(s.act * 0.6) : 0) +
          (HERO_AGGRO[s.heroId] ?? 0)) *
          pace,
      ),
    );



    for (const e of enemies) {
      const scaled = Math.round(e.maxHp * hpScale);
      e.hp = scaled;
      e.maxHp = scaled;
      e.strength = strBonus;
    }


    // junkrat passive: enemies start cracked, but not solved.
    if (s.heroId === "junkrat") {
      for (const e of enemies) e.vulnerable = 2;
    }
    const mut = s.mutator ? MUTATORS[s.mutator] : null;
    const maxEnergy = maxEnergyFor(s.heroId, s.relics) + (mut?.energy ?? 0);
    const drawN = drawCountFor(s.heroId, s.relics) + (mut?.draw ?? 0);
    if (mut?.enemyHpMult || mut?.enemyStrength) {
      for (const e of enemies) {
        if (mut.enemyHpMult) {
          e.maxHp = Math.round(e.maxHp * mut.enemyHpMult);
          e.hp = e.maxHp;
        }
        if (mut.enemyStrength) e.strength += mut.enemyStrength;
      }
    }
    const maxHp = s.maxHp;
    let deck = s.deck.map((c) => makeCard(c.id, c.upgraded));
    deck = rng.shuffle(deck);
    const hand = deck.splice(0, drawN);
    const bg = s.act % 2 === 0 ? kingsrowImg : factoryImg;
    const combat: Combat = {
      active: true,
      turn: 1,
      energy: maxEnergy,
      maxEnergy,
      hp: s.hp,
      maxHp,
      block: mut?.startBlock ?? 0,
      strength: mut?.startStrength ?? 0,
      vulnerable: 0,
      weak: 0,
      poison: 0,
      drawPile: deck,
      hand,
      discardPile: [],
      exhaustPile: [],
      enemies,
      ultCharge: 0,
      cardsPlayedThisTurn: 0,
      attacksPlayedThisTurn: 0,
      targetingCardUid: null,
      log: bossIntro
        ? [`Battle start: ${enemies.map((e) => e.name).join(", ")}`, `“${bossIntro}”`]
        : [`Battle start: ${enemies.map((e) => e.name).join(", ")}`],
      floats: [],
      isBoss,
      bg,
      nodeType,
      ultUsedThisCombat: false,
      damageTakenThisCombat: 0,
      overclock: null,
      regen: 0,
      poisonBoost: 0,
      armor: 0,
      stance: s.heroId === "bastion" ? "sentry" : null,
      stanceSwaps: 0,
      ragePaid: 0,
      thorns: 0,
      hackedType: null,
      hackEnergy: false,
      hackDraw: false,
      beams: [],
      firstCardDiscount: s.relics.includes("haste_module"),
      nextAttackPct: 0,
      duplicatorUsed: false,
      freeUltUsed: false,
      fracturePending: s.relics.includes("timeline_fracture"),
      junkratBlastCount: 0,
      mutator: s.mutator,
      bestHit: 0,
    };
    for (const id of s.augments) {
      const a = AUGMENTS[id];
      if (!a) continue;
      // Augments are paths, not a checklist. Deepening one multiplies its
      // payload so committing to an identity beats collecting every option.
      const t = s.augmentTiers[id] ?? 1;
      combat.block += a.block * t;
      combat.strength += a.strength * t;
      combat.energy += a.energy + (t > 2 ? 1 : 0);
      combat.ultCharge += a.ult * t;
      if (a.draw > 0) drawCards(combat, a.draw * t);
      if (id === "rein_crusader") combat.armor += 12 * t;
    }
    combat.ultCharge = Math.min(100, combat.ultCharge);
    // elite modifier: curse enemies hex you the moment the fight opens
    for (const e of enemies) {
      if (e.trait === "curse") {
        combat.weak = Math.max(combat.weak, 1);
        combat.vulnerable = Math.max(combat.vulnerable, 1);
        combat.log.push(`${e.name}'s ${e.traitName ?? "aura"} weakens you.`);
      }
    }
    // ---- relic openers ----
    const R = (id: string) => s.relics.includes(id);
    if (R("barrier_start")) combat.block += 12;
    if (R("chrono_engine")) {
      combat.block += 20;
      drawCards(combat, 1);
    }
    if (R("berserker")) gainStrength(combat, 2, s.relics);
    if (R("execution_chip")) gainStrength(combat, 3, s.relics);
    if (R("ult_battery")) combat.ultCharge = Math.max(combat.ultCharge, 30);
    if (R("war_banner")) for (const e of combat.enemies) e.vulnerable = Math.max(e.vulnerable, 2);
    if (R("hex_emitter")) for (const e of combat.enemies) e.weak = Math.max(e.weak, 2);
    if (combat.block > 0 || combat.strength > 0) {
      combat.log.push("Relics hum to life.");
    }
    set({ combat, phase: "combat" });
  },


  playCard: (uid, targetUid) => {
    const s = get();
    const c = s.combat;
    if (!c || !c.active) return;
    const idx = c.hand.findIndex((x) => x.uid === uid);
    if (idx < 0) return;
    const card = c.hand[idx]!;
    if (c.hackedType && card.type === c.hackedType) {
      pushFloat(c, "HACKED", "debuff", "player");
      pushLog(c, `Sombra's hack blocks your ${c.hackedType} cards this turn.`);
      set({ combat: { ...c } });
      return;
    }
    if (effectiveCost(card, c) > c.energy) return;
    if (card.goldCost && s.gold < card.goldCost) {
      pushFloat(c, "NO GOLD", "debuff", "player");
      pushLog(c, `${card.name} needs ${card.goldCost} gold.`);
      set({ combat: { ...c } });
      return;
    }
    const livingEnemies = c.enemies.filter((e) => !e.isDead && !e.untargetable);
    const needsTarget = cardDealsDamage(card) && !card.aoe && livingEnemies.length > 1;
    if (needsTarget && !targetUid) {
      set({ combat: { ...c, targetingCardUid: uid } });
      return;
    }
    resolveCard(set, get, card, targetUid ?? livingEnemies[0]?.uid ?? null);
  },

  selectTarget: (enemyUid) => {
    const s = get();
    const c = s.combat;
    if (!c || !c.targetingCardUid) return;
    const card = c.hand.find((x) => x.uid === c.targetingCardUid);
    if (!card) return;
    resolveCard(set, get, card, enemyUid);
  },

  cancelTarget: () => {
    const c = get().combat;
    if (c) set({ combat: { ...c, targetingCardUid: null } });
  },

  endTurn: () => {
    const s = get();
    const c = s.combat;
    if (!c || !c.active) return;
    c.hackedType = null;
    // Tracer: Overclock cashes unspent energy into Block + chip damage
    const charge = { v: c.ultCharge };
    const relics = s.relics;
    if (c.overclock && c.energy > 0) {
      const oc = c.overclock;
      const gainedBlock = oc.blockPerEnergy * c.energy;
      const chip = oc.damagePerEnergy * c.energy;
      c.block += gainedBlock;
      pushFloat(c, `+${gainedBlock}`, "block", "player");
      const living = c.enemies.filter((e) => !e.isDead && !e.untargetable);
      if (chip > 0 && living.length > 0) {
        const rng = new Rng(hashSeed(`${s.seed}_oc_${c.turn}`));
        const t = rng.pick(living)!;
        const dealt = applyEnemyDamage(c, t, chip, charge, relics.includes("power_cell"));
        pushFloat(c, `${dealt}`, "dmg", t.uid);
      }
      pushLog(c, `Overclock burns ${c.energy} Energy.`);
      c.energy = 0;
    }
    c.overclock = null;
    // discard hand (non-retain)
    const retain = c.hand.filter((card) => card.retain);
    const discard = c.hand.filter((card) => !card.retain);
    c.discardPile = [...c.discardPile, ...discard];
    c.hand = retain;
    // enemy phase

    // ---- act boss mechanics ----
    for (const e of c.enemies) {
      if (e.isDead || !e.mechanic) continue;
      if (e.mechanic === "wraith") {
        if (c.turn % 3 === 0) {
          const healed = Math.max(1, Math.floor((e.maxHp - e.hp) * 0.25));
          e.hp = Math.min(e.maxHp, e.hp + healed);
          e.untargetable = true;
          pushFloat(c, `+${healed}`, "heal", e.uid);
          pushLog(c, "Reaper slips into WRAITH FORM. He cannot be targeted.");
        } else {
          e.untargetable = false;
        }
      }
      if (e.mechanic === "venom") {
        c.poison += 2;
        c.weak = Math.max(c.weak, 2);
        pushFloat(c, "VENOM", "debuff", "player");
      }
      if (e.mechanic === "gravity" && c.turn % 2 === 0) {
        scrambleHand(c);
        pushLog(c, "Gravitic Flux warps a card in your hand.");
      }
      if (e.mechanic === "stealth") {
        if (c.turn % 3 === 0) {
          e.untargetable = true;
          e.block += 8;
          pushFloat(c, "STEALTH", "buff", e.uid);
          pushLog(c, "Sombra vanishes into STEALTH PROTOCOL. Attacks cannot find her.");
        } else if (e.untargetable) {
          e.untargetable = false;
          const hackRng = new Rng(hashSeed(`${s.seed}_hack_${c.turn}`));
          c.hackedType = hackRng.int(0, 1) === 0 ? "attack" : "skill";
          pushFloat(c, "HACKED", "debuff", "player");
          pushLog(c, `Sombra reappears and hacks your ${c.hackedType} cards.`);
        }
      }
      if (e.mechanic === "phase" && !e.enraged && e.hp <= e.maxHp * 0.5) {
        e.enraged = true;
        e.strength += 5;
        e.block += 20;
        pushFloat(c, "COALESCENCE", "buff", e.uid);
        pushLog(c, "Moira drops her barrier and burns biotic energy.");
      }
    }
    // ---- damage-over-time on enemies (Moira) ----
    let dotHeal = 0;
    for (const e of c.enemies) {
      if (e.isDead || e.poison <= 0) continue;
      const tick = e.poison;
      e.hp -= tick;
      pushFloat(c, `-${tick}`, "dmg", e.uid);
      dotHeal += tick;
      if (e.hp <= 0) {
        e.hp = 0;
        e.isDead = true;
        if (s.heroId === "moira" && s.augments.includes("moira_adaptation")) {
          const gained = gainStrength(c, 1, relics);
          pushFloat(c, `+${gained} STR`, "buff", "player");
        }
      }
      // Moira's venom does not fade. Her runs are about stacking rot that
      // compounds every turn, which is the whole point of playing her.
      if (s.heroId !== "moira") e.poison -= 1;
    }
    if (dotHeal > 0) {
      pushLog(c, `Poison deals ${dotHeal} damage.`);
      // Moira's Biotic Grasp: her damage-over-time feeds her back
      if (s.heroId === "moira") {
        const healed = Math.min(c.maxHp - c.hp, Math.ceil(dotHeal * 0.5));
        if (healed > 0) {
          c.hp += healed;
          pushFloat(c, `+${healed}`, "heal", "player");
        }
      }
    }
    if (c.enemies.every((e) => e.isDead)) {
      c.active = false;
      handleCombatWin(set, get);
      set({ combat: { ...c } });
      return;
    }
    // hack moves queue penalties for the upcoming player turn
    for (const e of c.enemies) {
      if (e.isDead) continue;
      if (e.intent.hack === "energy") c.hackEnergy = true;
      if (e.intent.hack === "draw") c.hackDraw = true;
    }
    const summonRng = new Rng(hashSeed(`${get().seed}_summon_${c.turn}`));
    for (const e of c.enemies) {
      if (e.isDead) continue;
      e.block = 0; // reset block before acting
      const intent = e.intent;
      if (intent.type === "attack" || intent.type === "attack_block") {
        const hits = intent.hits ?? 1;
        for (let h = 0; h < hits; h++) {
          if (c.hp <= 0) break;
          const taken = applyPlayerDamage(get, c, intent.damage ?? 0, e.strength, e.weak);
          charge.v += taken * 1.5;
          if (e.trait === "leech" && taken > 0) {
            const drained = Math.min(e.maxHp - e.hp, Math.ceil(taken * 0.35));
            if (drained > 0) {
              e.hp += drained;
              pushFloat(c, `+${drained}`, "heal", e.uid);
            }
          }
          if (relics.includes("thorn_mail") && taken > 0) {
            e.hp -= 4;
            pushFloat(c, "4", "dmg", e.uid);
            if (e.hp <= 0) { e.hp = 0; e.isDead = true; }
          }
          // Reinhardt: Barbed Bulwark retaliates against attackers
          if (c.thorns > 0 && taken >= 0) {
            e.hp -= c.thorns;
            pushFloat(c, `${c.thorns}`, "dmg", e.uid);
            if (e.hp <= 0) { e.hp = 0; e.isDead = true; }
          }
          if (relics.includes("static_shell") && taken > 0) {
            c.block += 3;
            pushFloat(c, "+3", "block", "player");
          }

        }
        pushFloat(c, `${intent.damage ?? 0}`, "dmg", "player");
      }
      if (intent.type === "block" || intent.type === "attack_block") {
        e.block += intent.block ?? 0;
      }
      if (intent.type === "buff") {
        e.strength += intent.strength ?? 0;
        pushFloat(c, `+${intent.strength ?? 0} STR`, "buff", e.uid);
      }
      if (intent.type === "debuff") {
        if (intent.weak) c.weak = Math.max(c.weak, intent.weak);
        if (intent.vulnerable) c.vulnerable = Math.max(c.vulnerable, intent.vulnerable);
        if (intent.poison) {
          c.poison += intent.poison;
          pushFloat(c, `+${intent.poison} PSN`, "debuff", "player");
        }
      }
      if (intent.type === "summon") {
        const alive = c.enemies.filter((x) => !x.isDead).length;
        const sdef = intent.summonId ? ENEMIES[intent.summonId] : undefined;
        if (sdef && alive < 3) {
          const add = spawnEnemy(sdef, summonRng, `add_${Date.now()}_${alive}`);
          const scaled = Math.round(add.maxHp * 0.85);
          add.hp = scaled;
          add.maxHp = scaled;
          add.strength = Math.max(0, e.strength - 1);
          c.enemies.push(add);
          pushFloat(c, "SUMMON", "buff", e.uid);
          pushLog(c, `${e.name} assembles a ${add.name}.`);
        } else {
          e.block += 6;
        }
      }
      // ---- persistent enemy traits ----
      if (e.trait === "rampage" && c.turn % 2 === 0) {
        e.strength += 1;
        pushFloat(c, "+1 STR", "buff", e.uid);
      }
      if (e.trait === "regen" && e.hp < e.maxHp) {
        const healed = Math.min(e.maxHp - e.hp, Math.max(2, Math.round(e.maxHp * 0.025)));
        e.hp += healed;
        pushFloat(c, `+${healed}`, "heal", e.uid);
      }
      if (e.trait === "aegis" && c.turn % 2 === 1) e.block += Math.round(2 + e.maxHp * 0.02);
      // ---- formation traits: enemies that support each other ----
      if (e.trait === "guardian") {
        const allies = c.enemies.filter((x) => !x.isDead && x.uid !== e.uid);
        const ward = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (ward) {
          const shield = 6 + Math.round(e.maxHp * 0.08);
          ward.block += shield;
          pushFloat(c, `+${shield} 🛡`, "block", ward.uid);
          pushLog(c, `${e.name} covers ${ward.name} for ${shield} Block.`);
        }
      }
      if (e.trait === "mender") {
        const allies = c.enemies.filter((x) => !x.isDead && x.uid !== e.uid && x.hp < x.maxHp);
        if (allies.length > 0) {
          const amount = 4 + Math.round(e.maxHp * 0.06);
          for (const a of allies) {
            const healed = Math.min(a.maxHp - a.hp, amount);
            a.hp += healed;
            pushFloat(c, `+${healed}`, "heal", a.uid);
          }
          pushLog(c, `${e.name} repairs its allies for ${amount}.`);
        }
      }
    }
    c.ultCharge = Math.min(100, charge.v);
    // Fracture Surge: long fights are meant to be tense, not safe. From turn 6
    // on, the rift feeds the enemy line so stalling stops being a strategy.
    if (c.turn >= 5) {
      const surge = 1 + Math.floor((c.turn - 5) / 2);
      for (const e of c.enemies) {
        if (e.isDead) continue;
        e.strength += surge;
      }
      pushFloat(c, "SURGE", "buff", "player");
      pushLog(c, `The fracture surges. Enemies gain ${surge} Strength.`);
    }
    // advance enemy intents
    for (const e of c.enemies) {
      if (e.isDead) continue;
      e.moveIndex = (e.moveIndex + 1) % (BOSSES[e.defId]?.moves.length ?? ENEMIES[e.defId]?.moves.length ?? 1);
      const moves = BOSSES[e.defId]?.moves ?? ENEMIES[e.defId]?.moves ?? [];
      e.intent = moves[e.moveIndex] ?? moves[0]!;
    }
    // decrement enemy statuses
    for (const e of c.enemies) {
      if (e.vulnerable > 0) e.vulnerable -= 1;
      if (e.weak > 0) e.weak -= 1;
    }
    pushLog(c, `--- Turn ${c.turn} enemy phase ---`);
    // check death
    if (c.hp <= 0) {
      // soul stone revive
      if (relics.includes("soul_stone") && !c.ultUsedThisCombat) {
        c.ultUsedThisCombat = true;
        c.hp = Math.floor(c.maxHp * 0.5);
        c.block = 0;
        pushLog(c, "Soul Stone revives you!");
      } else {
        c.hp = 0;
        c.active = false;
        handleDeath(set, get);
        set({ combat: { ...c } });
        return;
      }
    }
    // start player turn
    c.turn += 1;
    // Doomfist: The Rising Uppercut. Pain fuels permanent Strength.
    if (s.heroId === "doomfist") {
      const rageThreshold = s.augments.includes("doom_rising") ? Math.max(4, 10 - 2 * (s.augmentTiers["doom_rising"] ?? 1)) : 12;
      const owed = Math.floor(c.damageTakenThisCombat / rageThreshold) - (c.ragePaid ?? 0);
      if (owed > 0) {
        c.ragePaid = (c.ragePaid ?? 0) + owed;
        const gained = gainStrength(c, owed, relics);
        pushFloat(c, `+${gained} STR`, "buff", "player");
        pushLog(c, `Doomfist answers the pain. +${gained} Strength.`);
      }
    }
    // Reinhardt: Crusader Plating forges leftover Block into permanent Armor
    if (s.heroId === "reinhardt" && c.block >= 2) {
      const forged = Math.floor(c.block / 2);
      c.armor += forged;
      pushFloat(c, `+${forged} ARM`, "block", "player");
      pushLog(c, `Crusader Plating forges ${forged} Armor from leftover Block.`);
    }
    if (s.heroId === "reinhardt" && s.augments.includes("rein_barrier") && c.armor > 0) {
      const projected = Math.min(18, Math.ceil(c.armor / 2));
      c.block += projected;
      pushFloat(c, `+${projected}`, "block", "player");
    }
    // Aegis Loop keeps half your Block instead of wiping it
    c.block = relics.includes("aegis_loop") ? Math.floor(c.block / 2) : 0;
    c.thorns = 0;
    if (s.heroId === "reinhardt" && s.augments.includes("rein_honor") && c.armor > 0) {
      const bite = Math.ceil((c.armor / 4) * (s.augmentTiers["rein_honor"] ?? 1));
      c.thorns += bite;
      pushFloat(c, `RETALIATE ${bite}`, "buff", "player");
    }
    c.recallUsed = c.recallUsed ?? false;
    // ---- per-turn relic ticks ----
    if (relics.includes("dragon_ember")) {
      gainStrength(c, 1, relics);
      pushFloat(c, "+1 STR", "buff", "player");
    }
    if (relics.includes("volt_capacitor")) {
      const living = c.enemies.filter((e) => !e.isDead && !e.untargetable);
      if (living.length > 0) {
        const vRng = new Rng(hashSeed(`${s.seed}_volt_${c.turn}`));
        const t = vRng.pick(living)!;
        const vCharge = { v: c.ultCharge };
        const dealt = applyEnemyDamage(c, t, 5, vCharge, relics.includes("power_cell"));
        c.ultCharge = Math.min(100, vCharge.v);
        pushFloat(c, `${dealt}`, "dmg", t.uid);
        pushLog(c, "Volt Capacitor arcs out.");
      }
    }
    if (c.enemies.every((e) => e.isDead)) {
      c.active = false;
      handleCombatWin(set, get);
      set({ combat: { ...c } });
      return;
    }



    if (c.poison > 0) {
      c.hp -= c.poison;
      pushFloat(c, `-${c.poison}`, "dmg", "player");
      pushLog(c, `Venom deals ${c.poison} damage.`);
      c.poison -= 1;
      if (c.hp <= 0) {
        c.hp = 0;
        c.active = false;
        handleDeath(set, get);
        set({ combat: { ...c } });
        return;
      }
    }
    if (c.vulnerable > 0) c.vulnerable -= 1;
    if (c.weak > 0) c.weak -= 1;
    // Moira: heal-over-time ticks and decays like poison
    if (c.regen > 0) {
      const healed = Math.min(c.maxHp - c.hp, c.regen);
      if (healed > 0) {
        c.hp += healed;
        pushFloat(c, `+${healed}`, "heal", "player");
      }
      pushLog(c, `Regeneration restores ${healed} HP.`);
      c.regen -= 1;
    }
    // Moira: Coalescence beams keep burning and healing
    if (c.beams.length > 0) {
      const beamCharge = { v: c.ultCharge };
      for (const beam of c.beams) {
        const target =
          c.enemies.find((e) => e.uid === beam.targetUid && !e.isDead && !e.untargetable) ??
          c.enemies.find((e) => !e.isDead && !e.untargetable);
        if (target) {
          const dealt = applyEnemyDamage(c, target, beam.damage, beamCharge, relics.includes("power_cell"));
          pushFloat(c, `${dealt}`, "dmg", target.uid);
        }
        const healed = Math.min(c.maxHp - c.hp, beam.heal);
        if (healed > 0) {
          c.hp += healed;
          pushFloat(c, `+${healed}`, "heal", "player");
        }
        beam.turns -= 1;
      }
      c.ultCharge = Math.min(100, beamCharge.v);
      c.beams = c.beams.filter((b) => b.turns > 0);
      pushLog(c, "Coalescence burns on.");
      if (c.enemies.every((e) => e.isDead)) {
        c.active = false;
        handleCombatWin(set, get);
        set({ combat: { ...c } });
        return;
      }
    }
    const maxEnergy = maxEnergyFor(s.heroId, relics);
    c.maxEnergy = maxEnergy;
    c.energy = c.hackEnergy ? Math.max(1, maxEnergy - 1) : maxEnergy;
    if (relics.includes("reactor_surge") && c.turn % 2 === 0) {
      c.energy += 2;
      pushFloat(c, "+2 EN", "buff", "player");
    }
    if (c.hackEnergy) pushLog(c, "Hacked. You lose 1 Energy this turn.");
    c.cardsPlayedThisTurn = 0;
    c.attacksPlayedThisTurn = 0;
    c.nextAttackPct = 0;
    // draw
    let drawN = drawCountFor(s.heroId, relics);
    if (c.hackDraw) {
      drawN = Math.max(2, drawN - 2);
      pushLog(c, "Hacked. You draw fewer cards this turn.");
    }
    c.hackEnergy = false;
    c.hackDraw = false;
    if (c.stance === "recon") drawN += 1;
    drawCards(c, drawN);
    // passive heals
    if (s.heroId === "mercy") {
      const before = c.hp;
      c.hp = Math.min(c.maxHp, c.hp + 2);
      const healed = c.hp - before;
      if (healed > 0) {
        pushFloat(c, `+${healed}`, "heal", "player");
        pushLog(c, `Mercy's staff mends ${healed} HP.`);
        if (s.augments.includes("mercy_caduceus")) {
          c.block += 1;
          pushFloat(c, "+1", "block", "player");
        }
        if (s.augments.includes("mercy_bluebeam")) c.nextAttackPct += 10 * (s.augmentTiers["mercy_bluebeam"] ?? 1);
        if (s.augments.includes("mercy_valkyrie")) c.ultCharge = Math.min(100, c.ultCharge + 3 * (s.augmentTiers["mercy_valkyrie"] ?? 1));
      }
    }

    if (relics.includes("overclocked_core")) {
      c.hp -= 1;
      pushFloat(c, "1", "dmg", "player");
      pushLog(c, "Overclocked Core burns 1 HP.");
      if (c.hp <= 0) {
        c.hp = 0;
        c.active = false;
        handleDeath(set, get);
        set({ combat: { ...c } });
        return;
      }
    }
    if (relics.includes("regen_drone")) {
      const healed = Math.min(c.maxHp - c.hp, 2);
      if (healed > 0) {
        c.hp += healed;
        pushFloat(c, `+${healed}`, "heal", "player");
      }
    }
    set({ combat: { ...c } });
  },


  useUltimate: (targetUid) => {
    const s = get();
    const c = s.combat;
    const freeUlt = !!c && s.relics.includes("null_sector_core") && !c.freeUltUsed;
    if (!c || !c.active || (c.ultCharge < 100 && !freeUlt)) return;
    const hero = getHero(s.heroId);
    const ult = { ...hero.ultimate, uid: `ult_${c.turn}`, upgraded: false } as CardInstance;
    const chargeBefore = c.ultCharge;
    c.ultCharge = 0;
    const living = c.enemies.filter((e) => !e.isDead);
    const needsTarget = ((ult.damage ?? 0) > 0 || !!ult.beam) && !ult.aoe && living.length > 1;
    if (needsTarget && !targetUid) {
      resolveCard(set, get, ult, living[0]?.uid ?? null, true);
    } else {
      resolveCard(set, get, ult, targetUid ?? living[0]?.uid ?? null, true);
    }
    if (freeUlt) {
      const after = get().combat;
      if (after) {
        after.freeUltUsed = true;
        after.ultCharge = chargeBefore;
        pushLog(after, "Null Sector Core fires the Ultimate for free.");
        set({ combat: { ...after } });
      }
    }
  },

  chooseFracture: (option) => {
    const s = get();
    const c = s.combat;
    if (!c || !c.active || !c.fracturePending) return;
    c.fracturePending = false;
    if (option === "block") {
      c.block += 40;
      pushFloat(c, "+40", "block", "player");
      pushLog(c, "Timeline Fracture braces the line. +40 Block.");
    } else if (option === "damage") {
      const charge = { v: c.ultCharge };
      for (const e of c.enemies.filter((x) => !x.isDead && !x.untargetable)) {
        const dealt = applyEnemyDamage(c, e, 15, charge, s.relics.includes("power_cell"));
        pushFloat(c, `${dealt}`, "dmg", e.uid);
      }
      c.ultCharge = Math.min(100, charge.v);
      pushLog(c, "Timeline Fracture collapses on the enemy line.");
      if (c.enemies.every((e) => e.isDead)) {
        c.active = false;
        handleCombatWin(set, get);
        set({ combat: { ...c } });
        return;
      }
    } else {
      drawCards(c, 3);
      pushLog(c, "Timeline Fracture pulls 3 cards forward.");
    }
    set({ combat: { ...c } });
  },

  pickRewardCard: (cardId) => {
    const s = get();
    const card = makeCard(cardId);
    const deck = [...s.deck, card];
    set({ deck, phase: "map", pendingRelic: null, lastEvent: `${card.name} added to your deck.`, lastEventAt: Date.now() });
    markNodeVisited(set, get);
  },

  skipReward: () => {
    const s = get();
    const stabilizeRoll = Math.abs((s.seed + s.floorsCleared * 17) % 100);
    const candidates = stabilizeRoll < 45 ? s.deck.filter((c) => !c.upgraded) : [];
    const chosen = candidates.length > 0
      ? candidates[Math.abs((s.seed + s.floorsCleared * 31) % candidates.length)]
      : undefined;
    const deck = chosen
      ? s.deck.map((c) => (c.uid === chosen.uid ? makeCard(c.id, true) : c))
      : s.deck;
    const bonusGold = chosen ? 0 : 18;
    set({ deck, gold: s.gold + bonusGold, phase: "map", pendingRelic: null, lastEventAt: Date.now(),
      lastEvent: chosen
        ? `Deck stabilized: ${chosen.name} permanently upgraded.`
        : "No card worth stabilizing. Salvaged 18 gold instead." });
    markNodeVisited(set, get);
  },


  restHeal: () => {
    const s = get();
    const heal = Math.floor(s.maxHp * 0.3);
    const healed = Math.min(s.maxHp, s.hp + heal) - s.hp;
    set({ hp: Math.min(s.maxHp, s.hp + heal), phase: "map", lastEvent: `Rested. Recovered ${healed} HP.`, lastEventAt: Date.now() });
    markNodeVisited(set, get);
  },

  restUpgrade: (cardUid) => {
    const s = get();
    const target = s.deck.find((c) => c.uid === cardUid);
    const deck = s.deck.map((c) => (c.uid === cardUid && !c.upgraded ? makeCard(c.id, true) : c));
    set({ deck, phase: "map", lastEvent: target ? `${target.name} upgraded to ${target.name}+.` : "Card upgraded.", lastEventAt: Date.now() });
    markNodeVisited(set, get);
  },

  restRecycle: (cardUid) => {
    const s = get();
    if (s.deck.length <= 6 || !s.deck.some((c) => c.uid === cardUid)) return;
    const deck = s.deck.filter((c) => c.uid !== cardUid);
    const maxHp = s.maxHp + 4;
    set({ deck, maxHp, hp: Math.min(maxHp, s.hp + 4), phase: "map", lastEvent: `Card scrapped. Deck is leaner and Max HP is now ${maxHp}.`, lastEventAt: Date.now() });
    markNodeVisited(set, get);
  },

  takeTreasure: (mode) => {
    const s = get();
    const owned = new Set(s.relics);
    const unlocked = new Set(s.meta.unlockedRelics);
    const avail = ALL_RELIC_IDS.filter((r) => unlocked.has(r) && !owned.has(r) && isDropEligible(r));
    if (avail.length === 0 || s.relics.length >= MAX_RELICS) {
      // full satchel: the cache pays out in gold instead
      set({ phase: "map", gold: s.gold + 60, lastEvent: "Satchel full. Cache converted to 60 gold.", lastEventAt: Date.now() });
      markNodeVisited(set, get);
      return;
    }

    const rng = rngForRun(s.seed, 5000 + s.floorsCleared);
    if (mode === "salvage") {
      // Hero cards carry the run's identity, so they are offered twice as often as
  // the generic pool. Neutral value cards should season a build, not define it.
  const heroPool = getHero(s.heroId).cardPool;
  const pool = [...heroPool, ...heroPool, ...NEUTRAL_POOL];
      const choices = rng.shuffle(pool).slice(0, 3).map((id) => makeCard(id, true));
      set({ phase: "reward", rewardChoices: choices, rewardGold: 0, lastEvent: "Cache salvaged safely. Pick an upgraded card.", lastEventAt: Date.now() });
      return;
    }
    if (mode === "breach") {
      const damage = Math.max(1, Math.floor(s.maxHp * 0.12));
      set({ hp: Math.max(1, s.hp - damage), lastEvent: `Cache forced open. Took ${damage} damage.`, lastEventAt: Date.now() });
    }
    // caches usually hold a relic; otherwise they pay out a card choice
    if (mode !== "breach" && !rng.chance(Math.max(0.55, upgradeCacheRelicChance()))) {

      // scanner missed: cache yields a card reward instead
      // Hero cards carry the run's identity, so they are offered twice as often as
  // the generic pool. Neutral value cards should season a build, not define it.
  const heroPool = getHero(s.heroId).cardPool;
  const pool = [...heroPool, ...heroPool, ...NEUTRAL_POOL];
      const remaining = [...pool];
      const choices: CardInstance[] = [];
      for (let i = 0; i < 3 && remaining.length > 0; i++) {
        const id = rng.pick(remaining);
        remaining.splice(remaining.indexOf(id), 1);
        choices.push(makeCard(id, rng.chance(0.12)));
      }
      set({ phase: "reward", rewardChoices: choices, rewardGold: 0 });
      return;
    }
    const relic = pickRelicId(avail, rng.next()) ?? rng.pick(avail);
    // hold on the treasure screen so the player sees what they got
    set({ relics: [...s.relics, relic], pendingRelic: relic });
  },


  confirmRelic: () => {
    const s = get();
    const maxHp = maxHpFor(s.heroId, s.relics, s.act, s.meta.upgrades);
    const gained = s.pendingRelic ? RELICS[s.pendingRelic] : null;
    set({
      pendingRelic: null,
      phase: "map",
      maxHp,
      hp: Math.min(s.hp, maxHp),
      lastEvent: gained ? `${gained.name} equipped. ${gained.text}` : "",
      lastEventAt: Date.now(),
    });
    markNodeVisited(set, get);
  },


  buyCard: (index) => {
    const s = get();
    const card = s.shopCards[index];
    if (!card) return;
    const cost = cardPrice(card);
    if (s.gold < cost) return;
    set({
      gold: s.gold - cost,
      deck: [...s.deck, card],
      shopCards: s.shopCards.filter((_, i) => i !== index),
      lastEvent: `Bought ${card.name} for ${cost} gold.`,
      lastEventAt: Date.now(),
    });
  },

  buyRelic: (index) => {
    const s = get();
    const relicId = s.shopRelics[index];
    if (!relicId) return;
    if (s.relics.includes(relicId)) return;
    if (s.relics.length >= MAX_RELICS) return;
    const cost = relicPrice(relicId);
    if (s.gold < cost) return;
    const relics = [...s.relics, relicId];
    const newMax = maxHpFor(s.heroId, relics, s.act, s.meta.upgrades);
    set({
      gold: s.gold - cost,
      relics,
      hp: Math.min(s.hp, newMax),
      maxHp: newMax,
      shopRelics: s.shopRelics.map((r, i) => (i === index ? "" : r)),
      lastEvent: `${RELICS[relicId]!.name} equipped. ${RELICS[relicId]!.text}`,
      lastEventAt: Date.now(),
    });

  },

  buyRemove: (cardUid) => {
    const s = get();
    if (s.gold < 75) return;
    if (s.deck.length <= 5) return; // never let the deck get unplayably small
    const gone = s.deck.find((c) => c.uid === cardUid);
    set({
      gold: s.gold - 75,
      deck: s.deck.filter((c) => c.uid !== cardUid),
      lastEvent: gone ? `${gone.name} removed from your deck.` : "Card removed.",
      lastEventAt: Date.now(),
    });
  },

  leaveShop: () => {
    set({ phase: "map" });
    markNodeVisited(set, get);
  },

  toMap: () => set({ phase: "map" }),

  buyUpgrade: (id) => {
    const s = get();
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return;
    const tier = tierOf(s.meta.upgrades, id);
    if (tier >= def.maxTier) return;
    const cost = def.costs[tier]!;
    if (s.meta.credits < cost) return;
    const meta = {
      ...s.meta,
      credits: s.meta.credits - cost,
      upgrades: { ...s.meta.upgrades, [id]: tier + 1 },
    };
    saveMeta(meta);
    set({ meta });
  },

  unlockRelic: (relicId) => {
    const s = get();
    if (!RELICS[relicId]) return;
    if (s.meta.unlockedRelics.includes(relicId)) return;
    const cost = relicUnlockCost(relicId);
    if (s.meta.credits < cost) return;
    const meta = {
      ...s.meta,
      credits: s.meta.credits - cost,
      unlockedRelics: [...s.meta.unlockedRelics, relicId],
    };
    saveMeta(meta);
    set({ meta });
  },

  clearBossOutro: () => set({ bossOutro: null }),

  clearBanner: () => set({ banner: null }),

  setPlayerName: (name) => {
    const meta = { ...get().meta, playerName: name.slice(0, 16) };
    saveMeta(meta);
    set({ meta });
  },

  markScoreSubmitted: () => set({ scoreSubmitted: true }),

  abandon: () => {
    set({ inRun: false, combat: null, phase: "map" });
  },

  addFloat: (f) => {
    const c = get().combat;
    if (!c) return;
    c.floats.push({ ...f, id: floatId++, at: Date.now() });
    if (c.floats.length > 10) c.floats = c.floats.slice(-10);
    set({ combat: { ...c } });
  },

  pruneFloats: () => {
    const c = get().combat;
    if (!c) return;
    const now = Date.now();
    const next = c.floats.filter((f) => now - f.at < 900);
    if (next.length !== c.floats.length) set({ combat: { ...c, floats: next } });
  },
}));

// ---------------- helpers ----------------
function spawnEnemy(def: EnemyDef, rng: Rng, uidBase: string): EnemyInstance {
  const hp = def.isBoss ? def.hp[0] : rng.int(def.hp[0], def.hp[1]);
  const moveIndex = rng.int(0, def.moves.length - 1);
  return {
    uid: `${uidBase}_${rng.int(0, 99999)}`,
    defId: def.id,
    name: def.name,
    asset: def.asset,
    isBoss: !!def.isBoss,
    isElite: def.isElite,
    trait: def.trait,
    traitName: def.traitName,
    mechanic: def.mechanic,
    mechanicName: def.mechanicName,
    untargetable: false,
    enraged: false,
    poison: 0,
    hp,
    maxHp: hp,
    block: 0,
    strength: 0,
    vulnerable: 0,
    weak: 0,
    moveIndex,
    intent: def.moves[moveIndex]!,
    isDead: false,
  };
}


function drawCards(c: Combat, n: number) {
  for (let i = 0; i < n; i++) {
    if (c.drawPile.length === 0) {
      if (c.discardPile.length === 0) break;
      c.drawPile = shuffleInPlace(c.discardPile);
      c.discardPile = [];
    }
    const card = c.drawPile.shift();
    if (card) c.hand.push(card);
  }
}

function shuffleInPlace(arr: CardInstance[]): CardInstance[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}

function pushFloat(c: Combat, text: string, kind: Float["kind"], target: string) {
  c.floats.push({ id: floatId++, text, kind, target, at: Date.now() });
  if (c.floats.length > 10) c.floats = c.floats.slice(-10);
}

function resolveCard(
  set: any,
  get: () => GameState,
  card: CardInstance,
  targetUid: string | null,
  isUlt = false,
  echo = false,
) {
  const s = get();
  const c = s.combat!;
  const relics = s.relics;
  const powerCell = relics.includes("power_cell");
  const charge = { v: c.ultCharge };
  // damage / combo scaling read the board BEFORE this card counts itself
  const rollRng =
    card.randomDamage || card.randomHits
      ? new Rng(hashSeed(`${s.seed}_${card.uid}_${c.turn}_${c.cardsPlayedThisTurn}`))
      : null;
  const roll = card.randomDamage && rollRng ? rollRng.int(card.randomDamage[0], card.randomDamage[1]) : undefined;
  const hitRoll = card.randomHits && rollRng ? rollRng.int(card.randomHits[0], card.randomHits[1]) : undefined;
  const scaled = scaledDamage(card, c, roll);

  const comboMet = card.comboCards !== undefined && c.cardsPlayedThisTurn >= card.comboCards;

  if (!isUlt && !echo) {
    c.energy -= effectiveCost(card, c);
    // remove from hand
    c.hand = c.hand.filter((x) => x.uid !== card.uid);
  }
  c.cardsPlayedThisTurn += 1;
  const isAttack = card.type === "attack";
  if (isAttack) c.attacksPlayedThisTurn += 1;
  if (isAttack && !isUlt) c.attacksThisCombat = (c.attacksThisCombat ?? 0) + 1;

  // doomfist passive
    if (s.heroId === "doomfist" && isAttack && !isUlt) {
      const block = s.augments.includes("doom_gauntlet") ? 3 + 2 * (s.augmentTiers["doom_gauntlet"] ?? 1) : 3;
      c.block += block;
      pushFloat(c, `+${block}`, "block", "player");
  }

  // Tracer: Blink Chain. Every 3rd card played in a turn refunds 1 Energy.
  if (s.heroId === "tracer" && !isUlt && c.cardsPlayedThisTurn % 3 === 0) {
    c.energy += 1;
    pushFloat(c, "+1 NRG", "buff", "player");
    pushLog(c, "Blink Chain snaps back a point of Energy.");
      if (s.augments.includes("tracer_afterimage")) {
        c.block += 4;
        pushFloat(c, "+4", "block", "player");
      }
  }

  // strength gain (Last Stand pays out far harder while you are bleeding)
  const lowHpNow = c.hp * 2 <= c.maxHp;
  const strengthAmount =
    lowHpNow && card.lowHpStrength ? Math.max(card.lowHpStrength, card.strength ?? 0) : card.strength;
  if (strengthAmount) {
    const gained = gainStrength(c, strengthAmount, relics);
    pushFloat(c, `+${gained} STR`, "buff", "player");
  }
  if (lowHpNow && card.lowHpBlock) {
    c.block += card.lowHpBlock;
    pushFloat(c, `+${card.lowHpBlock}`, "block", "player");
  }
  // block (may scale with Attacks played this turn, for Doomfist)
  const blockGain = scaledBlock(card, c);
    if (blockGain > 0) {
    c.block += blockGain;
    pushFloat(c, `+${blockGain}`, "block", "player");
      if (s.heroId === "genji" && s.augments.includes("genji_deflect") && card.type === "skill") {
        c.thorns += 3;
        pushFloat(c, "DEFLECT", "buff", "player");
      }
  }
  // heal (overheal converts the wasted portion into Block; Mercy heals harder when low)
  if (card.heal) {
    const lowHp = c.hp * 2 <= c.maxHp;
    const amount = card.heal + (card.bonusHealIfLowHp && lowHp ? card.bonusHealIfLowHp : 0);
    const healed = Math.min(amount, c.maxHp - c.hp);
    c.hp += healed;
      if (healed > 0) {
        pushFloat(c, `+${healed}`, "heal", "player");
        if (s.heroId === "mercy" && s.augments.includes("mercy_caduceus")) {
          const ward = Math.ceil(healed / 2);
          c.block += ward;
          pushFloat(c, `+${ward}`, "block", "player");
        }
        if (s.heroId === "mercy" && s.augments.includes("mercy_bluebeam")) {
          c.nextAttackPct += 25;
          pushFloat(c, "BLUE BEAM", "buff", "player");
        }
      }
    const wasted = amount - healed;
    const triage = s.heroId === "mercy" && s.augments.includes("mercy_valkyrie");
    if ((card.overheal || triage) && wasted > 0) {
      c.block += wasted;
      pushFloat(c, `+${wasted}`, "block", "player");
    }
  }

  // Pawn Shop: pay the toll before the payoff
  if (card.goldCost && !isUlt) {
    set({ gold: Math.max(0, get().gold - card.goldCost) });
    pushFloat(c, `-${card.goldCost}G`, "debuff", "player");
    pushLog(c, `${card.name} buys back ${card.goldCost} gold worth of scrap.`);
  }
  // Second Wind: cash your Block in for health
  if (card.blockToHealRatio && c.block > 0) {
    const heal = Math.floor(c.block / card.blockToHealRatio);
    c.block = 0;
    const healed = Math.min(heal, c.maxHp - c.hp);
    if (healed > 0) {
      c.hp += healed;
      pushFloat(c, `+${healed}`, "heal", "player");
    }
    pushLog(c, `${card.name} burns your guard for ${healed} HP.`);
  }
  // Mirror Ward: arm the next Attack
  if (card.nextAttackBonusPct) {
    c.nextAttackPct += card.nextAttackBonusPct;
    pushFloat(c, `+${card.nextAttackBonusPct}%`, "buff", "player");
  }
  // energy gain
  if (card.energyGain) c.energy += card.energyGain;
  // draw
  if (card.draw) drawCards(c, card.draw);
  // combo payoff (Genji)
  if (comboMet) {
    if (card.comboDraw) drawCards(c, card.comboDraw);
    if (card.comboEnergy) c.energy += card.comboEnergy;
    if (s.heroId === "genji" && s.augments.includes("genji_flow")) drawCards(c, 1);
    pushFloat(c, "COMBO", "buff", "player");
  }
  if (s.heroId === "tracer" && s.augments.includes("tracer_slipstream") && isAttack && c.attacksPlayedThisTurn === 1) {
    drawCards(c, 1);
    pushFloat(c, "+1 CARD", "buff", "player");
  }
  if (s.heroId === "genji" && s.augments.includes("genji_dragon") && isAttack && c.attacksPlayedThisTurn % 3 === 0) {
    const gained = gainStrength(c, 1, relics);
    pushFloat(c, `+${gained} STR`, "buff", "player");
  }
  // overclock arms the end-of-turn energy payoff (Tracer)
  if (card.overclock) {
    c.overclock = card.overclock;
    pushFloat(c, "OVERCLOCK", "buff", "player");
  }
  // self damage
  if (card.selfDamage) {
    // Junkrat's blast suit soaks a little recoil. Total Mayhem makes every blast pay off.
    const soak = s.heroId === "junkrat" ? 2 : 0;
    if (s.heroId === "junkrat") {
      c.junkratBlastCount += 1;
      if (s.augments.includes("junkrat_total") || c.junkratBlastCount % 2 === 0) {
        const gained = gainStrength(c, 1, relics);
        pushFloat(c, `+${gained} STR`, "buff", "player");
      }
      if (s.augments.includes("junkrat_shrapnel")) {
        for (const e of c.enemies.filter((enemy) => !enemy.isDead && !enemy.untargetable)) e.weak += 1;
        pushFloat(c, "WEAK", "debuff", "player");
      }
    }
    const selfDmg = Math.max(0, card.selfDamage - soak);
    if (selfDmg > 0) {
      c.hp -= selfDmg;
      c.damageTakenThisCombat += selfDmg;
      pushFloat(c, `-${selfDmg}`, "dmg", "player");
    }
  }
  // ---- Reinhardt: Armor economy ----
  if (card.armorPerCardPlayed) {
    const gain = card.armorPerCardPlayed * (c.cardsPlayedThisTurn - 1);
    if (gain > 0) {
      c.armor += gain;
      pushFloat(c, `+${gain} ARM`, "block", "player");
    }
  }
  if (card.armor) {
    c.armor += card.armor;
    pushFloat(c, `+${card.armor} ARM`, "block", "player");
  }
  if (card.blockToArmor && c.block > 0) {
    const moved = c.block;
    c.block = 0;
    c.armor += moved;
    pushFloat(c, `+${moved} ARM`, "block", "player");
    pushLog(c, `${card.name} reforges ${moved} Block into Armor.`);
  }
  if (card.thorns) {
    c.thorns += card.thorns;
    pushFloat(c, `RETALIATE ${c.thorns}`, "buff", "player");
  }
  if (card.stealBlockAsArmor) {
    const target =
      c.enemies.find((e) => e.uid === targetUid && !e.isDead && !e.untargetable) ??
      c.enemies.find((e) => !e.isDead && !e.untargetable);
    if (target && target.block > 0) {
      const taken = target.block;
      target.block = 0;
      c.armor += taken;
      pushFloat(c, `+${taken} ARM`, "block", "player");
      pushLog(c, `${card.name} tears ${taken} Block off ${target.name} and bolts it on.`);
    }
  }

  // ---- Bastion: Configuration changes ----
  if (card.setStance || card.stanceCycle) {
    const order: Array<"recon" | "sentry" | "tank"> = ["recon", "sentry", "tank"];
    const next = card.setStance
      ? card.setStance
      : order[(order.indexOf((c.stance ?? "recon") as "recon") + 1) % 3]!;
    if (next !== c.stance) {
      c.stance = next;
      c.stanceSwaps += 1;
      pushFloat(c, next.toUpperCase(), "buff", "player");
      pushLog(c, `Bastion reconfigures into ${next.toUpperCase()}.`);
      // Passive engine: every Configuration change bolts on lasting power.
      const gainedCfg = gainStrength(c, 2, relics);
      pushFloat(c, `+${gainedCfg} STR`, "buff", "player");
      if (s.augments.includes("bastion_cycler")) {
        const tier = s.augmentTiers["bastion_cycler"] ?? 1;
        drawCards(c, 1);
        const gained = gainStrength(c, tier, relics);
        pushFloat(c, `+${gained} STR`, "buff", "player");
      }
      if (s.augments.includes("bastion_artillery")) {
        const shell = 6 * (s.augmentTiers["bastion_artillery"] ?? 1);
        for (const e of c.enemies) {
          if (e.isDead || e.untargetable) continue;
          applyEnemyDamage(c, e, shell, charge, relics.includes("power_core"), true);
        }
        pushLog(c, "Siege Uplink shells the line.");
      }
      if (s.augments.includes("bastion_ironclad") && next === "sentry") {
        const tier = s.augmentTiers["bastion_ironclad"] ?? 1;
        c.block += 5 * tier;
        pushFloat(c, `+${5 * tier}`, "block", "player");
      }
    } else {
      pushLog(c, `Bastion holds ${next.toUpperCase()}.`);
    }
  }

  // deal damage
  if (scaled > 0) {
    let hits = card.hits ?? 1;
    if (card.hitsPerAttack) hits = 1 + Math.max(0, c.attacksPlayedThisTurn - (isAttack ? 1 : 0));
    if (hitRoll !== undefined) hits = hitRoll;
    // Bastion: SENTRY adds a burst to every Attack.
    if (c.stance === "sentry" && isAttack) hits += 1;
    let bonus = 0;
    if (card.bonusIfAttack && c.attacksPlayedThisTurn > (isAttack ? 1 : 0)) bonus = card.bonusIfAttack;
    // Genji: Strike Chain. Each Attack after the first this turn escalates.
    if (s.heroId === "genji" && isAttack && !isUlt) {
      bonus += 4 * Math.max(0, c.attacksPlayedThisTurn - 1);
    }
    let totalBase = scaled + bonus;
    if (s.heroId === "junkrat" && s.augments.includes("junkrat_hairtrigger") && card.randomDamage) {
      const [lo, hi] = card.randomDamage;
      totalBase = Math.max(totalBase, Math.ceil((lo + hi) / 2));
    }
    if (card.doubleIfHandEmpty && c.hand.length === 0) {
      totalBase *= 2;
      pushLog(c, `${card.name} goes all in.`);
    }
    if (isAttack && c.nextAttackPct > 0) {
      totalBase = Math.floor(totalBase * (1 + c.nextAttackPct / 100));
      pushFloat(c, "MIRRORED", "buff", "player");
      c.nextAttackPct = 0;
    }
    const targets: EnemyInstance[] = card.aoe
      ? c.enemies.filter((e) => !e.isDead && !e.untargetable)
      : [
          c.enemies.find((e) => e.uid === targetUid && !e.isDead && !e.untargetable) ??
            c.enemies.find((e) => !e.isDead && !e.untargetable)!,
        ].filter(Boolean);
    // Doomfist: Cataclysm. Every third swing rolls through the whole line.
    if (
      isAttack &&
      !card.aoe &&
      s.heroId === "doomfist" &&
      s.augments.includes("doom_meteor") &&
      (c.attacksThisCombat ?? 0) % 3 === 0
    ) {
      const quake = Math.max(1, Math.floor(totalBase / 2));
      for (const e of c.enemies) {
        if (e.isDead || e.untargetable || targets.includes(e)) continue;
        applyEnemyDamage(c, e, quake, charge, powerCell, false);
        pushFloat(c, `${quake}`, "dmg", e.uid);
      }
      pushLog(c, "Cataclysm ripples through the line.");
    }
    for (const t of targets) {
      if (!t) continue;
      // Junkrat: blasts hit harder on softened targets
      const debuffBonus =
        (card.damagePerDebuff ? card.damagePerDebuff * (t.vulnerable + t.weak) : 0) +
        (card.damagePerPoison ? card.damagePerPoison * t.poison : 0);
      for (let h = 0; h < hits; h++) {
        if (t.isDead) break;
        const tankPierce = c.stance === "tank" && isAttack;
        const dealt = applyEnemyDamage(c, t, totalBase + debuffBonus, charge, powerCell, card.ignoreBlock || tankPierce);
        pushFloat(c, `${dealt}`, "dmg", t.uid);
        // Doomfist: executions feed permanent Strength
        if (t.isDead && card.goldOnKill) {
          set({ gold: get().gold + card.goldOnKill });
          pushFloat(c, `+${card.goldOnKill}G`, "buff", "player");
          pushLog(c, `${card.name} strips ${card.goldOnKill} gold off ${t.name}.`);
        }
        if (t.isDead && card.strengthOnKill) {
          const gained = gainStrength(c, card.strengthOnKill, relics);
          pushFloat(c, `+${gained} STR`, "buff", "player");
          pushLog(c, `${card.name} executes ${t.name}. +${gained} Strength.`);
        }
      }
    }
  }

  // Junkrat: recycle the discard pile back into the deck
  if (card.shuffleDiscard && c.discardPile.length > 0) {
    c.drawPile = shuffleInPlace([...c.drawPile, ...c.discardPile]);
    c.discardPile = [];
    pushLog(c, "Scrap Heap recycles the discard pile.");
  }

  // Moira: regen + poison empowerment
  if (card.regen) {
    c.regen += card.regen;
    pushFloat(c, `+${card.regen} REG`, "heal", "player");
  }
  if (card.poisonBoost) {
    c.poisonBoost += card.poisonBoost;
    pushFloat(c, `+${card.poisonBoost} PSN`, "buff", "player");
  }
  // Moira: apply poison (boosted by Biotic Surge)
  if (card.poison) {
    const stacks = card.poison + c.poisonBoost;
    const targets: EnemyInstance[] = card.aoe
      ? c.enemies.filter((e) => !e.isDead && !e.untargetable)
      : [
          c.enemies.find((e) => e.uid === targetUid && !e.isDead && !e.untargetable) ??
            c.enemies.find((e) => !e.isDead && !e.untargetable)!,
        ].filter(Boolean);
    for (const t of targets) {
      if (!t) continue;
      t.poison += stacks;
      pushFloat(c, `+${stacks} PSN`, "debuff", t.uid);
    }
    if (targets.length > 0) c.poisonBoost = 0;
    if (targets.length > 0 && s.heroId === "moira" && s.augments.includes("moira_coalescence")) {
      const seep = 2 * (s.augmentTiers["moira_coalescence"] ?? 1);
      for (const e of c.enemies) {
        if (e.isDead || e.untargetable || targets.includes(e)) continue;
        e.poison += seep;
        pushFloat(c, `+${seep} PSN`, "debuff", e.uid);
      }
    }
    if (targets.length > 0 && s.heroId === "moira" && s.augments.includes("moira_reservoir")) {
      c.regen += 1;
      pushFloat(c, "+1 REG", "heal", "player");
    }
  }
  // Moira: consume poison stacks for burst damage
  if (card.poisonDetonate) {
    const target =
      c.enemies.find((e) => e.uid === targetUid && !e.isDead && !e.untargetable) ??
      c.enemies.find((e) => !e.isDead && !e.untargetable);
    if (target && target.poison > 0) {
      const burst = target.poison * card.poisonDetonate;
      target.poison = 0;
      const dealt = applyEnemyDamage(c, target, burst, charge, powerCell);
      pushFloat(c, `${dealt}`, "dmg", target.uid);
      pushLog(c, `${card.name} detonates the toxin for ${dealt}.`);
    }
  }
  // Moira: spread the worst infection to the whole board
  if (card.poisonSpread) {
    const living = c.enemies.filter((e) => !e.isDead && !e.untargetable);
    const highest = living.reduce((m, e) => Math.max(m, e.poison), 0);
    if (highest > 0) {
      for (const t of living) {
        if (t.poison < highest) {
          const gain = highest - t.poison;
          t.poison = highest;
          pushFloat(c, `+${gain} PSN`, "debuff", t.uid);
        }
      }
      pushLog(c, `${card.name} spreads ${highest} Poison across the board.`);
    }
  }

  // Moira: double the infection on one target
  if (card.poisonDouble) {
    const target =
      c.enemies.find((e) => e.uid === targetUid && !e.isDead && !e.untargetable) ??
      c.enemies.find((e) => !e.isDead && !e.untargetable);
    if (target && target.poison > 0) {
      const gain = target.poison;
      target.poison += gain;
      pushFloat(c, `+${gain} PSN`, "debuff", target.uid);
      pushLog(c, `${card.name} doubles the toxin on ${target.name}.`);
    }
  }
  // Moira: siphon the board's infection into health
  if (card.healPerPoisonBoard) {
    const stacks = c.enemies.filter((e) => !e.isDead).reduce((n, e) => n + e.poison, 0);
    const healed = Math.min(c.maxHp - c.hp, stacks * card.healPerPoisonBoard);
    if (healed > 0) {
      c.hp += healed;
      pushFloat(c, `+${healed}`, "heal", "player");
    }
  }
  // Moira: burn all Regen into an AoE necrotic blast
  if (card.consumeRegenDamage && c.regen > 0) {
    const burst = c.regen * card.consumeRegenDamage;
    c.regen = 0;
    for (const t of c.enemies.filter((e) => !e.isDead && !e.untargetable)) {
      const dealt = applyEnemyDamage(c, t, burst, charge, powerCell);
      pushFloat(c, `${dealt}`, "dmg", t.uid);
    }
    pushLog(c, `${card.name} burns all Regen for ${burst} to every enemy.`);
  }

  // Moira: Coalescence sustained beam
  if (card.beam) {
    const target =
      c.enemies.find((e) => e.uid === targetUid && !e.isDead && !e.untargetable) ??
      c.enemies.find((e) => !e.isDead && !e.untargetable);
    if (target) {
      const beamDamage = card.beam.damage + (s.heroId === "moira" && s.augments.includes("moira_coalescence") ? 2 : 0);
      const beamHeal = card.beam.heal + (s.heroId === "moira" && s.augments.includes("moira_coalescence") ? 2 : 0);
      c.beams.push({ targetUid: target.uid, damage: beamDamage, heal: beamHeal, turns: card.beam.turns });
      const dealt = applyEnemyDamage(c, target, beamDamage, charge, powerCell);
      pushFloat(c, `${dealt}`, "dmg", target.uid);
      const healed = Math.min(c.maxHp - c.hp, beamHeal);
      if (healed > 0) {
        c.hp += healed;
        pushFloat(c, `+${healed}`, "heal", "player");
      }
      pushLog(c, "COALESCENCE. The beam locks on.");
    }
  }
  // apply debuffs to target
  if (card.vulnerable || card.weak) {
    const targets: EnemyInstance[] = card.aoe
      ? c.enemies.filter((e) => !e.isDead && !e.untargetable)
      : [
          c.enemies.find((e) => e.uid === targetUid && !e.isDead && !e.untargetable) ??
            c.enemies.find((e) => !e.isDead && !e.untargetable)!,
        ].filter(Boolean);
    for (const t of targets) {
      if (!t) continue;
      if (card.vulnerable) t.vulnerable += card.vulnerable;
      if (card.weak) t.weak += card.weak;
    }
  }
  // Ultimates never feed their own meter, otherwise faster-charge relics let you
  // chain ults forever off the ult's own damage.
  c.ultCharge = isUlt ? 0 : Math.min(100, charge.v);
  c.targetingCardUid = null;

  // move to discard/exhaust
  if (!isUlt && !echo) {
    if (card.exhaust) {
      c.exhaustPile.push(card);
      if (relics.includes("phoenix_core")) {
        const healed = Math.min(c.maxHp - c.hp, 3);
        if (healed > 0) {
          c.hp += healed;
          pushFloat(c, `+${healed}`, "heal", "player");
        }
      }
    } else c.discardPile.push(card);
  }

  pushLog(c, echo ? `${card.name} echoes.` : `Played ${card.name}`);

  // Chrono Duplicator: the opening card of the combat resolves a second time.
  if (
    !isUlt &&
    !echo &&
    relics.includes("chrono_duplicator") &&
    !c.duplicatorUsed &&
    c.hp > 0 &&
    !c.enemies.every((e) => e.isDead)
  ) {
    c.duplicatorUsed = true;
    set({ combat: { ...c } });
    resolveCard(set, get, card, targetUid, false, true);
    return;
  }

  // check combat win
  const allDead = c.enemies.every((e) => e.isDead);
  if (allDead) {
    c.active = false;
    handleCombatWin(set, get);
    set({ combat: { ...c } });
    return;
  }
  // check self death (selfDamage)
  if (c.hp <= 0) {
    if (relics.includes("soul_stone") && !c.ultUsedThisCombat) {
      c.ultUsedThisCombat = true;
      c.hp = Math.floor(c.maxHp * 0.5);
      pushLog(c, "Soul Stone revives you!");
    } else {
      c.hp = 0;
      c.active = false;
      handleDeath(set, get);
    }
  }
  set({ combat: { ...c } });
}

function handleCombatWin(set: any, get: () => GameState) {
  const s = get();
  const c = s.combat!;
  // highlight reel: the beats a player would actually retell afterwards
  const hpPct = c.maxHp > 0 ? Math.round((c.hp / c.maxHp) * 100) : 100;
  const runStats = {
    bestHit: Math.max(s.runStats.bestHit, c.bestHit),
    lowestHp: Math.min(s.runStats.lowestHp, hpPct),
    bossKills: s.runStats.bossKills + (c.isBoss ? 1 : 0),
    clutch: s.runStats.clutch || (c.hp > 0 && c.hp <= Math.max(5, Math.ceil(c.maxHp * 0.08))),
  };
  set({ runStats });
  if (c.isBoss && !(s.meta.bossHeroes ?? []).includes(s.heroId)) {
    const meta = { ...s.meta, bossHeroes: [...(s.meta.bossHeroes ?? []), s.heroId] };
    set({ meta });
    saveMeta(meta);
  }
  // bank hp
  let hp = c.hp;
  let gold = s.gold;
  let deck = s.deck;
  const has = (id: string) => s.relics.includes(id);
  // post-combat healing relics
  if (has("vampire_fang")) hp = Math.min(s.maxHp, hp + 6);
  if (has("blood_pact")) hp = Math.min(s.maxHp, hp + Math.ceil(s.maxHp * 0.08));
  // gold reward
  const baseGold = c.nodeType === "boss" ? 45 : c.nodeType === "elite" ? 26 : 12;
  let g = baseGold + new Rng(s.seed ^ (s.floorsCleared * 7)).int(0, 10);

  if (has("lucky_coin")) g = Math.floor(g * 1.75);
  if (has("salvage_claw")) g += 20;
  const goldMult = s.mutator ? MUTATORS[s.mutator]?.goldMult ?? 1 : 1;
  g = Math.floor(g * goldMult);
  gold += g;
  const floorsCleared = s.floorsCleared + 1;
  const actFloors = s.actFloors + 1;
  const qualifies =
    (s.contract.id === "clean_sweep" && c.hp >= c.maxHp * 0.75) ||
    (s.contract.id === "shock_assault" && c.turn <= 3) ||
    (s.contract.id === "iron_line" && c.block + c.armor > 0);
  let contract = s.contract;
  let contractsCompleted = s.contractsCompleted;
  if (!contract.complete && qualifies) {
    const progress = Math.min(contract.goal, contract.progress + 1);
    contract = { ...contract, progress, complete: progress >= contract.goal };
    if (contract.complete) {
      contractsCompleted += 1;
      hp = Math.min(s.maxHp, hp + 12);
      const upgradeable = s.deck.filter((card) => !card.upgraded);
      const reward = upgradeable[(s.seed + floorsCleared) % Math.max(1, upgradeable.length)];
      if (reward) {
        deck = s.deck.map((card) => card.uid === reward.uid ? makeCard(card.id, true) : card);
      }
    }
  }
  // card reward
  const rng = rngForRun(s.seed, 9000 + floorsCleared);
  // Hero cards carry the run's identity, so they are offered twice as often as
  // the generic pool. Neutral value cards should season a build, not define it.
  const heroPool = getHero(s.heroId).cardPool;
  const pool = [...heroPool, ...heroPool, ...NEUTRAL_POOL];
  const choices: CardInstance[] = [];
  const remaining = [...pool];
  const offers = has("codex_shard") ? 4 : 3;
  for (let i = 0; i < offers && remaining.length > 0; i++) {
    const id = rng.pick(remaining);
    remaining.splice(remaining.indexOf(id), 1); // no duplicate offers
    choices.push(makeCard(id, rng.chance(0.12)));
  }

  // ---- relic drops: bosses always, elites often, normal fights rarely ----
  // Relics are meant to define a run, not fill a checklist, so the odds fall
  // off hard as your collection grows.
  const ownedIds = new Set(s.relics);
  const unlockedIds = new Set(s.meta.unlockedRelics);
  const availRelics = ALL_RELIC_IDS.filter((r) => unlockedIds.has(r) && !ownedIds.has(r) && isDropEligible(r, true));
  const atCap = s.relics.length >= MAX_RELICS;
  const glut = Math.max(0.25, 1 - s.relics.length * 0.1);
  const baseDrop =
    c.nodeType === "boss" ? 1 : c.nodeType === "elite" ? 0.8 : has("relic_scanner") ? 0.12 : 0.05;
  const dropChance = atCap ? 0 : c.nodeType === "boss" ? 1 : baseDrop * glut;
  const droppedRelic =
    availRelics.length > 0 && rng.chance(dropChance)
      ? (pickRelicId(availRelics, rng.next(), true) ?? null)
      : null;
  const relics = droppedRelic ? [...s.relics, droppedRelic] : s.relics;

  // Every fight ends with a readable summary of what the win actually gave you.
  const bannerLines: string[] = [
    `Cleared in ${c.turn} turn${c.turn === 1 ? "" : "s"}`,
    `+${g} gold`,
  ];
  if (hp > c.hp) bannerLines.push(`+${hp - c.hp} HP recovered`);
  if (droppedRelic) bannerLines.push(`Relic found: ${RELICS[droppedRelic]!.name}`);
  if (contract.complete && !s.contract.complete) bannerLines.push(`Contract complete: ${contract.name}`);
  const banner = {
    title: c.nodeType === "boss" ? "BOSS DOWN" : c.nodeType === "elite" ? "ELITE PURGED" : "AREA CLEAR",
    lines: bannerLines,
    tone: (c.nodeType === "boss" ? "boss" : "win") as "boss" | "win",
  };


  // boss -> next act or victory
  if (c.nodeType === "boss") {
    if (s.act < ACT_BOSSES.length - 1) {
      const nextAct = s.act + 1;
      const newMap = generateMap(rngForRun(s.seed, 7000 + nextAct * 131));
      const nextMaxHp = maxHpFor(s.heroId, relics, nextAct, s.meta.upgrades);
      // Boss rewards used to hand out every augment in order, which meant the
      // "choice" was really just sequencing. Now you either deepen the path you
      // committed to or branch into a new one, and you cannot have it all.
      const available = augmentPoolFor(s.heroId, s.augments);
      const branch = rng.shuffle(available).slice(0, 2).map((a) => a.id);
      const deepen = [...s.augments]
        .filter((id) => (s.augmentTiers[id] ?? 1) < 3)
        .sort((a, b) => (s.augmentTiers[b] ?? 1) - (s.augmentTiers[a] ?? 1))
        .slice(0, 1);
      const augmentChoices = [...deepen, ...branch].slice(0, 3);
      set({
        hp: Math.min(nextMaxHp, hp + Math.floor(nextMaxHp * 0.35)),
        maxHp: nextMaxHp,
        gold,
        deck,
        relics,
        floorsCleared,
        actFloors: 0,
        act: nextAct,
        map: newMap,
        currentNodeId: null,
        phase: "augment_choice",
        augments: s.augments,
        augmentTiers: s.augmentTiers,
        augmentChoices,
        contract: makeContract((s.seed + nextAct) % 3),
        contractsCompleted,
        pendingRelic: droppedRelic,
        rewardChoices: choices,
        rewardGold: g,
        combat: null,
        banner,
        bossOutro: BOSSES[c.enemies[0]?.defId ?? ""]?.deathLine ?? null,
      });
      return;
    }
    const score = computeScore(floorsCleared, s.act + 1, gold, true);
    const meta = withRunStats({
      ...s.meta,
      credits: s.meta.credits + Math.floor((200 + floorsCleared) * upgradeCreditMult(s.meta.upgrades)),
      bestFloor: Math.max(s.meta.bestFloor, floorsCleared),
      totalRuns: s.meta.totalRuns + 1,
    }, { heroId: s.heroId, win: true, score, floorsCleared, bestHit: s.runStats.bestHit, bossKills: s.runStats.bossKills });
    saveMeta(meta);
    set({
      hp,
      gold,
      floorsCleared,
      phase: "victory",
      combat: null,
      meta,
      banner,
      bossOutro: BOSSES[c.enemies[0]?.defId ?? ""]?.deathLine ?? null,
      lastRun: { heroId: s.heroId, score, floorsCleared, act: s.act + 1, fullClear: true, highlight: runHighlight({ ...s, floorsCleared }), mutator: s.mutator },
      scoreSubmitted: false,
    });
    return;
  }

  const postMax = maxHpFor(s.heroId, relics, s.act, s.meta.upgrades);
  set({
    hp: Math.min(hp, postMax),
    maxHp: postMax,
    gold,
    deck,
    relics,
    floorsCleared,
    actFloors,
    contract,
    contractsCompleted,
    phase: "reward",
    pendingRelic: droppedRelic,
    rewardChoices: choices,
    rewardGold: g,
    combat: null,
    banner,
  });
}


/** One line the player would repeat to a friend. Ranked by how loud the beat is. */
function runHighlight(s: GameState): string {
  const st = s.runStats;
  if (st.bestHit >= 60) return `You hit something for ${st.bestHit} in a single card.`;
  if (st.clutch) return "You closed out a fight on fumes and kept walking.";
  if (st.bossKills >= 3) return `${st.bossKills} bosses down in one timeline.`;
  if (st.bestHit >= 35) return `Biggest hit of the run: ${st.bestHit} damage.`;
  if (st.bossKills >= 1) return "You put a boss in the ground before it got you.";
  if (st.lowestHp <= 15) return `You held a fight at ${st.lowestHp}% HP.`;
  return `Deepest push: floor ${s.floorsCleared}.`;
}

function handleDeath(set: any, get: () => GameState) {
  const s = get();
  const credits = Math.floor((s.floorsCleared * 8 + s.gold * 0.2) * upgradeCreditMult(s.meta.upgrades));
  const score = computeScore(s.floorsCleared, s.act, s.gold, false);
  const meta = withRunStats({
    ...s.meta,
    credits: s.meta.credits + credits,
    bestFloor: Math.max(s.meta.bestFloor, s.floorsCleared),
    totalRuns: s.meta.totalRuns + 1,
  }, { heroId: s.heroId, win: false, score, floorsCleared: s.floorsCleared, bestHit: s.runStats.bestHit, bossKills: s.runStats.bossKills });
  saveMeta(meta);
  set({
    phase: "dead",
    combat: null,
    meta,
    lastRun: { heroId: s.heroId, score, floorsCleared: s.floorsCleared, act: s.act, fullClear: false, highlight: runHighlight(s), mutator: s.mutator },
    scoreSubmitted: false,
  });
}

function markNodeVisited(set: any, get: () => GameState) {
  const s = get();
  const map = s.map.map((n) => (n.id === s.currentNodeId ? { ...n, visited: true } : n));
  set({ map });
}

function openShop(set: any, get: () => GameState, rng: Rng) {
  const s = get();
  // Hero cards carry the run's identity, so they are offered twice as often as
  // the generic pool. Neutral value cards should season a build, not define it.
  const heroPool = getHero(s.heroId).cardPool;
  const pool = [...heroPool, ...heroPool, ...NEUTRAL_POOL];
  const shopCards: CardInstance[] = [];
  const stock = [...pool];
  for (let i = 0; i < 5 && stock.length > 0; i++) {
    const id = rng.pick(stock);
    stock.splice(stock.indexOf(id), 1); // distinct stock, no duplicate listings
    shopCards.push(makeCard(id, rng.chance(0.25)));
  }
  const owned = new Set(s.relics);
  const unlockedShop = new Set(s.meta.unlockedRelics);
  let avail =
    s.relics.length >= MAX_RELICS
      ? []
      : ALL_RELIC_IDS.filter((r) => unlockedShop.has(r) && !owned.has(r) && isDropEligible(r));
  const shopRelics: string[] = [];
  for (let i = 0; i < 2; i++) {
    const id = pickRelicId(avail, rng.next());
    if (!id) break;
    shopRelics.push(id);
    avail = avail.filter((r) => r !== id);
  }
  while (shopRelics.length < 2) shopRelics.push("");

  set({ phase: "shop", shopCards, shopRelics });
}

export function cardPrice(card: CardInstance): number {
  const base = card.rarity === "rare" ? 90 : card.rarity === "uncommon" ? 60 : 40;
  return card.upgraded ? base + 20 : base;
}

/** Shop price for a relic, scaled by tier. */
export function relicPrice(relicId: string): number {
  const tier = RELICS[relicId]?.tier ?? "common";
  return tier === "mythic" ? 600 : tier === "legendary" ? 420 : tier === "rare" ? 250 : tier === "uncommon" ? 185 : 140;
}



export { HEROES, RELICS, CARDS, tracerImg };

function scrambleHand(c: Combat) {
  if (c.hand.length === 0) return;
  const idx = Math.floor(Math.random() * c.hand.length);
  const ids = Object.keys(CARDS);
  const newId = ids[Math.floor(Math.random() * ids.length)]!;
  c.hand[idx] = makeCard(newId, false);
}
