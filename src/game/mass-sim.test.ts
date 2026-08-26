/**
 * Mass playtest harness. Not part of the normal suite gate: run with
 *   SIM_RUNS=5000 bunx vitest run src/game/mass-sim.test.ts
 * Writes a JSON report to /tmp/overtung-sim.json for analysis.
 */
import { describe, it } from "vitest";
import { writeFileSync } from "node:fs";
import { ALL_HEROES, simulateRun, summarize, type RunResult } from "./sim";

const RUNS = Number(process.env["SIM_RUNS"] ?? 0);
const OUT = process.env["SIM_OUT"] ?? "/tmp/overtung-sim.json";
const TAG = process.env["SIM_TAG"] ?? "batch";

describe.skipIf(RUNS <= 0)("mass sim", () => {
  it(`runs ${RUNS} playtests`, () => {
    const results: RunResult[] = [];
    for (let i = 0; i < RUNS; i++) {
      const hero = ALL_HEROES[i % ALL_HEROES.length]!;
      results.push(simulateRun(hero, `${TAG}-${i}`));
    }
    const report = summarize(results);
    writeFileSync(OUT, JSON.stringify(report, null, 2));
    console.log(
      `\n[${TAG}] runs=${report.runs} winRate=${(report.winRate * 100).toFixed(1)}% ` +
        `avgFloors=${report.avgFloors.toFixed(2)} errors=${report.errors.length}\n` +
        Object.entries(report.perHero)
          .map(([h, v]) => `  ${h}: ${(v.winRate * 100).toFixed(0)}% / ${v.avgFloors.toFixed(1)}f`)
          .join("\n"),
    );
  }, 1_800_000);
});
