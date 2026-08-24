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
import { RELICS, ALL_RELIC_IDS, pickRelicId } from "./relics";
import { generateMap } from "./mapgen";
import tracerImg from "../assets/tracer.png";
import kingsrowImg from "../assets/bg_kingsrow.jpg";
import factoryImg from "../assets/bg_factory.jpg";
import { UPGRADES, tierOf, upgradeBonusMaxHp, upgradeCacheRelicChance, upgradeCreditMult, upgradeStartGold } from "./upgrades";

export type Phase =
  | "map"
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
}


export interface GameState {
  // meta (persisted)
  meta: {
    unlockedHeroes: string[];
    credits: number;
    bestFloor: number;
    totalRuns: number;
    /** permanent Archive upgrades: upgrade id -> purchased tier */
    upgrades: Record<string, number>;
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
  phase: Phase;
  rewardChoices: CardInstance[];
  rewardGold: number;
  pendingRelic: string | null;
  shopCards: CardInstance[];
  shopRelics: string[];
  combat: Combat | null;
  lastEvent: string;
  // actions
  loadMeta: () => void;
  startRun: (heroId: string, seedLabel?: string) => void;
  enterNode: (nodeId: number) => void;
  startCombat: (nodeType: NodeType, rng: Rng) => void;
  playCard: (uid: string, targetUid?: string) => void;
  selectTarget: (enemyUid: string) => void;
  cancelTarget: () => void;
  endTurn: () => void;
  useUltimate: (targetUid?: string) => void;
  pickRewardCard: (cardId: string) => void;
  skipReward: () => void;
  restHeal: () => void;
  restUpgrade: (cardUid: string) => void;
  takeTreasure: () => void;
  confirmRelic: () => void;
  buyCard: (index: number) => void;
  buyRelic: (index: number) => void;
  buyRemove: (cardUid: string) => void;
  leaveShop: () => void;
  toMap: () => void;
  abandon: () => void;
  buyUpgrade: (id: string) => void;
  addFloat: (f: Omit<Float, "id" | "at">) => void;
  pruneFloats: () => void;
}

const META_KEY = "overtung_meta_v1";
const LEGACY_META_KEY = "chronobreak_meta_v1";

function defaultMeta() {
  return { unlockedHeroes: [...STARTER_HEROES], credits: 0, bestFloor: 0, totalRuns: 0, upgrades: {} as Record<string, number> };
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
    // starters are always available (new starter heroes reach old saves too)
    m.unlockedHeroes = Array.from(new Set([...STARTER_HEROES, ...m.unlockedHeroes]));
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

function getHero(heroId: string): HeroDef {
  return HEROES[heroId]!;
}

function maxEnergyFor(heroId: string, relics: string[]): number {
  let e = 3;
  if (heroId === "tracer") e += 1;
  if (relics.includes("energy_core")) e += 1;
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
function applyEnemyDamage(c: Combat, enemy: EnemyInstance, base: number, charge: { v: number }, relicPower: boolean): number {
  if (enemy.untargetable) return 0;
  let dmg = base + c.strength;
  if (c.weak > 0) dmg = Math.floor(dmg * 0.75);
  if (enemy.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
  dmg = Math.max(0, dmg);
  let remaining = dmg;
  if (enemy.block > 0) {
    const absorbed = Math.min(enemy.block, remaining);
    enemy.block -= absorbed;
    remaining -= absorbed;
  }
  enemy.hp -= remaining;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.isDead = true;
  }
  charge.v += relicPower ? dmg * 1.6 : dmg;
  return dmg;
}

function applyPlayerDamage(get: () => GameState, c: Combat, base: number, srcStrength: number, srcWeak: number): number {
  let dmg = base + srcStrength;
  if (srcWeak > 0) dmg = Math.floor(dmg * 0.75);
  if (c.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
  dmg = Math.max(0, dmg);
  let remaining = dmg;
  if (c.block > 0) {
    const absorbed = Math.min(c.block, remaining);
    c.block -= absorbed;
    remaining -= absorbed;
  }
  c.hp -= remaining;
  c.damageTakenThisCombat += remaining;
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
    !!card.poisonDetonate
  );
}

/** Cost after dynamic discounts (Genji free-if-attack, Doomfist momentum). */
export function effectiveCost(card: CardInstance, c: Combat): number {
  let cost = card.cost;
  if (card.freeIfAttack && c.attacksPlayedThisTurn > 0) return 0;
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
  return dmg;
}

/** Visual-only: is this card's conditional bonus currently "charged up"? */
export function cardSynergyActive(card: CardInstance, c: Combat): boolean {
  if (card.freeIfAttack && c.attacksPlayedThisTurn > 0) return true;
  if (card.bonusIfAttack && c.attacksPlayedThisTurn > 0) return true;
  if (card.comboCards !== undefined && c.cardsPlayedThisTurn >= card.comboCards) return true;
  if (card.damagePerCardPlayed && c.cardsPlayedThisTurn > 0) return true;
  if (card.damagePerDiscard && c.discardPile.length > 0) return true;
  if (card.damagePerMissingHp && c.hp < c.maxHp) return true;
  if (card.costPerDamageTaken && c.damageTakenThisCombat >= card.costPerDamageTaken) return true;
  if (card.poisonDetonate && c.enemies.some((e) => !e.isDead && e.poison > 0)) return true;
  if (card.poison && c.poisonBoost > 0) return true;
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
  phase: "map",
  rewardChoices: [],
  rewardGold: 0,
  pendingRelic: null,
  shopCards: [],
  shopRelics: [],
  combat: null,
  lastEvent: "",

  loadMeta: () => set({ meta: loadMetaFromStorage() }),

  startRun: (heroId, seedLabel) => {
    const label = seedLabel && seedLabel.trim() ? seedLabel.trim() : Math.floor(Math.random() * 999999).toString();
    const seed = hashSeed(label);
    const relics: string[] = [];
    const meta = get().meta;
    const maxHp = maxHpFor(heroId, relics, 0, meta.upgrades);
    const deck = getHero(heroId).startingDeck.map((id) => makeCard(id));
    const rng = rngForRun(seed, 1);
    const map = generateMap(rng);
    set({
      inRun: true,
      seed,
      seedLabel: label,
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
      phase: "map",
      combat: null,
      lastEvent: "",
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
    if (nodeType === "boss") {
      const def = BOSSES[ACT_BOSSES[s.act] ?? ACT_BOSSES[ACT_BOSSES.length - 1]!]!;
      enemies = [spawnEnemy(def, rng, `e_${Date.now()}`)];
      isBoss = true;
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
    // Difficulty curve: the breach hardens the deeper you fall.
    const floor = s.floorsCleared;
    const hpScale = 1 + floor * 0.055 + s.act * 0.16;
    const strBonus =
      Math.floor(floor / 5) +
      Math.floor(s.act / 2) +
      (nodeType === "elite" ? 2 + Math.floor(s.act / 2) : 0);
    for (const e of enemies) {
      const scaled = Math.round(e.maxHp * hpScale);
      e.hp = scaled;
      e.maxHp = scaled;
      e.strength = strBonus;
    }

    // junkrat passive: enemies start with 1 vulnerable
    if (s.heroId === "junkrat") {
      for (const e of enemies) e.vulnerable = 2;
    }
    const maxEnergy = maxEnergyFor(s.heroId, s.relics);
    const drawN = drawCountFor(s.heroId, s.relics);
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
      block: 0,
      strength: 0,
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
      log: [`Battle start — ${enemies.map((e) => e.name).join(", ")}`],
      floats: [],
      isBoss,
      bg,
      nodeType,
      ultUsedThisCombat: false,
      damageTakenThisCombat: 0,
      overclock: null,
      regen: 0,
      poisonBoost: 0,
      hackedType: null,
      hackEnergy: false,
      hackDraw: false,
      beams: [],
      firstCardDiscount: s.relics.includes("haste_module"),
    };
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
    if (R("berserker")) combat.strength += 2;
    if (R("execution_chip")) combat.strength += 3;
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
          pushLog(c, "Reaper slips into WRAITH FORM — untargetable.");
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
          pushLog(c, "Sombra vanishes into STEALTH PROTOCOL — attacks can't find her.");
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
      }
      e.poison -= 1;
    }
    if (dotHeal > 0) {
      pushLog(c, `Poison deals ${dotHeal} damage.`);
      // Moira's Biotic Grasp: her damage-over-time feeds her back
      if (s.heroId === "moira") {
        const healed = Math.min(c.maxHp - c.hp, Math.ceil(dotHeal * 0.4));
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
    }
    c.ultCharge = Math.min(100, charge.v);
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
    // Aegis Loop keeps half your Block instead of wiping it
    c.block = relics.includes("aegis_loop") ? Math.floor(c.block / 2) : 0;
    // ---- per-turn relic ticks ----
    if (relics.includes("dragon_ember")) {
      c.strength += 1;
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
    if (c.hackEnergy) pushLog(c, "Hacked — you lose 1 Energy this turn.");
    c.cardsPlayedThisTurn = 0;
    c.attacksPlayedThisTurn = 0;
    // draw
    let drawN = drawCountFor(s.heroId, relics);
    if (c.hackDraw) {
      drawN = Math.max(2, drawN - 2);
      pushLog(c, "Hacked — you draw fewer cards this turn.");
    }
    c.hackEnergy = false;
    c.hackDraw = false;
    drawCards(c, drawN);
    // passive heals
    if (s.heroId === "mercy") c.hp = Math.min(c.maxHp, c.hp + 1);
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
    if (!c || !c.active || c.ultCharge < 100) return;
    const hero = getHero(s.heroId);
    const ult = { ...hero.ultimate, uid: `ult_${c.turn}`, upgraded: false } as CardInstance;
    c.ultCharge = 0;
    const living = c.enemies.filter((e) => !e.isDead);
    const needsTarget = ((ult.damage ?? 0) > 0 || !!ult.beam) && !ult.aoe && living.length > 1;
    if (needsTarget && !targetUid) {
      // store a flag for targeting ult via targetingCardUid? simpler: just target first
      resolveCard(set, get, ult, living[0]?.uid ?? null, true);
    } else {
      resolveCard(set, get, ult, targetUid ?? living[0]?.uid ?? null, true);
    }
  },

  pickRewardCard: (cardId) => {
    const s = get();
    const card = makeCard(cardId);
    const deck = [...s.deck, card];
    set({ deck, phase: "map", pendingRelic: null });
    markNodeVisited(set, get);
  },

  skipReward: () => {
    set({ phase: "map", pendingRelic: null });
    markNodeVisited(set, get);
  },


  restHeal: () => {
    const s = get();
    const heal = Math.floor(s.maxHp * 0.3);
    set({ hp: Math.min(s.maxHp, s.hp + heal), phase: "map" });
    markNodeVisited(set, get);
  },

  restUpgrade: (cardUid) => {
    const s = get();
    const deck = s.deck.map((c) => (c.uid === cardUid && !c.upgraded ? makeCard(c.id, true) : c));
    set({ deck, phase: "map" });
    markNodeVisited(set, get);
  },

  takeTreasure: () => {
    const s = get();
    const owned = new Set(s.relics);
    const avail = ALL_RELIC_IDS.filter((r) => !owned.has(r));
    if (avail.length === 0) {
      set({ phase: "map" });
      markNodeVisited(set, get);
      return;
    }
    const rng = rngForRun(s.seed, 5000 + s.floorsCleared);
    // caches are relic-first now; the scanner upgrade only widens the odds
    if (!rng.chance(Math.max(0.9, upgradeCacheRelicChance(s.meta.upgrades)))) {
      // scanner missed: cache yields a card reward instead
      const pool = [...getHero(s.heroId).cardPool, ...NEUTRAL_POOL];
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
    set({ pendingRelic: null, phase: "map" });
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
    });
  },

  buyRelic: (index) => {
    const s = get();
    const relicId = s.shopRelics[index];
    if (!relicId) return;
    if (s.relics.includes(relicId)) return;
    const cost = 150;
    if (s.gold < cost) return;
    const relics = [...s.relics, relicId];
    set({ gold: s.gold - cost, relics, shopRelics: s.shopRelics.map((r, i) => (i === index ? "" : r)) });
  },

  buyRemove: (cardUid) => {
    const s = get();
    if (s.gold < 75) return;
    if (s.deck.length <= 5) return; // never let the deck get unplayably small
    set({ gold: s.gold - 75, deck: s.deck.filter((c) => c.uid !== cardUid) });
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
) {
  const s = get();
  const c = s.combat!;
  const relics = s.relics;
  const powerCell = relics.includes("power_cell");
  const charge = { v: c.ultCharge };
  // damage / combo scaling read the board BEFORE this card counts itself
  const rollRng = card.randomDamage
    ? new Rng(hashSeed(`${s.seed}_${card.uid}_${c.turn}_${c.cardsPlayedThisTurn}`))
    : null;
  const roll = card.randomDamage && rollRng ? rollRng.int(card.randomDamage[0], card.randomDamage[1]) : undefined;
  const scaled = scaledDamage(card, c, roll);
  const comboMet = card.comboCards !== undefined && c.cardsPlayedThisTurn >= card.comboCards;

  if (!isUlt) {
    c.energy -= effectiveCost(card, c);
    // remove from hand
    c.hand = c.hand.filter((x) => x.uid !== card.uid);
  }
  c.cardsPlayedThisTurn += 1;
  const isAttack = card.type === "attack";
  if (isAttack) c.attacksPlayedThisTurn += 1;

  // doomfist passive
  if (s.heroId === "doomfist" && isAttack && !isUlt) {
    c.block += 3;
    pushFloat(c, "+3", "block", "player");
  }

  // strength gain
  if (card.strength) {
    c.strength += card.strength;
    pushFloat(c, `+${card.strength} STR`, "buff", "player");
  }
  // block
  if (card.block) {
    c.block += card.block;
    pushFloat(c, `+${card.block}`, "block", "player");
  }
  // heal (overheal converts the wasted portion into Block)
  if (card.heal) {
    const healed = Math.min(card.heal, c.maxHp - c.hp);
    c.hp += healed;
    if (healed > 0) pushFloat(c, `+${healed}`, "heal", "player");
    const wasted = card.heal - healed;
    if (card.overheal && wasted > 0) {
      c.block += wasted;
      pushFloat(c, `+${wasted}`, "block", "player");
    }
  }
  // energy gain
  if (card.energyGain) c.energy += card.energyGain;
  // draw
  if (card.draw) drawCards(c, card.draw);
  // combo payoff (Genji)
  if (comboMet) {
    if (card.comboDraw) drawCards(c, card.comboDraw);
    if (card.comboEnergy) c.energy += card.comboEnergy;
    pushFloat(c, "COMBO", "buff", "player");
  }
  // overclock arms the end-of-turn energy payoff (Tracer)
  if (card.overclock) {
    c.overclock = card.overclock;
    pushFloat(c, "OVERCLOCK", "buff", "player");
  }
  // self damage
  if (card.selfDamage) {
    // Junkrat's Total Mayhem soaks the first 3 damage of every self-blast.
    const soak = s.heroId === "junkrat" ? 3 : 0;
    const selfDmg = Math.max(0, card.selfDamage - soak);
    if (selfDmg > 0) {
      c.hp -= selfDmg;
      c.damageTakenThisCombat += selfDmg;
      pushFloat(c, `-${selfDmg}`, "dmg", "player");
    }
  }
  // deal damage
  if (scaled > 0) {
    const hits = card.hits ?? 1;
    let bonus = 0;
    if (card.bonusIfAttack && c.attacksPlayedThisTurn > (isAttack ? 1 : 0)) bonus = card.bonusIfAttack;
    const totalBase = scaled + bonus;
    const targets: EnemyInstance[] = card.aoe
      ? c.enemies.filter((e) => !e.isDead && !e.untargetable)
      : [
          c.enemies.find((e) => e.uid === targetUid && !e.isDead && !e.untargetable) ??
            c.enemies.find((e) => !e.isDead && !e.untargetable)!,
        ].filter(Boolean);
    for (const t of targets) {
      if (!t) continue;
      for (let h = 0; h < hits; h++) {
        if (t.isDead) break;
        const dealt = applyEnemyDamage(c, t, totalBase, charge, powerCell);
        pushFloat(c, `${dealt}`, "dmg", t.uid);
        // Doomfist: executions feed permanent Strength
        if (t.isDead && card.strengthOnKill) {
          c.strength += card.strengthOnKill;
          pushFloat(c, `+${card.strengthOnKill} STR`, "buff", "player");
          pushLog(c, `${card.name} executes ${t.name} — +${card.strengthOnKill} Strength.`);
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
  // Moira: Coalescence sustained beam
  if (card.beam) {
    const target =
      c.enemies.find((e) => e.uid === targetUid && !e.isDead && !e.untargetable) ??
      c.enemies.find((e) => !e.isDead && !e.untargetable);
    if (target) {
      c.beams.push({ targetUid: target.uid, damage: card.beam.damage, heal: card.beam.heal, turns: card.beam.turns });
      const dealt = applyEnemyDamage(c, target, card.beam.damage, charge, powerCell);
      pushFloat(c, `${dealt}`, "dmg", target.uid);
      const healed = Math.min(c.maxHp - c.hp, card.beam.heal);
      if (healed > 0) {
        c.hp += healed;
        pushFloat(c, `+${healed}`, "heal", "player");
      }
      pushLog(c, "COALESCENCE — the beam locks on.");
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
  c.ultCharge = Math.min(100, charge.v);
  c.targetingCardUid = null;

  // move to discard/exhaust
  if (!isUlt) {
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

  pushLog(c, `Played ${card.name}`);

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
  // bank hp
  let hp = c.hp;
  let gold = s.gold;
  const has = (id: string) => s.relics.includes(id);
  // post-combat healing relics
  if (has("vampire_fang")) hp = Math.min(s.maxHp, hp + 6);
  if (has("blood_pact")) hp = Math.min(s.maxHp, hp + Math.ceil(s.maxHp * 0.08));
  // gold reward
  const baseGold = c.nodeType === "boss" ? 60 : c.nodeType === "elite" ? 35 : 18;
  let g = baseGold + new Rng(s.seed ^ (s.floorsCleared * 7)).int(0, 10);
  if (has("lucky_coin")) g = Math.floor(g * 1.75);
  if (has("salvage_claw")) g += 20;
  gold += g;
  const floorsCleared = s.floorsCleared + 1;
  // card reward
  const rng = rngForRun(s.seed, 9000 + floorsCleared);
  const pool = [...getHero(s.heroId).cardPool, ...NEUTRAL_POOL];
  const choices: CardInstance[] = [];
  const remaining = [...pool];
  const offers = has("codex_shard") ? 4 : 3;
  for (let i = 0; i < offers && remaining.length > 0; i++) {
    const id = rng.pick(remaining);
    remaining.splice(remaining.indexOf(id), 1); // no duplicate offers
    choices.push(makeCard(id, rng.chance(0.12)));
  }

  // ---- relic drops: bosses and elites always, normal fights sometimes ----
  const ownedIds = new Set(s.relics);
  const availRelics = ALL_RELIC_IDS.filter((r) => !ownedIds.has(r));
  const dropChance =
    c.nodeType === "boss" || c.nodeType === "elite" ? 1 : has("relic_scanner") ? 0.35 : 0.18;
  const droppedRelic =
    availRelics.length > 0 && rng.chance(dropChance)
      ? (pickRelicId(availRelics, rng.next()) ?? null)
      : null;
  const relics = droppedRelic ? [...s.relics, droppedRelic] : s.relics;

  // boss -> next act or victory
  if (c.nodeType === "boss") {
    if (s.act < ACT_BOSSES.length - 1) {
      const nextAct = s.act + 1;
      const newMap = generateMap(rngForRun(s.seed, 7000 + nextAct * 131));
      const nextMaxHp = maxHpFor(s.heroId, relics, nextAct, s.meta.upgrades);
      set({
        hp: Math.min(nextMaxHp, hp + Math.floor(nextMaxHp * 0.35)),
        maxHp: nextMaxHp,
        gold,
        relics,
        floorsCleared,
        act: nextAct,
        map: newMap,
        currentNodeId: null,
        phase: droppedRelic ? "treasure" : "map",
        pendingRelic: droppedRelic,
        rewardChoices: choices,
        rewardGold: g,
        combat: null,
      });
      return;
    }
    const meta = {
      ...s.meta,
      credits: s.meta.credits + Math.floor((200 + floorsCleared) * upgradeCreditMult(s.meta.upgrades)),
      bestFloor: Math.max(s.meta.bestFloor, floorsCleared),
      totalRuns: s.meta.totalRuns + 1,
    };
    saveMeta(meta);
    set({ hp, gold, floorsCleared, phase: "victory", combat: null, meta });
    return;
  }

  set({
    hp,
    maxHp: maxHpFor(s.heroId, relics, s.act, s.meta.upgrades),
    gold,
    relics,
    floorsCleared,
    phase: "reward",
    pendingRelic: droppedRelic,
    rewardChoices: choices,
    rewardGold: g,
    combat: null,
  });
}


function handleDeath(set: any, get: () => GameState) {
  const s = get();
  const credits = Math.floor((s.floorsCleared * 8 + s.gold * 0.2) * upgradeCreditMult(s.meta.upgrades));
  const meta = {
    ...s.meta,
    credits: s.meta.credits + credits,
    bestFloor: Math.max(s.meta.bestFloor, s.floorsCleared),
    totalRuns: s.meta.totalRuns + 1,
  };
  saveMeta(meta);
  set({ phase: "dead", combat: null, meta });
}

function markNodeVisited(set: any, get: () => GameState) {
  const s = get();
  const map = s.map.map((n) => (n.id === s.currentNodeId ? { ...n, visited: true } : n));
  set({ map });
}

function openShop(set: any, get: () => GameState, rng: Rng) {
  const s = get();
  const pool = [...getHero(s.heroId).cardPool, ...NEUTRAL_POOL];
  const shopCards: CardInstance[] = [];
  const stock = [...pool];
  for (let i = 0; i < 5 && stock.length > 0; i++) {
    const id = rng.pick(stock);
    stock.splice(stock.indexOf(id), 1); // distinct stock, no duplicate listings
    shopCards.push(makeCard(id, rng.chance(0.25)));
  }
  const owned = new Set(s.relics);
  let avail = ALL_RELIC_IDS.filter((r) => !owned.has(r));
  const shopRelics: string[] = [];
  for (let i = 0; i < 3; i++) {
    const id = pickRelicId(avail, rng.next());
    if (!id) break;
    shopRelics.push(id);
    avail = avail.filter((r) => r !== id);
  }
  while (shopRelics.length < 3) shopRelics.push("");
  set({ phase: "shop", shopCards, shopRelics });
}

export function cardPrice(card: CardInstance): number {
  const base = card.rarity === "rare" ? 90 : card.rarity === "uncommon" ? 60 : 40;
  return card.upgraded ? base + 20 : base;
}

/** Shop price for a relic, scaled by tier. */
export function relicPrice(relicId: string): number {
  const tier = RELICS[relicId]?.tier ?? "common";
  return tier === "rare" ? 190 : tier === "uncommon" ? 145 : 110;
}


export { HEROES, RELICS, CARDS, tracerImg };

function scrambleHand(c: Combat) {
  if (c.hand.length === 0) return;
  const idx = Math.floor(Math.random() * c.hand.length);
  const ids = Object.keys(CARDS);
  const newId = ids[Math.floor(Math.random() * ids.length)]!;
  c.hand[idx] = makeCard(newId, false);
}
