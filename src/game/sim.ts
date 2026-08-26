/**
 * Headless simulation core for OVERTUNG.
 *
 * Drives the real Zustand store with a heuristic bot so we can run tens of
 * thousands of runs and mine the results for balance/stability data.
 * Shared by playtest.test.ts (small smoke run) and the mass-sim harness.
 */
import { useGame, cardPrice, computeScore, effectiveCost, relicPrice, type GameState } from "./store";
import { STARTER_HEROES, UNLOCKABLE_HEROES } from "./heroes";
import { ALL_RELIC_IDS } from "./relics";
import { AUGMENTS } from "./progression";

export const ALL_HEROES = [...STARTER_HEROES, ...UNLOCKABLE_HEROES];

export interface RunResult {
  hero: string;
  seed: string;
  floors: number;
  act: number;
  won: boolean;
  turns: number;
  combats: number;
  turnsByNode: Record<string, number>;
  combatsByNode: Record<string, number>;
  deathNode: string | null;
  deathEnemy: string | null;
  goldLeft: number;
  relics: string[];
  deckSize: number;
  cardsPlayed: Record<string, number>;
  wastedEnergy: number;
  ultsUsed: number;
  restHeals: number;
  hpPct: number;
  minHpPct: number;
  totalDamageTaken: number;
  maxDamageInTurn: number;
  creditsEarned: number;
  augments: string[];
  contractsCompleted: number;
  rewardsSkipped: number;
  treasureBreaches: number;
  treasureSalvages: number;
  cardsAdded: number;
  cardsRemoved: number;
  cardsUpgraded: number;
  shopsVisited: number;
  restsVisited: number;
  elitesVisited: number;
  bossKills: number;
  error?: string;
}

interface BotOpts {
  /** unlock everything (default) or use specific meta */
  meta?: GameState["meta"];
  fullUnlock?: boolean;
  policy?: "balanced" | "lean" | "greedy" | "risk";
}

