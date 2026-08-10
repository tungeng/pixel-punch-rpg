# OVERWATCH PIXEL DECK ROGUELIKE

A mobile-first, portrait-oriented **deck-building roguelike** (think Slay the
Spire / Marvel Snap) themed around Overwatch heroes, abilities, and maps.
Pixel-art visuals, turn-based card combat, procedurally generated runs,
permadeath, and persistent meta-progression.

> **IP note:** Overwatch is Blizzard's trademark. This is a fan/parody game
> using the hero roster and ability *concepts* (names + kit ideas) with
> original pixel-art designs — not copies of Blizzard's official art. All
> generated art uses descriptive, non-trademarked prompts to avoid
> moderation blocks and IP issues.

## Vision

You pick an Overwatch hero, each with a unique deck of ability cards.
You climb a procedurally generated map of Overwatch-themed nodes
(combat, elite, rest, shop, treasure, boss). Combat is turn-based: spend
energy to play ability cards, block and attack enemies who telegraph their
moves. Win loot, grow your deck, grab relics, beat the boss. Die and you
start over — but earned meta-currency unlocks new heroes, cards, and relics
for future runs. Designed for one-thumb phone play in portrait.

## Core Gameplay Loop

```
 Hero Select ──▶ Map (procgen nodes) ──▶ Combat (cards)
      ▲                                   │
      │                                   ▼
   Permadeath ◀── Meta hub (unlocks) ◀── Rewards (gold/cards/relics)
```

1. **Hero select** — choose a hero; each hero = a fixed starting deck + an
   innate passive + an ultimate card.
2. **Map** — branching node graph (Slay the Spire style): several acts, each
   with combat / elite / rest / shop / treasure / boss nodes. Player picks a
   path by tapping nodes.
3. **Combat** — turn-based:
   - Player has Energy (refreshes each turn), a hand of cards, draw pile,
     discard pile.
   - Play cards: Attacks (damage), Skills (block / buffs / debuffs),
     Ultimates (high-impact, charged by dealing/taking damage).
   - Enemies telegraph their next move (attack X, block Y, buff).
   - End turn → enemies act → draw new hand.
   - Win when all enemies dead; lose when HP hits 0 (permadeath).
4. **Rewards** — gold + choose-one-of-three card reward + occasional relic.
5. **Rest site** — heal or upgrade a card. **Shop** — buy cards/relics/remove
   cards. **Treasure** — free relic. **Boss** — big fight → next act.
6. **Meta hub** (between runs) — spend earned currency to unlock new
   heroes, starting relics, and bonus cards; persists in localStorage.

## Game Systems

### Heroes (launch roster: 4)
Each hero: unique 10-card starting deck, a passive, and an ultimate card.
- **Tracer** — low-cost, hit-and-run attacks that chain; ult "Pulse Bomb"
  (huge burst). Fast / burst damage.
- **Reinhardt** — high block / armor cards, taunt; ult "Earthshatter"
  (stuns all enemies). Tank/control.
- **Mercy** — heal + buff ally cards, damage-over-time punish; ult "Valkyrie"
  (mass heal + empower). Support (works solo by self-heal + attrition).
- **Genji** — combo cards (deal more if you played an attack this turn);
  ult "Dragonblade" (multi-hit flurry). Combo DPS.

### Cards
Each card: name, type (Attack/Skill/Ultimate), energy cost, effect (damage,
block, heal, buff/debuff, draw), rarity, optional upgrade path. Damage/block
are integers resolved against enemy HP / player block.

### Enemies & Bosses
- ~8 enemy archetypes with simple AI intents (e.g. "Talon Trooper",
  "Omnic Bastion-bot", "Sniper").
