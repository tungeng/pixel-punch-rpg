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
  role: "Damage" | "Tank" | "Support" | "Combo";
  maxHp: number;
  passive: string;
  startingDeck: string[];
  cardPool: string[];
  ultimate: UltimateDef;
  asset: string;
  color: string;
}

export interface EnemyMove {
  type: "attack" | "block" | "buff" | "debuff" | "attack_block";
  text: string;
  damage?: number;
  hits?: number;
  block?: number;
  strength?: number;
  vulnerable?: number;
  weak?: number;
}

export type BossMechanic = "wraith" | "venom" | "gravity" | "phase";

export interface EnemyDef {
  id: string;
  name: string;
  asset: string;
  hp: [number, number];
  isBoss?: boolean;
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
  mechanic?: BossMechanic;
  mechanicName?: string;
  untargetable: boolean;
  enraged: boolean;
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