function seedRoll(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function cardScore(card: { id: string; type: string; cost: number; rarity: string; damage?: number; block?: number; heal?: number; draw?: number; strength?: number; vulnerable?: number; weak?: number; exhaust?: boolean }, hero: string, counts: Record<string, number>, deckSize: number, policy: NonNullable<BotOpts["policy"]>): number {
  let score = 0;
  score += (card.damage ?? 0) * (card.type === "attack" ? 1.2 : 0.65);
  score += (card.block ?? 0) * 0.72;
  score += (card.heal ?? 0) * 0.9;
  score += (card.draw ?? 0) * 4.2;
  score += (card.strength ?? 0) * 8;
  score += (card.vulnerable ?? 0) * 4;
  score += (card.weak ?? 0) * 3;
  score += card.rarity === "rare" ? 8 : card.rarity === "uncommon" ? 4 : 0;
  if (card.exhaust) score += 2;
  score -= card.cost * 2.5;
  score -= (counts[card.id] ?? 0) * (policy === "lean" ? 12 : 8);
  if (deckSize > 26 && card.rarity === "common") score -= 6;
  if (policy === "greedy") score += card.rarity === "rare" ? 6 : 2;
  if (policy === "lean") score -= deckSize > 22 ? 5 : 0;
  if (hero === "genji" && card.cost === 0) score += 4;
  if (hero === "tracer" && (card.draw ?? 0) > 0) score += 3;
  if (hero === "mercy" && ((card.heal ?? 0) > 0 || (card.weak ?? 0) > 0)) score += 3;
  if (hero === "reinhardt" && ((card.block ?? 0) > 0 || card.id.startsWith("rein_"))) score += 3;
  return score;
}

export function simulateRun(hero: string, seed: string, opts: BotOpts = {}): RunResult {
  const g = () => useGame.getState();
  
  const initialMeta = opts.meta || {
    unlockedHeroes: opts.fullUnlock === false ? [...STARTER_HEROES] : ALL_HEROES,
    unlockedRelics: opts.fullUnlock === false ? [] : [...ALL_RELIC_IDS],
    credits: 0,
    bestFloor: 0,
    playerName: "sim",
    totalRuns: 0,
    upgrades: {},
  };

  useGame.setState({ meta: initialMeta });
  g().startRun(hero, seed);

  const res: RunResult = {
    hero,
    seed,
    floors: 0,
    act: 0,
    won: false,
    turns: 0,
    combats: 0,
    turnsByNode: {},
    combatsByNode: {},
    deathNode: null,
    deathEnemy: null,
    goldLeft: 0,
    relics: [],
    deckSize: 0,
    cardsPlayed: {},
    wastedEnergy: 0,
    ultsUsed: 0,
    restHeals: 0,
    hpPct: 1,
    minHpPct: 1,
    totalDamageTaken: 0,
    maxDamageInTurn: 0,
    creditsEarned: 0,
    augments: [],
    contractsCompleted: 0,
    rewardsSkipped: 0,
    treasureBreaches: 0,
    treasureSalvages: 0,
    cardsAdded: 0,
    cardsRemoved: 0,
    cardsUpgraded: 0,
    shopsVisited: 0,
    restsVisited: 0,
    elitesVisited: 0,
    bossKills: 0,
  };

  let steps = 0;
  let playsThisTurn = 0;
  let lastTurnKey = "";
  let lastNodeType = "";
  let lastHp = g().hp;
  const MAX_STEPS = 15000;

  while (steps++ < MAX_STEPS) {
    const s = g();
    if (!s.inRun) break;

    const currentHpPct = s.hp / s.maxHp;
    if (currentHpPct < res.minHpPct) res.minHpPct = currentHpPct;
    
    if (s.hp < lastHp) {
        const diff = lastHp - s.hp;
        res.totalDamageTaken += diff;
        if (diff > res.maxDamageInTurn) res.maxDamageInTurn = diff;
    }
    lastHp = s.hp;

    if (!Number.isFinite(s.hp) || !Number.isFinite(s.gold) || s.gold < 0 || s.hp > s.maxHp) {
      res.error = `bad state hp=${s.hp}/${s.maxHp} gold=${s.gold}`;
      return res;
    }

    if (s.phase === "dead" || s.phase === "victory") {
      res.floors = s.floorsCleared;
      res.act = s.act;
      res.won = s.phase === "victory";
      res.goldLeft = s.gold;
      res.relics = [...s.relics];
      res.deckSize = s.deck.length;
      res.hpPct = s.hp / s.maxHp;
      res.creditsEarned = computeScore(s.floorsCleared, s.act, s.gold, res.won);
      res.augments = [...s.augments];
      res.contractsCompleted = s.contractsCompleted;
      res.bossKills = res.won ? 4 : s.act;
      if (!res.won) res.deathNode = lastNodeType;
      return res;
    }

    switch (s.phase) {
      case "relic_choice": {
        const choices = s.startingRelicChoices;
        if (choices.length === 0) {
          s.toMap();
        } else {
          const idx = Math.floor(seedRoll(seed, 11) * choices.length);
          s.chooseStartingRelic(choices[idx]!);
        }
        break;
      }
      case "augment_choice": {
        const styleOrder = opts.policy === "risk"
          ? ["burst", "engine", "tempo", "survival"]
          : opts.policy === "lean"
            ? ["engine", "survival", "tempo", "burst"]
            : ["engine", "tempo", "survival", "burst"];
        const choice = [...s.augmentChoices].sort((a, b) => {
          const aa = AUGMENTS[a];
          const bb = AUGMENTS[b];
          const pa = aa ? styleOrder.indexOf(aa.style) : 99;
          const pb = bb ? styleOrder.indexOf(bb.style) : 99;
          return pa - pb;
        })[0];
        if (choice) s.chooseAugment(choice);
        else s.toMap();
        break;
      }
      case "map": {
        const current = s.map.find((n) => n.id === s.currentNodeId) ?? null;
        const options = current
          ? s.map.filter((n) => current.next.includes(n.id))
          : s.map.filter((n) => n.col === 0);
        if (options.length === 0) {
          res.error = "soft-lock: no map options";
          return res;
        }
        const preferRisk = opts.policy === "risk" || (opts.policy === "greedy" && s.hp > s.maxHp * 0.62);
        const pick =
          options.find((n) => n.type === "rest" && s.hp < s.maxHp * (opts.policy === "risk" ? 0.38 : 0.55)) ??
          options.find((n) => n.type === "elite" && preferRisk && s.hp > s.maxHp * 0.62) ??
          options.find((n) => n.type === "treasure" && opts.policy !== "lean") ??
          options.find((n) => n.type === "shop" && s.gold > (opts.policy === "lean" ? 240 : 170)) ??
          options.find((n) => n.type === "elite" && s.hp > s.maxHp * 0.78) ??
          options.find((n) => n.type === "treasure") ??
          options[0]!;
        lastNodeType = pick.type;
        if (pick.type === "combat" || pick.type === "elite" || pick.type === "boss") {
          res.combats++;
          res.combatsByNode[pick.type] = (res.combatsByNode[pick.type] ?? 0) + 1;
        }
        if (pick.type === "elite") res.elitesVisited++;
        if (pick.type === "shop") res.shopsVisited++;
        if (pick.type === "rest") res.restsVisited++;
        s.enterNode(pick.id);
        break;
      }
      case "combat": {
        const c = s.combat!;
        if (c.energy < 0 || !Number.isFinite(c.hp)) {
          res.error = "bad combat state";
          return res;
        }
        const total =
          c.drawPile.length + c.hand.length + c.discardPile.length + c.exhaustPile.length;
        if (total <= 0) {
          res.error = "deck vanished";
          return res;
        }

        if (c.fracturePending) {
          s.chooseFracture("damage");
          break;
        }
        if (c.targetingCardUid) {
          const alive = c.enemies.filter((e) => !e.isDead);
          if (alive.length === 0) s.cancelTarget();
          else {
            const sorted = [...alive].sort((a, b) => a.hp - b.hp);
            s.selectTarget(sorted[0]!.uid);
          }
          break;
        }
        if (c.ultCharge >= 100 && !c.ultUsedThisCombat) {
          res.ultsUsed++;
          s.useUltimate();
          break;
        }

        const turnKey = `${c.turn}_${c.enemies.map((e) => e.uid).join("")}`;
        if (turnKey !== lastTurnKey) {
          lastTurnKey = turnKey;
          playsThisTurn = 0;
        }
        if (playsThisTurn > 40) {
          playsThisTurn = 0;
          res.turns++;
          res.turnsByNode[lastNodeType] = (res.turnsByNode[lastNodeType] ?? 0) + 1;
          s.endTurn();
          break;
        }

        const playable = c.hand.filter(
          (card) =>
            effectiveCost(card, c) <= c.energy &&
            card.type !== c.hackedType &&
            (!card.goldCost || s.gold >= card.goldCost),
        );
        if (playable.length > 0) {
          const setup = playable.find(
            (x) =>
              x.type !== "attack" &&
              ((x.poison ?? 0) > 0 || (x.poisonBoost ?? 0) > 0 || x.poisonSpread || x.poisonDouble),
          );
          const incoming = c.enemies
            .filter((e) => !e.isDead)
            .reduce(
              (n, e) =>
                n +
                (e.intent.type === "attack" || e.intent.type === "attack_block"
                  ? (e.intent.damage ?? 0) * (e.intent.hits ?? 1)
                  : 0),
              0,
            );
          const threatened = incoming > (c.hp + c.block + c.armor) * 0.35;
          const defense = threatened
            ? playable.find(
                (x) =>
                  x.type !== "attack" &&
                  ((x.block ?? 0) > 0 ||
                    (x.armor ?? 0) > 0 ||
                    x.blockFromArmor ||
                    x.blockToArmor),
              )
            : undefined;
          const card =
            defense ?? setup ?? playable.find((x) => x.type === "attack") ?? playable[0]!;
          playsThisTurn++;
          res.cardsPlayed[card.id] = (res.cardsPlayed[card.id] ?? 0) + 1;
          s.playCard(card.uid);
        } else {
          res.wastedEnergy += c.energy;
          res.turns++;
          res.turnsByNode[lastNodeType] = (res.turnsByNode[lastNodeType] ?? 0) + 1;
          s.endTurn();
        }
        break;
      }
      case "reward": {
        const choices = s.rewardChoices;
        if (choices.length > 0) {
          const counts: Record<string, number> = {};
          for (const cd of s.deck) counts[cd.id] = (counts[cd.id] ?? 0) + 1;
          const scored = [...choices]
            .map((card) => ({ card, score: cardScore(card, s.heroId, counts, s.deck.length, opts.policy ?? "balanced") }))
            .sort((a, b) => b.score - a.score);
          const best = scored[0]!;
          const skipThreshold = opts.policy === "greedy" ? -999 : opts.policy === "lean" ? 17 : s.deck.length > 30 ? 18 : 10;
          if (best.score < skipThreshold) {
            res.rewardsSkipped++;
            const before = s.deck.filter((c) => c.upgraded).length;
            s.skipReward();
            const after = g().deck.filter((c) => c.upgraded).length;
            if (after > before) res.cardsUpgraded++;
          } else {
            s.pickRewardCard(best.card.id);
            res.cardsAdded++;
          }
        } else {
          res.rewardsSkipped++;
          s.skipReward();
        }
        break;
      }
      case "rest": {
        if (s.hp < s.maxHp * 0.7) {
          res.restHeals++;
          s.restHeal();
        } else {
          const counts: Record<string, number> = {};
          for (const card of s.deck) counts[card.id] = (counts[card.id] ?? 0) + 1;
          const bloat = s.deck.find((c) => c.rarity === "starter" && (counts[c.id] ?? 0) > 1);
          const up = s.deck.find((c) => !c.upgraded);
          if (bloat && s.deck.length > 10) {
            s.restRecycle(bloat.uid);
            res.cardsRemoved++;
          } else if (up) {
            s.restUpgrade(up.uid);
            res.cardsUpgraded++;
          }
          else {
            res.restHeals++;
            s.restHeal();
          }
        }
        break;
      }
      case "shop": {
        const goldBefore = s.gold;
        const relicIdx = s.shopRelics.findIndex((r) => !!r && relicPrice(r) <= s.gold);
        const counts: Record<string, number> = {};
        for (const card of s.deck) counts[card.id] = (counts[card.id] ?? 0) + 1;
        const bloat = s.deck.find((c) => c.rarity === "starter" && (counts[c.id] ?? 0) > 1);
        if (relicIdx >= 0) s.buyRelic(relicIdx);
        else if (bloat && s.gold >= 120 && s.deck.length > 14) {
          s.buyRemove(bloat.uid);
          if (g().deck.length < s.deck.length) res.cardsRemoved++;
        }
        else if (s.shopCards.length > 0 && s.gold >= 160) {
          const counts: Record<string, number> = {};
          for (const cd of s.deck) counts[cd.id] = (counts[cd.id] ?? 0) + 1;
          const scored = s.shopCards
            .map((card, i) => ({ i, card, score: cardScore(card, s.heroId, counts, s.deck.length, opts.policy ?? "balanced") }))
            .filter(({ card }) => cardPrice(card) <= s.gold);
          scored.sort((a, b) => b.score - a.score);
          const buy = scored[0];
          if (buy && buy.score > 20) {
            s.buyCard(buy.i);
            if (g().deck.length > s.deck.length) res.cardsAdded++;
          }
        }
        if (g().gold === goldBefore) s.leaveShop();
        break;
      }

      case "treasure": {
        const mode = opts.policy === "risk" || s.hp > s.maxHp * 0.62 ? "breach" : "salvage";
        if (mode === "breach") res.treasureBreaches++;
        else res.treasureSalvages++;
        s.takeTreasure(mode);
        break;
      }
      default:
        s.toMap();
    }
  }

  res.error = `no termination (phase=${g().phase})`;
  res.floors = g().floorsCleared;
  return res;
}

export interface Report {
  runs: number;
  wins: number;
  winRate: number;
  avgFloors: number;
  avgTurnsPerCombat: number;
  avgTurnsByNode: Record<string, number>;
  errors: string[];
  perHero: Record<string, { runs: number; wins: number; winRate: number; avgFloors: number }>;
  deathsByAct: Record<number, number>;
  deathsByNode: Record<string, number>;
  cardUse: Record<string, number>;
  relicWin: Record<string, { n: number; wins: number }>;
  avgGoldLeft: number;
  avgDeckSize: number;
  avgWastedEnergy: number;
  avgMinHpPct: number;
  avgTotalDamageTaken: number;
  avgMaxDamageInTurn: number;
  avgCreditsEarned: number;
  augmentUse: Record<string, number>;
  avgContractsCompleted: number;
  avgRewardsSkipped: number;
  avgTreasureBreaches: number;
  avgTreasureSalvages: number;
  avgCardsAdded: number;
  avgCardsRemoved: number;
  avgCardsUpgraded: number;
  avgShopsVisited: number;
  avgRestsVisited: number;
  avgElitesVisited: number;
  avgBossKills: number;
}

export function summarize(results: RunResult[]): Report {
  const wins = results.filter((r) => r.won).length;
  const perHero: Report["perHero"] = {};
  const deathsByAct: Record<number, number> = {};
  const deathsByNode: Record<string, number> = {};
  const cardUse: Record<string, number> = {};
  const relicWin: Record<string, { n: number; wins: number }> = {};
  let turns = 0;
  let combats = 0;
  const turnsByNode: Record<string, number> = {};
  const combatsByNode: Record<string, number> = {};
  for (const r of results) {
    const h = (perHero[r.hero] ??= { runs: 0, wins: 0, winRate: 0, avgFloors: 0 });
    h.runs++;
    if (r.won) h.wins++;
    h.avgFloors += r.floors;
    if (!r.won) {
      deathsByAct[r.act] = (deathsByAct[r.act] ?? 0) + 1;
      if (r.deathNode) deathsByNode[r.deathNode] = (deathsByNode[r.deathNode] ?? 0) + 1;
    }
    for (const [k, v] of Object.entries(r.cardsPlayed)) cardUse[k] = (cardUse[k] ?? 0) + v;
    for (const id of r.relics) {
      const e = (relicWin[id] ??= { n: 0, wins: 0 });
      e.n++;
      if (r.won) e.wins++;
    }
    for (const id of r.augments) cardUse[`augment:${id}`] = (cardUse[`augment:${id}`] ?? 0) + 1;
    turns += r.turns;
    combats += r.combats;
    for (const [k, v] of Object.entries(r.turnsByNode)) turnsByNode[k] = (turnsByNode[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.combatsByNode)) combatsByNode[k] = (combatsByNode[k] ?? 0) + v;
  }
  const augmentUse = Object.fromEntries(
    Object.entries(cardUse)
      .filter(([k]) => k.startsWith("augment:"))
      .map(([k, v]) => [k.slice("augment:".length), v]),
  );
  for (const h of Object.values(perHero)) {
    h.winRate = h.wins / h.runs;
    h.avgFloors /= h.runs;
  }
  return {
    runs: results.length,
    wins,
    winRate: wins / results.length,
    avgFloors: results.reduce((a, r) => a + r.floors, 0) / results.length,
    avgTurnsPerCombat: combats ? turns / combats : 0,
    avgTurnsByNode: Object.fromEntries(
      Object.keys(combatsByNode).map((k) => [k, (turnsByNode[k] ?? 0) / (combatsByNode[k] || 1)]),
    ),
    errors: results.filter((r) => r.error).map((r) => `${r.hero}/${r.seed}: ${r.error}`),
    perHero,
    deathsByAct,
    deathsByNode,
    cardUse,
    relicWin,
    avgGoldLeft: results.reduce((a, r) => a + r.goldLeft, 0) / results.length,
    avgDeckSize: results.reduce((a, r) => a + r.deckSize, 0) / results.length,
    avgWastedEnergy: results.reduce((a, r) => a + r.wastedEnergy, 0) / results.length,
    avgMinHpPct: results.reduce((a, r) => a + r.minHpPct, 0) / results.length,
    avgTotalDamageTaken: results.reduce((a, r) => a + r.totalDamageTaken, 0) / results.length,
    avgMaxDamageInTurn: results.reduce((a, r) => a + r.maxDamageInTurn, 0) / results.length,
    avgCreditsEarned: results.reduce((a, r) => a + r.creditsEarned, 0) / results.length,
    augmentUse,
    avgContractsCompleted: results.reduce((a, r) => a + r.contractsCompleted, 0) / results.length,
    avgRewardsSkipped: results.reduce((a, r) => a + r.rewardsSkipped, 0) / results.length,
    avgTreasureBreaches: results.reduce((a, r) => a + r.treasureBreaches, 0) / results.length,
    avgTreasureSalvages: results.reduce((a, r) => a + r.treasureSalvages, 0) / results.length,
    avgCardsAdded: results.reduce((a, r) => a + r.cardsAdded, 0) / results.length,
    avgCardsRemoved: results.reduce((a, r) => a + r.cardsRemoved, 0) / results.length,
    avgCardsUpgraded: results.reduce((a, r) => a + r.cardsUpgraded, 0) / results.length,
    avgShopsVisited: results.reduce((a, r) => a + r.shopsVisited, 0) / results.length,
    avgRestsVisited: results.reduce((a, r) => a + r.restsVisited, 0) / results.length,
    avgElitesVisited: results.reduce((a, r) => a + r.elitesVisited, 0) / results.length,
    avgBossKills: results.reduce((a, r) => a + r.bossKills, 0) / results.length,
  };
}
