/**
 * Headless simulation core for OVERTUNG.
 *
 * Drives the real Zustand store with a heuristic bot so we can run tens of
 * thousands of runs and mine the results for balance/stability data.
 * Shared by playtest.test.ts (small smoke run) and the mass-sim harness.
 */
import { useGame } from "./store";
import { STARTER_HEROES, UNLOCKABLE_HEROES } from "./heroes";
import { ALL_RELIC_IDS } from "./relics";

export const ALL_HEROES = [...STARTER_HEROES, ...UNLOCKABLE_HEROES];

export interface RunResult {
  hero: string;
  seed: string;
  floors: number;
  act: number;
  won: boolean;
  turns: number;
  combats: number;
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
  error?: string;
}

interface BotOpts {
  /** unlock everything (default) or use default meta */
  fullUnlock?: boolean;
}

export function simulateRun(hero: string, seed: string, opts: BotOpts = {}): RunResult {
  const g = () => useGame.getState();
  useGame.setState({
    meta: {
      unlockedHeroes: ALL_HEROES,
      unlockedRelics: opts.fullUnlock === false ? [] : [...ALL_RELIC_IDS],
      credits: 0,
      bestFloor: 0,
      playerName: "sim",
      totalRuns: 0,
      upgrades: {},
    },
  });
  g().startRun(hero, seed);

  const res: RunResult = {
    hero,
    seed,
    floors: 0,
    act: 0,
    won: false,
    turns: 0,
    combats: 0,
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
  };

  let steps = 0;
  let playsThisTurn = 0;
  let lastTurnKey = "";
  let lastNodeType = "";
  const MAX_STEPS = 12000;

  while (steps++ < MAX_STEPS) {
    const s = g();
    if (!s.inRun) break;

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
      if (!res.won) res.deathNode = lastNodeType;
      return res;
    }

    switch (s.phase) {
      case "relic_choice": {
        const choices = s.startingRelicChoices;
        if (choices.length === 0) {
          s.toMap();
        } else {
          s.chooseStartingRelic(choices[Math.floor(Math.random() * choices.length)]!);
        }
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
        const pick =
          options.find((n) => n.type === "rest" && s.hp < s.maxHp * 0.55) ??
          options.find((n) => n.type === "treasure") ??
          options.find((n) => n.type === "shop" && s.gold > 180) ??
          options.find((n) => n.type === "elite" && s.hp > s.maxHp * 0.8) ??
          options[0]!;
        lastNodeType = pick.type;
        if (pick.type === "combat" || pick.type === "elite" || pick.type === "boss") res.combats++;
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
            // focus the lowest-HP threatening enemy
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
          s.endTurn();
          break;
        }

        const playable = c.hand.filter(
          (card) => card.cost <= c.energy && card.type !== c.hackedType,
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
          s.endTurn();
        }
        break;
      }
      case "reward": {
        const choices = s.rewardChoices;
        if (choices.length > 0) {
          // prefer a card the deck doesn't already have a lot of
          const counts: Record<string, number> = {};
          for (const cd of s.deck) counts[cd.id] = (counts[cd.id] ?? 0) + 1;
          const sorted = [...choices].sort(
            (a, b) => (counts[a.id] ?? 0) - (counts[b.id] ?? 0),
          );
          s.pickRewardCard(sorted[0]!.id);
        } else s.skipReward();
        break;
      }
      case "rest": {
        if (s.hp < s.maxHp * 0.7) {
          res.restHeals++;
          s.restHeal();
        } else {
          const up = s.deck.find((c) => !c.upgraded);
          if (up) s.restUpgrade(up.uid);
          else {
            res.restHeals++;
            s.restHeal();
          }
        }
        break;
      }
      case "shop": {
        const goldBefore = s.gold;
        const relicIdx = s.shopRelics.findIndex((r) => !!r);
        const bloat = s.deck.find((c) => c.id === "n_strike" || c.id === "n_block");
        if (relicIdx >= 0) s.buyRelic(relicIdx);
        else if (bloat && s.gold >= 120 && s.deck.length > 14) s.buyRemove(bloat.uid);
        else if (s.shopCards.length > 0 && s.gold >= 160) s.buyCard(0);
        if (g().gold === goldBefore) s.leaveShop();
        break;
      }

      case "treasure": {
        s.takeTreasure();
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
  errors: string[];
  perHero: Record<string, { runs: number; wins: number; winRate: number; avgFloors: number }>;
  deathsByAct: Record<number, number>;
  deathsByNode: Record<string, number>;
  cardUse: Record<string, number>;
  relicWin: Record<string, { n: number; wins: number }>;
  avgGoldLeft: number;
  avgDeckSize: number;
  avgWastedEnergy: number;
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
    turns += r.turns;
    combats += r.combats;
  }
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
    errors: results.filter((r) => r.error).map((r) => `${r.hero}/${r.seed}: ${r.error}`),
    perHero,
    deathsByAct,
    deathsByNode,
    cardUse,
    relicWin,
    avgGoldLeft: results.reduce((a, r) => a + r.goldLeft, 0) / results.length,
    avgDeckSize: results.reduce((a, r) => a + r.deckSize, 0) / results.length,
    avgWastedEnergy: results.reduce((a, r) => a + r.wastedEnergy, 0) / results.length,
  };
}
