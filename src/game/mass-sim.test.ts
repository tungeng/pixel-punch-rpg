/**
 * Mass playtest harness. Not part of the normal suite gate: run with
 *   SIM_RUNS=5000 bunx vitest run src/game/mass-sim.test.ts
 * Writes a JSON report to /tmp/overtung-sim.json for analysis.
 */
import { describe, it } from "vitest";
import { writeFileSync } from "node:fs";
import { ALL_HEROES, simulateRun, summarize, type RunResult } from "./sim";
import { STARTER_HEROES } from "./heroes";
import { ALL_RELIC_IDS } from "./relics";

const RUNS = Number(process.env["SIM_RUNS"] ?? 0);
const OUT = process.env["SIM_OUT"] ?? "/tmp/overtung-sim.json";
const TAG = process.env["SIM_TAG"] ?? "batch";
const CHUNK_SIZE = 500;

describe.skipIf(RUNS <= 0)("mass sim", () => {
  it(`runs ${RUNS} playtests in chunks`, () => {
    const results: RunResult[] = [];
    
    for (let i = 0; i < RUNS; i++) {
      const progress = RUNS > 1 ? i / (RUNS - 1) : 0;
      
      const unlockedHeroes = progress < 0.2 
        ? [...STARTER_HEROES] 
        : progress < 0.5 
            ? [...ALL_HEROES.slice(0, Math.floor(ALL_HEROES.length * 0.7))]
            : [...ALL_HEROES];
            
      const unlockedRelics = progress < 0.3 
        ? [] 
        : ALL_RELIC_IDS.slice(0, Math.floor(ALL_RELIC_IDS.length * progress));

      const hero = unlockedHeroes[i % unlockedHeroes.length]!;
      
      results.push(simulateRun(hero, `${TAG}-${i}`, {
        meta: {
            unlockedHeroes,
            unlockedRelics,
            credits: 0,
            bestFloor: 0,
            playerName: `sim-${i}`,
            totalRuns: i,
            upgrades: progress > 0.6 ? { "vitality_matrix": 2, "salvage_protocol": 1 } : {},
        }
      }));

      if (results.length % CHUNK_SIZE === 0) {
        process.stdout.write(`  [${TAG}] Progress: ${results.length}/${RUNS}...\n`);
      }
    }
    
    const report = summarize(results);
    writeFileSync(OUT, JSON.stringify(report, null, 2));
    
    console.log(
      `\n[${TAG}] Final Report:\n` +
      `  Runs: ${report.runs}\n` +
      `  Win Rate: ${(report.winRate * 100).toFixed(1)}%\n` +
      `  Avg Floors: ${report.avgFloors.toFixed(2)}\n` +
      `  Avg Min HP %: ${(report.avgMinHpPct * 100).toFixed(1)}%\n` +
      `  Avg Dmg Taken: ${report.avgTotalDamageTaken.toFixed(1)}\n` +
      `  Avg Credits: ${report.avgCreditsEarned.toFixed(0)}\n` +
      `  Errors: ${report.errors.length}\n`
    );
  }, 3_600_000);
});
