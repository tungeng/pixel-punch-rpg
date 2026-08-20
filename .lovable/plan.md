# Hero Identity Card Pass

Ten new cards — two per hero — each built on a mechanic no existing card has. No new "deal X damage" filler.

## Tracer — tempo / energy discipline
- **Chrono Flurry** (Attack, 1) — deals 4 damage plus 3 per other card already played this turn. Rewards long chains.
- **Overclock** (Skill, 0, exhaust) — until end of turn, every unspent Energy at end of turn converts into 4 Block and 2 damage to a random enemy. Turns leftover energy into value instead of waste.

## Mercy — risk / reward
- **Last Rites** (Attack, 1) — damage scales with missing HP (base 4, +1 per 6 HP missing, capped). Strongest when nearly dead.
- **Overflow Barrier** (Skill, 1) — heal 8; any healing above max HP becomes Block instead of being wasted.

## Genji — chaining
- **Dragon Rush** (Attack, 1) — costs 0 if an Attack was already played this turn.
- **Wind Cut** (Attack, 1) — deal 6; if 2+ cards were already played this turn, draw 1 and gain 1 Energy.

## Junkrat — chaos
- **Loose Cannon** (Attack, 1) — deal random 2–10 damage (seeded RNG, rolled on play).
- **Scrap Heap** (Attack, 2) — deal 3 damage +1 per card in the discard pile; shuffles discard back afterward.

## Doomfist — escalation
- **Executioner** (Attack, 2) — deal 11; if it kills an enemy, gain 2 permanent Strength for the rest of the combat.
- **Vengeful Momentum** (Attack, 3) — deal 14; costs 1 less for every 12 damage taken this combat (minimum 0).

## Technical notes
- `src/game/types.ts`: add optional card fields `damagePerCardPlayed`, `overclock`, `damagePerMissingHp`, `overheal`, `freeIfAttack`, `comboDraw`/`comboEnergy`, `randomDamage: [min,max]`, `damagePerDiscard`, `shuffleDiscard`, `strengthOnKill`, `costPerDamageTaken`.
- `src/game/store.ts`: add `damageTakenThisCombat` and `overclockActive` to combat state; extend `resolveCard` to compute dynamic damage before the existing damage loop, handle overheal→block, kill-detection for `strengthOnKill`, and discard reshuffle. Add an effective-cost helper used by both playability checks and `resolveCard` for `freeIfAttack`/`costPerDamageTaken`. End-turn step consumes `overclockActive` before discarding.
- `src/components/game/CardView.tsx`: show live computed values (dynamic cost, current scaled damage) so players can read the payoff in-hand; no layout change.
- `src/game/heroes.ts`: add each card to its hero's `cardPool`; swap one duplicate filler card per starting deck so decks show the identity early.
- `src/game/icons.ts` + generated 64x64 pixel icons in the existing chunky style for all ten cards.
- Rerun `src/game/playtest.test.ts` (200 runs) and tune numbers to keep the current ~10-12% full-clear rate.
