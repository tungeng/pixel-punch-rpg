# Elimination Pass — 20,000+ run review

Baseline before cuts (6,000 balanced): 60.1% win, 19.47 floors, 16.7 cards added vs 1.8 removed, 0 errors.
Final validation: 21,000 runs across four policies, **0 errors, 0 soft locks**.

| Policy | Runs | Win rate |
| --- | --- | --- |
| Balanced | 6,000 | 52.3% |
| Lean | 5,000 | 63.2% |
| Explore | 5,000 | 45.0% |
| Risk | 5,000 | 39.7% |

Hero spread (balanced): tracer .46, mercy .52, genji .49, moira .59, reinhardt .55, junkrat .61, doomfist .50, bastion .48. No hero outside the 25–70% band.

## REMOVE
Cards with near-zero pick rates across 6,000 runs, all redundant with a stronger sibling:
`n_scavenge`, `n_second_wind`, `junkrat_loose`, `doomfist_grapple`, `moira_rot`, `genji_riposte`, `rein_forge`, `genji_fang`, `mercy_shot`, `tracer_hnr`. `n_vuln` pulled from the neutral reward pool (hero debuff cards already own that decision).

Reward pool clutter removed so every offer is a real question: strictly-worse starter clones (`rein_plating`, `rein_hammer`, `bastion_rounds`, `tracer_strafe`, `tracer_reload`, `mercy_guardian`, `junkrat_scatter`, `junkrat_rummage`, `bastion_bunker`, `rein_firestrike`) no longer appear as card rewards.

Meta upgrade **SCANNER ARRAY** deleted. It sold an invisible probability the player could never observe; cache relic odds are now a flat, readable 85%.

## MERGE
- Moira Virulence folded into **Contagion**: spreads the highest Poison, then doubles it on the target. One card, one memorable decision.
- Doomfist Grapple folded into **Iron Grip** (was Fortify): 0-cost, 6 Block, draw 1.

## IMPROVE
Seven augments were flat stat/charge padding ("start 25 charge ahead"). All replaced with effects that change how a turn is played:
- Tracer **Recall Protocol** — first time below 40% HP each fight, heal 12 and draw 2.
- Mercy **Triage Protocol** — overhealing converts to Block instead of being wasted.
- Moira **Virulent Strain** — every Poison application seeps 2 Poison onto every other enemy.
- Reinhardt **Honorbound** — each turn, Retaliate for a quarter of your Armor.
- Doomfist **Cataclysm** — every third Attack quakes the whole line for half its damage.
- Junkrat **Hair Trigger** — random rolls can never land below their midpoint.
- Bastion **Siege Uplink** — every Configuration change shells all enemies for 6.

Difficulty re-anchored after the cuts (a tighter pool is a stronger pool): skirmish and elite depth raised, per-hero pressure retuned for Moira, Genji, Doomfist, Junkrat, Mercy.

## PROTECT
- Reinhardt persistent Armor, Bastion configurations, Moira Poison economy, Junkrat chaos rolls, Genji multi-attack, Tracer energy blink. Every hero still plays unlike the others.
- Contracts, augment-per-boss cadence, breach protocols, relic Codex unlocks, leaderboard, Archive.
- Pawn Shop and Overclock Cell: high pick rates, but they are genuinely strong economic/tempo decisions, not filler.
- Legendary/mythic relic rarity curve (0.2–0.4% appearance) is intentional and stays.
