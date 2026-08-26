# 20,000-run progression overhaul

## Goal
Make each run develop a distinct story and build identity instead of repeating fights until the next gold purchase. Balance remains important, but the primary targets are meaningful decisions, build evolution, pacing, and replayability.

## Build
1. **Add mid-run hero evolution**
   - Introduce an Overwatch-themed augment choice after each act boss.
   - Offer three seeded, hero-specific upgrades that alter mechanics rather than add flat stats.
   - Limit choices to one per act so a completed run forms a recognizable build.

2. **Turn rewards into decisions**
   - Add a card-skip payoff and deck-shaping options so taking a card is not automatic.
   - Expand safehouses with a third tactical action that changes the run, not just HP or one card number.
   - Replace passive cache opening with a seeded risk/reward choice.

3. **Create run objectives**
   - Add short contracts with visible conditions and non-gold rewards, such as winning without taking HP damage, finishing with retained Armor, or defeating a formation unit first.
   - Rotate contracts by act and hero so encounters ask for different play patterns.

4. **Improve progression feedback**
   - Show active augments and contract progress in the run HUD/map flow.
   - Give act transitions a concise build recap so power growth is legible.
   - Preserve the portrait mobile layout and desktop arcade frame.

5. **Run the optimization campaign**
   - Extend simulation telemetry for augment picks, contract completion, skipped rewards, deck churn, route diversity, decision diversity, and build concentration.
   - Run staged batches totaling at least 20,000 new simulations: baseline, first implementation, balance pass, and final validation.
   - Test multiple bot policies rather than one greedy policy to expose dominant routes and false balance.
   - Fix crashes, soft locks, degenerate strategies, hero outliers, and progression choices that are consistently ignored; retest after each meaningful change.

## Quality targets
- Zero simulation errors or soft locks.
- No hero below 25% or above 70% win rate under the standard policy.
- Multiple viable augment paths per hero; no single option chosen overwhelmingly without a clear situational reason.
- More route and reward-choice diversity than the current baseline.
- Average combat remains deliberate rather than returning to sub-one-turn clears.
- Existing Overwatch identity, unique hero mechanics, relics, leaderboard, Archive, and Codex remain integrated.

## Technical details
- Keep deterministic seeded choices in the Zustand game store and simulation harness.
- Add new runtime helpers outside server-function modules; no backend schema changes are planned.
- Add focused tests for persistence, act transitions, reward resolution, and all new choice phases.
- Verify type safety, existing playtests, a 20,000+ run report, and mobile/desktop browser rendering.
