# Expand the Neutral Card Pool

Add 11 new neutral cards on top of the existing 6 (Guard, Strike, Expose, Field Kit, Focus, Power Surge stay exactly as they are). No hero pool is touched.

## The six requested cards

- **Gambit** (1 energy, attack, exhaust): deal damage equal to your current Block.
- **Overclock Cell** (0, skill): take 3 damage, draw 2, gain 1 Energy. (Renamed slightly because Tracer already has a rare called Overclock; keeping identical names would confuse the log and rewards screen. Say the word if you want the exact name anyway.)
- **Adrenaline Rush** (2, skill): costs 0 if you have already played 3+ cards this turn. Gains 2 Energy and draws 1.
- **Scavenge** (1, attack): deal 4 damage. If it kills the target, gain 15 gold.
- **Mirror Ward** (1, skill): gain 5 Block. Your next Attack this turn deals +50% damage.
- **Last Stand** (1, skill, exhaust): below 50% HP gain 3 Strength and 10 Block, otherwise gain 1 Strength.

## Five new original neutrals

- **Pawn Shop** (0, skill, exhaust): spend 20 gold to draw 2 cards and gain 1 Energy. Unplayable without the gold. Resource conversion the pool has never had.
- **Bloodletting** (0, attack): take 4 damage, deal 12 damage. Pure risk/reward burst at zero cost.
- **Salvage Rites** (1, skill): gain 4 Block for each card in your exhaust pile this combat. Turns exhaust into a payoff instead of a cost.
- **Second Wind** (1, skill, exhaust): convert all your current Block into healing at 1 HP per 2 Block, then draw 1. Rewards over-blocked turns.
- **All In** (2, attack, exhaust): deal 9 damage, doubled if your hand is empty after playing it. Hand-size condition, new to the pool.

## Technical notes

- `src/game/types.ts`: new optional `CardDef` fields — `damageEqualToBlock`, `goldOnKill`, `freeIfCardsPlayed`, `nextAttackBonusPct`, `lowHpStrength`/`lowHpBlock`, `goldCost`, `blockPerExhaust`, `blockToHealRatio`, `doubleIfHandEmpty`.
- `src/game/store.ts`: handle each field in the existing resolve pipeline (`scaledDamage`, `scaledBlock`, `effectiveCost`, kill handling, self-damage, exhaust move) plus a per-turn `nextAttackBonusPct` combat flag cleared on use and at end of turn. Add each to `cardDealsDamage` and `cardSynergyActive` so the synergy glow and targeting reticle behave.
- `src/game/cards.ts`: add the 11 defs with `up` upgrade variants and extend `NEUTRAL_POOL`.
- Playability gates: Pawn Shop is dimmed/unplayable below 20 gold (gold is not currently exposed to combat, so the store needs to read run gold when resolving it).
- Verify with `bunx tsgo --noEmit` and the existing 200-run playtest suite; report the win-rate shift, since a bigger neutral pool dilutes hero draws.
