export type CardType = "attack" | "skill" | "ultimate";
export type Rarity = "starter" | "common" | "uncommon" | "rare";
export type NodeType = "combat" | "elite" | "rest" | "shop" | "treasure" | "boss";

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  text: string;
  rarity: Rarity;
  hero?: string;
  damage?: number;
  hits?: number;
  block?: number;
  heal?: number;
  draw?: number;
  vulnerable?: number;
  weak?: number;
  strength?: number;
  energyGain?: number;
  selfDamage?: number;
  bonusIfAttack?: number;
  aoe?: boolean;
  exhaust?: boolean;
  retain?: boolean;
  // ---- identity mechanics ----
  /** +N damage per other card already played this turn (Tracer). */
  damagePerCardPlayed?: number;
  /** At end of turn, each unspent Energy becomes Block + damage (Tracer). */
  overclock?: { blockPerEnergy: number; damagePerEnergy: number };
  /** +1 damage per N missing HP (Mercy). */
  damagePerMissingHp?: number;
  /** Healing above max HP becomes Block instead of being wasted (Mercy). */
  overheal?: boolean;
  /** Costs 0 if an Attack was already played this turn (Genji). */
  freeIfAttack?: boolean;
  /** If 2+ cards were already played this turn: extra draw / energy (Genji). */
  comboCards?: number;
  comboDraw?: number;
  comboEnergy?: number;
  /** Random damage roll [min, max] (Junkrat). */
  randomDamage?: [number, number];
  /** +N damage per card in the discard pile (Junkrat). */
  damagePerDiscard?: number;
  /** Shuffle the discard pile back into the draw pile after resolving. */
  shuffleDiscard?: boolean;
  /** Gain permanent Strength if this card kills an enemy (Doomfist). */
  strengthOnKill?: number;
  /** Cost drops by 1 per N damage taken this combat (Doomfist). */
  costPerDamageTaken?: number;
  /** Poison (damage-over-time) applied to the target (Moira). */
  poison?: number;
  /** Regeneration (heal-over-time) stacks applied to the player (Moira). */
  regen?: number;
  /** Your next Poison application applies this much extra (Moira). */
  poisonBoost?: number;
  /** Consume all Poison on the target: deal this much damage per stack (Moira). */
  poisonDetonate?: number;
  /** Sustained beam: damage an enemy and heal for several turns (Moira). */
  beam?: { damage: number; heal: number; turns: number };
  /** Spread the highest Poison stack on the board to every enemy (Moira). */
  poisonSpread?: boolean;
  /** +1 damage per N of your current Block (Doomfist). */
  damagePerBlock?: number;
  /** Gain this much Block per Attack played this turn (Doomfist). */
  blockPerAttackPlayed?: number;
  /** Number of hits equals 1 + Attacks played this turn (Genji). */
  hitsPerAttack?: boolean;
  /** Random number of hits [min, max] (Junkrat). */
  randomHits?: [number, number];
  /** +N damage per Vulnerable/Weak stack on the target (Junkrat). */
  damagePerDebuff?: number;
  /** Extra healing when below half HP (Mercy). */
  bonusHealIfLowHp?: number;


  // upgrade deltas applied when upgraded
  up?: Partial<
    Pick<
      CardDef,
      | "damage"
      | "hits"
      | "block"
      | "heal"
      | "draw"
      | "cost"
      | "vulnerable"
      | "weak"
      | "strength"
      | "energyGain"
      | "bonusIfAttack"
      | "damagePerCardPlayed"
      | "damagePerMissingHp"
      | "damagePerDiscard"
      | "strengthOnKill"
      | "randomDamage"
      | "poison"
      | "regen"
      | "poisonBoost"
      | "poisonDetonate"
      | "damagePerBlock"
      | "blockPerAttackPlayed"
      | "damagePerDebuff"
      | "bonusHealIfLowHp"
      | "randomHits"
      | "selfDamage"

    >
  >;
}

export interface CardInstance extends CardDef {
  uid: string;
  upgraded: boolean;
}

export interface UltimateDef extends CardDef {
  type: "ultimate";
}

export interface HeroDef {
  id: string;
  name: string;
  role: "Damage" | "Tank" | "Support" | "Combo" | "Biotic";
  maxHp: number;
  passive: string;
  startingDeck: string[];
  cardPool: string[];
  ultimate: UltimateDef;
  asset: string;
  color: string;
}

export interface EnemyMove {
  type: "attack" | "block" | "buff" | "debuff" | "attack_block" | "summon";
  text: string;
  damage?: number;
  hits?: number;
  block?: number;
  strength?: number;
  vulnerable?: number;
  weak?: number;
  poison?: number;
  summonId?: string;
  /** Sombra: hack the player's next turn (energy or draw). */
  hack?: "energy" | "draw";
}

export type BossMechanic = "wraith" | "venom" | "gravity" | "phase" | "stealth";

/** Persistent enemy behaviours layered on top of the move rotation. */
export type EnemyTrait =
  | "aegis" // regains block every turn — soaks the first hits
  | "rampage" // gains strength each turn
  | "leech" // heals when it lands an attack
  | "curse" // applies weak + vulnerable at battle start
  | "regen"; // heals a flat amount each turn

export interface EnemyDef {
  id: string;
  name: string;
  asset: string;
  hp: [number, number];
  isBoss?: boolean;
  isElite?: boolean;
  trait?: EnemyTrait;
  traitName?: string;
  mechanic?: BossMechanic;
  mechanicName?: string;
  moves: EnemyMove[];
}

export interface EnemyInstance {
  uid: string;
  defId: string;
  name: string;
  asset: string;
  isBoss: boolean;
  isElite?: boolean | undefined;
  trait?: EnemyTrait | undefined;
  traitName?: string | undefined;
  mechanic?: BossMechanic | undefined;
  mechanicName?: string | undefined;
  untargetable: boolean;
  enraged: boolean;
  poison: number;
  hp: number;
  maxHp: number;
  block: number;
  strength: number;
  vulnerable: number;
  weak: number;
  moveIndex: number;
  intent: EnemyMove;
  isDead: boolean;
}


export interface RelicDef {
  id: string;
  name: string;
  text: string;
  icon: string;
  color: string;
  tier?: "common" | "uncommon" | "rare";
}


export interface MapNode {
  id: number;
  type: NodeType;
  col: number;
  row: number;
  next: number[];
  x: number;
  y: number;
  visited: boolean;
}