- 2 bosses across 2 acts (e.g. "Doomfist" style bruiser, "Null Sector
  Omnic" swarm summoner). Each boss has a unique intent pattern + phase.

### Relics
Passive items earned through a run (e.g. "+1 Energy", "Draw 1 extra at
turn start", "Heal 5 after each combat"). ~10 relics at launch.

### Map / Acts
2 acts for launch. Each act = 12-15 nodes, branching paths, ends in a boss.
Procgen seeds node types from a weighted pool.

### Meta-progression
- Earn "Credits" each run based on progress (floors cleared, kills).
- Spend in a meta hub to unlock: additional heroes, new relics entering the
  pool, card upgrade tokens, starting bonuses.
- Persisted in `localStorage` (no backend needed for v1).

## Pixel Art Assets (generated)
Generated as PNGs into `src/assets/`, upscaled + pixel-snapped for a retro
look. Non-trademarked descriptive prompts:
- 4 hero portraits + idle sprites (pixel art, ~96x96)
- ~8 enemy sprites + 2 boss sprites
- Card frame / energy orb / relic icon UI chrome (pixel art)
- 2 act backgrounds (pixel art landscape, e.g. "King's Row"-like city street,
  "Null Sector"-style robotics factory)
- Title/logo screen pixel banner

## Tech Architecture
- **Framework:** TanStack Start (React) — already set up.
- **Rendering:** DOM/React for UI (cards, map, menus) — no canvas needed for
  a deck builder; this keeps it mobile-friendly and easy to animate.
- **Styling:** Tailwind v4 with pixel-font + `image-rendering: pixelated`;
  chunky pixel UI borders via CSS. Mobile portrait layout, large tap targets.
- **State:** A single game store via `zustand` (install it) holding run
  state (hero, map, deck, combat). Meta-progression in `localStorage`.
- **Animation:** Motion (framer-motion) for card play / damage numbers /
  screen transitions — install `motion`.
- **Random/procgen:** a seeded PRNG (mulberry32) so runs are reproducible
  by seed; seed shown on the run screen.

## Routes / Pages
- `/` — Title screen (Play, hero roster, unlocks status, seed display).
- `/run` — active run: shows map → combat → reward screens as in-run
  overlays (one route, state-driven screens, so a run isn't lost on
  navigation).  *(Keeping the run on a single route avoids losing in-memory
  run state on nav. Title + run is the minimum; meta hub can live on `/`)*
- Pixel font loaded via `<link>` in `__root.tsx` head (Press Start 2P or
  similar from Google Fonts) — not @import in styles.css.

## First Version Scope (this build)
Deliver a complete, playable vertical slice:
1. Title screen with Play + hero select (4 heroes) + meta currency display.
2. Seeded procedural map (2 acts) with node path selection.
3. Full turn-based card combat: energy, hand/draw/discard, enemy intents,
   block, damage, status effects (vulnerable/weak), ultimates, win/lose.
4. Card rewards, relics, rest site, shop, treasure, boss nodes.
5. 4 hero decks (~10 cards each), ~8 enemies, 2 bosses, ~10 relics.
6. Permadeath + run summary + meta-currency payout.
7. localStorage meta-progression: unlock 2 extra heroes + relics.
8. Generated pixel art for all heroes, enemies, bosses, backgrounds, UI.
9. Mobile-portrait-first, touch-friendly, pixel-font UI.

**Explicitly out of scope for v1:** multiplayer, real-time action, audio/
music, 3D, more than 2 acts, cloud saves. These can come after the loop
feels good.

## Build Order
1. Install `zustand`, `motion`. Add pixel font + `image-rendering: pixelated`
   base styles.
2. Generate pixel art assets (heroes, enemies, bosses, backgrounds, UI).
3. Game data module: heroes, cards, enemies, bosses, relics definitions.
4. Seeded procgen: map generator.
5. Zustand store: run + combat state + actions.
6. Title + hero select screens.
7. Map screen + node selection.
8. Combat screen: hand, energy, enemy intents, card play, end turn, resolve.
9. Reward / rest / shop / treasure / boss-flow screens.
10. Permadeath + run summary + meta payout + localStorage unlocks.
11. Wire routes (`/` title, `/run` game), head metadata, playtest & polish.
