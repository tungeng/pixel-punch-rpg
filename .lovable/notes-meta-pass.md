# Meta & Retention Pass Report (40,000+ simulated runs)

## Headline numbers (final, 5,000 runs/policy)
- balanced 49.9% wins, explore 48.2%, lean 64.3%, risk 31.6%. Zero errors in every batch.
- Hero win rates (balanced): Genji .61, Doomfist .54, Junkrat .53, Reinhardt .51, Tracer .48, Moira .44, Mercy .43.
- Pacing: normal 2.55 turns, elite 3.28, boss 5.13. Avg final deck 23.5 cards.
- Deaths spread across all four bosses (Widowmaker 648, Sombra 644, Reaper 481, Sigma 279).

## Findings
- Strongest hero: Genji. Weakest: Mercy/Moira (both were far worse pre-pass; Moira went .19 -> .44).
- Strongest build: Reinhardt armor stacking (rein_will picked 80% of offers). Weakest: Moira regen/purge line.
- Most-picked cards: rein_will, mercy_lastrites, n_pawn_shop, n_overclock_cell, mercy_resurrect.
- Least-picked: hero commons (tracer_strafe, genji_fang, rein_plating, doomfist_grapple) plus n_scavenge.
- Most-picked augment path: Reinhardt Crusader (+37pp), Mercy Caduceus (+29pp). Least: Doomfist Meteor (+1.4pp).
- Most common death: act bosses, not attrition. Most common mistake in bot terms: hoarding generic neutral value instead of hero engine cards.

## Changes made from evidence
- Augments now deepen to Tier 3 instead of accumulating; boss screens offer one deepen plus branches.
- Rewards weight hero cards 2x so runs keep hero identity (neutral share of final decks 42% -> 33%).
- Removed strictly-worse starter clones (Reinforce/Strike/Field Kit) from the reward pool.
- Adrenaline Rush nerfed (was a near-auto-pick), dead hero commons buffed.
- Moira redesigned: her Poison never decays, +8 max HP.
- Sigma made a real wall (235 HP, x3 hyperspheres, +4 Str), Widowmaker headshot 14 -> 12.
- Encounter depth softened to 2.6/2.45/1.0 and hero pressure re-normalized.
- Sim bot rewritten to draft like an experienced player (scores poison, armor, combo, scaling payoffs) plus death-enemy telemetry.

## Leave alone
Relic tiers/codex, Reinhardt armor system, combat feedback layer.

## Still worth redesign later
Hero common cards are structurally dominated in 3-card rewards, Mercy's kit, risk-policy routing payoff.
