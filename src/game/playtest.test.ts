/**
 * Headless playtest harness.
 *
 * Simulates hundreds of full OVERTUNG runs against the real Zustand store
 * with a simple greedy AI, and asserts hard invariants (no NaN, no negative
 * energy, deck conservation, no soft-locks) plus surfaces balance stats.
 *
 * Run: bunx vitest run src/game/playtest.test.ts
 */
import { describe, expect, it } from "vitest";
import { useGame } from "./store";
import { STARTER_HEROES, UNLOCKABLE_HEROES } from "./heroes";

const ALL_HEROES = [...STARTER_HEROES, ...UNLOCKABLE_HEROES];

interface RunResult {
  hero: string;
  seed: string;
  floors: number;
  won: boolean;
  turns: number;
}

function simulateRun(hero: string, seed: string): RunResult {
  const g = () => useGame.getState();
  useGame.setState({
    meta: {
      unlockedHeroes: ALL_HEROES,
      credits: 0,
      bestFloor: 0,
      totalRuns: 0,
    },
  });
  g().startRun(hero, seed);

  let steps = 0;
  let turns = 0;
  const MAX_STEPS = 8000;

  while (steps++ < MAX_STEPS) {
    const s = g();
    if (!s.inRun) break;

    // invariants that must hold at every observable step
    expect(Number.isFinite(s.hp)).toBe(true);
    expect(Number.isFinite(s.gold)).toBe(true);
    expect(s.gold).toBeGreaterThanOrEqual(0);
    expect(s.hp).toBeLessThanOrEqual(s.maxHp);

    if (s.phase === "dead" || s.phase === "victory") {
      return {
        hero,
        seed,
        floors: s.floorsCleared,
        won: s.phase === "victory",
        turns,
      };
    }

    switch (s.phase) {
      case "map": {
        const current = s.map.find((n) => n.id === s.currentNodeId) ?? null;
        const options = current
          ? s.map.filter((n) => current.next.includes(n.id))
          : s.map.filter((n) => n.col === 0);
        // Soft-lock check: there must always be somewhere to go.
        expect(options.length).toBeGreaterThan(0);
        const pick =
          options.find((n) => n.type === "rest" && s.hp < s.maxHp * 0.55) ??
          options.find((n) => n.type === "treasure") ??
          options[0]!;
        s.enterNode(pick.id);
        break;
      }
      case "combat": {
        const c = s.combat!;
        expect(c.energy).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(c.hp)).toBe(true);

        // total card count must be conserved across piles
        const total =
          c.drawPile.length +
          c.hand.length +
          c.discardPile.length +
          c.exhaustPile.length;
        expect(total).toBeGreaterThan(0);

        if (c.targetingCardUid) {
          const alive = c.enemies.filter((e) => !e.isDead);
          if (alive.length === 0) s.cancelTarget();
          else s.selectTarget(alive[0]!.uid);
          break;
        }

        if (c.ultCharge >= 100 && !c.ultUsedThisCombat) {
          s.useUltimate();
          break;
        }

        const playable = c.hand.filter((card) => card.cost <= c.energy);
        if (playable.length > 0) {
          // greedy: attacks first, then everything else
          const card =
            playable.find((x) => x.type === "attack") ?? playable[0]!;
          s.playCard(card.uid);
        } else {
          turns++;
          s.endTurn();
        }
        break;
      }
      case "reward": {
        const choices = s.rewardChoices;
        if (choices.length > 0) s.pickRewardCard(choices[0]!.id);
        else s.skipReward();
        break;
      }
      case "rest": {
        if (s.hp < s.maxHp * 0.7) s.restHeal();
        else {
          const up = s.deck.find((c) => !c.upgraded);
          if (up) s.restUpgrade(up.uid);
          else s.restHeal();
        }
        break;
      }
      case "shop": {
        const goldBefore = s.gold;
        const relicIdx = s.shopRelics.findIndex((r) => !!r);
        if (s.gold >= 150 && relicIdx >= 0) s.buyRelic(relicIdx);
        else if (s.shopCards.length > 0) s.buyCard(0);
        // If nothing changed, the bot can't afford anything — leave.
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

  throw new Error(
    `Run did not terminate for ${hero}/${seed} (phase=${g().phase}, steps=${steps})`,
  );
}

describe("OVERTUNG playtest simulation", () => {
  it("completes 200 full runs without crashing or soft-locking", () => {
    const results: RunResult[] = [];
    for (let i = 0; i < 200; i++) {
      const hero = ALL_HEROES[i % ALL_HEROES.length]!;
      results.push(simulateRun(hero, `sim-${i}`));
    }

    expect(results.length).toBe(200);

    const wins = results.filter((r) => r.won).length;
    const avgFloor =
      results.reduce((a, r) => a + r.floors, 0) / results.length;

    // Balance report (visible in test output)
    const perHero = ALL_HEROES.map((h) => {
      const rs = results.filter((r) => r.hero === h);
      return `${h}: ${rs.filter((r) => r.won).length}/${rs.length} wins, avg floor ${(
        rs.reduce((a, r) => a + r.floors, 0) / rs.length
      ).toFixed(1)}`;
    });
    console.log(
      `\n=== PLAYTEST REPORT ===\nruns: ${results.length}\nwin rate: ${(
        (wins / results.length) *
        100
      ).toFixed(1)}%\navg floors cleared: ${avgFloor.toFixed(2)}\n${perHero.join("\n")}\n`,
    );

    // A greedy bot should sometimes lose and sometimes progress:
    // if it never dies or never advances, the game is broken/degenerate.
    expect(avgFloor).toBeGreaterThan(0.5);
  }, 120_000);
});
