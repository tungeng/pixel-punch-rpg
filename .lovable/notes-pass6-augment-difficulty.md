# Pass 6 — 70,000 run optimization

## Batches (all zero errors, zero soft locks)
Baseline 20k: balanced 50.7%, lean 62.4%, risk 40.1%, FTUE 42.8%.
Diagnostic 5k explore (random augment picks) for unbiased augment telemetry.
Two 20k+ validation rounds after tuning.

Final: balanced **52.8%**, lean 63.4%, risk 39.5%, FTUE **45.0%**.
Hero spread (balanced): tracer .48, mercy .56, genji .48, moira .62,
reinhardt .49, junkrat .60, doomfist .55, bastion .47.

## Findings
- The balanced/lean/risk bots pick augments by style order, so six augments had
  literally zero picks. Random-pick explore runs were the only honest signal.
- Under random picks the gaps were brutal: Crusader Protocol .82 vs Cataclysm .24.
  Doomfist and Junkrat burst paths were traps; Reinhardt had one correct answer.
- 84% of all deaths happened at bosses. The route was filler punctuated by a wall.
- Card pool is healthy: no reward-pool card sits near zero picks after last pass's cuts.

## Changes
- Crusader Protocol 12 -> 9 starting Armor (was the auto-pick).
- Honorbound retaliates for a third of Armor, not a quarter.
- Cataclysm quakes every second Attack instead of every third.
- Rising Power triggers at a lower pain threshold (8 - 2/tier, floor 3).
- Hair Trigger now floors random rolls above their midpoint (+2 per tier).
- Difficulty re-anchored: boss depth down, skirmish and elite depth up, relic and
  augment scaling softened so veterans do not out-scale the curve.

Result: augment win-rate band tightened from .24-.82 to .44-.78, and boss deaths
fell from 84% to 62% of all deaths with normal/elite deaths rising to match.
