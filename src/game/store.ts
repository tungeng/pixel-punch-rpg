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
import { HEROES, UNLOCKABLE_HEROES } from "./heroes";
import { ENEMIES, ELITE_POOL, BOSSES, ACT_BOSSES } from "./enemies";
import { RELICS, ALL_RELIC_IDS } from "./relics";
import { generateMap } from "./mapgen";
import tracerImg from "../assets/tracer.png";
import kingsrowImg from "../assets/bg_kingsrow.jpg";
import factoryImg from "../assets/bg_factory.jpg";

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
}

export interface GameState {
  // meta (persisted)
  meta: {
    unlockedHeroes: string[];
    credits: number;
    bestFloor: number;
    totalRuns: number;
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
  buyCard: (index: number) => void;
  buyRelic: (index: number) => void;
  buyRemove: (cardUid: string) => void;
  leaveShop: () => void;
  toMap: () => void;
  abandon: () => void;
  addFloat: (f: Omit<Float, "id" | "at">) => void;
  pruneFloats: () => void;
}

const META_KEY = "chronobreak_meta_v1";

function defaultMeta() {
  return { unlockedHeroes: ["tracer", "mercy", "genji"], credits: 0, bestFloor: 0, totalRuns: 0 };
}

let floatId = 1;

function loadMetaFromStorage() {
  if (typeof window === "undefined") return defaultMeta();
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return defaultMeta();
    const m = { ...defaultMeta(), ...JSON.parse(raw) };
    if (!Array.isArray(m.unlockedHeroes)) m.unlockedHeroes = ["tracer", "mercy", "genji"];
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
  return e;
}

function drawCountFor(heroId: string, relics: string[]): number {
  let d = 5;
  if (heroId === "genji") d += 1;
  if (relics.includes("draw_charm")) d += 1;
  return d;
}

function maxHpFor(heroId: string, relics: string[]): number {
  let h = getHero(heroId).maxHp;
  if (relics.includes("gold_heart")) h += 25;
  return h;
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
  charge.v += relicPower ? dmg * 1.5 : dmg;
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
  // thorn mail
  return remaining;
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
    const maxHp = maxHpFor(heroId, relics);
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
      gold: 0,
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
      const id = rng.pick(ELITE_POOL);
      const def = ENEMIES[id]!;
      enemies = [spawnEnemy(def, rng, `e_${Date.now()}_0`)];
      if (rng.chance(0.3 + s.act * 0.15)) {
        const id2 = rng.pick(ELITE_POOL.filter((x) => x !== id)) ?? ELITE_POOL[0]!;
        enemies.push(spawnEnemy(ENEMIES[id2]!, rng, `e_${Date.now()}_1`));
      }
    } else {
      const pool = ["talon_trooper", "omnic_grunt", "sweeper_bot", "sniper"];
      const r = rng.next();
      const count = r < 0.4 ? 1 : r < 0.9 ? 2 : 3;
      for (let i = 0; i < count; i++) {
        const id = rng.pick(pool);
        enemies.push(spawnEnemy(ENEMIES[id]!, rng, `e_${Date.now()}_${i}`));
      }
    }
    // Difficulty curve: the breach hardens the deeper you fall.
    const floor = s.floorsCleared;
    const hpScale = 1 + floor * 0.085 + s.act * 0.3;
    const strBonus =
      Math.floor(floor / 4) + s.act + (nodeType === "elite" ? 2 + s.act : 0);
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
    const maxHp = s.hp;
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
    };
    // barrier_start relic
    if (s.relics.includes("barrier_start")) combat.block = 10;
    // berserker relic
    if (s.relics.includes("berserker")) combat.strength = 1;
    set({ combat, phase: "combat" });
  },

  playCard: (uid, targetUid) => {
    const s = get();
    const c = s.combat;
    if (!c || !c.active) return;
    const idx = c.hand.findIndex((x) => x.uid === uid);
    if (idx < 0) return;
    const card = c.hand[idx]!;
    if (card.cost > c.energy) return;
    const livingEnemies = c.enemies.filter((e) => !e.isDead && !e.untargetable);
    const needsTarget = (card.damage ?? 0) > 0 && !card.aoe && livingEnemies.length > 1;
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
    // discard hand (non-retain)
    const retain = c.hand.filter((card) => card.retain);
    const discard = c.hand.filter((card) => !card.retain);
    c.discardPile = [...c.discardPile, ...discard];
    c.hand = retain;
    // enemy phase
    const charge = { v: c.ultCharge };
    const relics = s.relics;
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
      if (e.mechanic === "phase" && !e.enraged && e.hp <= e.maxHp * 0.5) {
        e.enraged = true;
        e.strength += 5;
        e.block += 20;
        pushFloat(c, "COALESCENCE", "buff", e.uid);
        pushLog(c, "Moira drops her barrier and burns biotic energy.");
      }
    }
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
          if (relics.includes("thorn_mail") && taken > 0) {
            e.hp -= 2;
            pushFloat(c, "2", "dmg", e.uid);
            if (e.hp <= 0) { e.hp = 0; e.isDead = true; }
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
      }
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
    c.block = 0;
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
    const maxEnergy = maxEnergyFor(s.heroId, relics);
    c.maxEnergy = maxEnergy;
    c.energy = maxEnergy;
    c.cardsPlayedThisTurn = 0;
    c.attacksPlayedThisTurn = 0;
    // draw
    const drawN = drawCountFor(s.heroId, relics);
    drawCards(c, drawN);
    // passive heals
    if (s.heroId === "mercy") c.hp = Math.min(c.maxHp, c.hp + 1);
    if (relics.includes("regen_drone")) c.hp = Math.min(c.maxHp, c.hp + 1);
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
    const needsTarget = (ult.damage ?? 0) > 0 && !ult.aoe && living.length > 1;
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
    set({ deck, phase: "map" });
    markNodeVisited(set, get);
  },

  skipReward: () => {
    set({ phase: "map" });
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
    const relic = rng.pick(avail);
    set({ relics: [...s.relics, relic], phase: "map" });
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
    mechanic: def.mechanic,
    mechanicName: def.mechanicName,
    untargetable: false,
    enraged: false,
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
  if (!isUlt) {
    c.energy -= card.cost;
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
  // heal
  if (card.heal) {
    c.hp = Math.min(c.maxHp, c.hp + card.heal);
    pushFloat(c, `+${card.heal}`, "heal", "player");
  }
  // energy gain
  if (card.energyGain) c.energy += card.energyGain;
  // draw
  if (card.draw) drawCards(c, card.draw);
  // self damage
  if (card.selfDamage) {
    // Junkrat's Total Mayhem soaks the first 3 damage of every self-blast.
    const soak = s.heroId === "junkrat" ? 3 : 0;
    const selfDmg = Math.max(0, card.selfDamage - soak);
    if (selfDmg > 0) {
      c.hp -= selfDmg;
      pushFloat(c, `-${selfDmg}`, "dmg", "player");
    }
  }
  // deal damage
  if (card.damage && card.damage > 0) {
    const hits = card.hits ?? 1;
    let bonus = 0;
    if (card.bonusIfAttack && c.attacksPlayedThisTurn > (isAttack ? 1 : 0)) bonus = card.bonusIfAttack;
    const totalBase = card.damage + bonus;
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
      }
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
    if (card.exhaust) c.exhaustPile.push(card);
    else c.discardPile.push(card);
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
  // vampire_fang
  if (s.relics.includes("vampire_fang")) hp = Math.min(s.maxHp, hp + 3);
  // gold reward
  const baseGold = c.nodeType === "boss" ? 60 : c.nodeType === "elite" ? 35 : 18;
  let g = baseGold + new Rng(s.seed ^ (s.floorsCleared * 7)).int(0, 10);
  if (s.relics.includes("lucky_coin")) g = Math.floor(g * 1.5);
  gold += g;
  const floorsCleared = s.floorsCleared + 1;
  // card reward
  const rng = rngForRun(s.seed, 9000 + floorsCleared);
  const pool = [...getHero(s.heroId).cardPool, ...NEUTRAL_POOL];
  const choices: CardInstance[] = [];
  const remaining = [...pool];
  for (let i = 0; i < 3 && remaining.length > 0; i++) {
    const id = rng.pick(remaining);
    remaining.splice(remaining.indexOf(id), 1); // no duplicate offers
    choices.push(makeCard(id, rng.chance(0.12)));
  }
  // boss -> next act or victory
  if (c.nodeType === "boss") {
    if (s.act < ACT_BOSSES.length - 1) {
      const nextAct = s.act + 1;
      const newMap = generateMap(rngForRun(s.seed, 7000 + nextAct * 131));
      set({
        hp,
        maxHp: maxHpFor(s.heroId, s.relics),
        gold,
        floorsCleared,
        act: nextAct,
        map: newMap,
        currentNodeId: null,
        phase: "map",
        rewardChoices: choices,
        rewardGold: g,
        combat: null,
      });
      return;
    }
    const meta = {
      ...s.meta,
      credits: s.meta.credits + 200 + floorsCleared,
      bestFloor: Math.max(s.meta.bestFloor, floorsCleared),
      totalRuns: s.meta.totalRuns + 1,
    };
    saveMeta(meta);
    set({ hp, gold, floorsCleared, phase: "victory", combat: null, meta });
    return;
  }

  set({
    hp,
    maxHp: maxHpFor(s.heroId, s.relics),
    gold,
    floorsCleared,
    phase: "reward",
    rewardChoices: choices,
    rewardGold: g,
    combat: null,
  });
}

function handleDeath(set: any, get: () => GameState) {
  const s = get();
  const credits = Math.floor(s.floorsCleared * 8 + s.gold * 0.2);
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
  const avail = ALL_RELIC_IDS.filter((r) => !owned.has(r));
  const firstRelic = rng.pick(avail) ?? "";
  const secondRelic = rng.pick(avail.filter((r) => r !== firstRelic)) ?? "";
  const shopRelics = [firstRelic, secondRelic];
  set({ phase: "shop", shopCards, shopRelics });
}

export function cardPrice(card: CardInstance): number {
  const base = card.rarity === "rare" ? 90 : card.rarity === "uncommon" ? 60 : 40;
  return card.upgraded ? base + 20 : base;
}

export { HEROES, RELICS, CARDS, tracerImg };

function scrambleHand(c: Combat) {
  if (c.hand.length === 0) return;
  const idx = Math.floor(Math.random() * c.hand.length);
  const ids = Object.keys(CARDS);
  const newId = ids[Math.floor(Math.random() * ids.length)]!;
  c.hand[idx] = makeCard(newId, false);
}
