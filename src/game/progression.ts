export interface AugmentDef {
  id: string;
  hero: string;
  name: string;
  icon: string;
  text: string;
  style: "tempo" | "survival" | "burst" | "engine";
  block: number;
  strength: number;
  energy: number;
  draw: number;
  ult: number;
}

const A = (
  id: string,
  hero: string,
  name: string,
  icon: string,
  text: string,
  style: AugmentDef["style"],
  power: Partial<Omit<AugmentDef, "id" | "hero" | "name" | "icon" | "text" | "style">>,
): AugmentDef => ({
  id, hero, name, icon, text, style, block: 0, strength: 0, energy: 0, draw: 0, ult: 0, ...power,
});

export const AUGMENTS: Record<string, AugmentDef> = Object.fromEntries([
  A("tracer_afterimage", "tracer", "Afterimage", "≫", "Every Blink Chain also leaves 4 Block behind.", "tempo", { block: 8 }),
  A("tracer_accelerant", "tracer", "Pulse Accelerant", "◎", "Attacks feed Pulse Bomb faster. Start 25 charge ahead.", "burst", { ult: 25 }),
  A("tracer_slipstream", "tracer", "Slipstream", "↯", "Your first Attack each turn pulls one card from the future.", "engine", { draw: 1, energy: 1 }),
  A("mercy_caduceus", "mercy", "Caduceus Prime", "+", "Healing also plates the target line with half as much Block.", "survival", { block: 12 }),
  A("mercy_bluebeam", "mercy", "Blue Beam", "⌁", "Each real heal powers your next Attack by 25%.", "burst", { strength: 1 }),
  A("mercy_valkyrie", "mercy", "Valkyrie Protocol", "✚", "Healing charges Valkyrie. Start 25% closer.", "engine", { ult: 25 }),
  A("genji_flow", "genji", "Flow State", "刃", "Combo cards cut deeper through your deck with an extra draw.", "tempo", { draw: 1 }),
  A("genji_deflect", "genji", "Perfect Deflect", "◇", "Skill-based Block sets a 3-damage blade counter this turn.", "survival", { block: 10 }),
  A("genji_dragon", "genji", "Dragon Within", "龍", "Every third Attack this turn awakens 1 Strength.", "engine", { strength: 1, ult: 15 }),
  A("junkrat_shrapnel", "junkrat", "Shrapnel Rain", "✹", "Self-blasts spray Weak across the enemy line.", "engine", { strength: 1 }),
  A("junkrat_total", "junkrat", "Total Mayhem", "☢", "Every self-blast pumps Strength instead of every other one.", "burst", { energy: 1, draw: 1 }),
  A("junkrat_hairtrigger", "junkrat", "Hair Trigger", "!", "Random blasts hit harder. RIP-Tire starts at 30 charge.", "burst", { ult: 30 }),
  A("moira_adaptation", "moira", "Adaptive Strain", "∴", "Poison kills permanently refine the experiment with 1 Strength.", "engine", { strength: 1 }),
  A("moira_reservoir", "moira", "Biotic Reservoir", "◉", "Poison applications drip 1 Regen back into you.", "survival", { block: 10, draw: 1 }),
  A("moira_coalescence", "moira", "Coalescent Seed", "∞", "Coalescence beams burn and heal harder. Start 25 charge ahead.", "burst", { ult: 25 }),
  A("rein_crusader", "reinhardt", "Crusader Protocol", "♜", "Begin every battle with 12 persistent Armor.", "survival", { block: 0 }),
  A("rein_barrier", "reinhardt", "Barrier Relay", "⬡", "At the start of each turn, Armor projects fresh Block.", "engine", { block: 14 }),
  A("rein_honor", "reinhardt", "Honorbound", "⚒", "Heavy swings earn Ultimate charge while your Armor holds.", "burst", { strength: 1, ult: 10 }),
  A("doom_gauntlet", "doomfist", "Seismic Gauntlet", "拳", "Attack shields hit harder, adding 2 more Block per Attack.", "survival", { block: 12 }),
  A("doom_rising", "doomfist", "Rising Power", "▲", "Pain converts to Strength sooner while the gauntlet is live.", "engine", { strength: 1 }),
  A("doom_meteor", "doomfist", "Meteor Vector", "◆", "Meteor Strike begins at 30 charge and lands with momentum.", "burst", { ult: 30 }),
].map((x) => [x.id, x]));

export function augmentPoolFor(hero: string, owned: string[]): AugmentDef[] {
  return Object.values(AUGMENTS).filter((a) => a.hero === hero && !owned.includes(a.id));
}

export interface ContractState {
  id: "clean_sweep" | "shock_assault" | "iron_line";
  name: string;
  text: string;
  progress: number;
  goal: number;
  complete: boolean;
}

const CONTRACTS: Omit<ContractState, "progress" | "complete">[] = [
  { id: "clean_sweep", name: "CLEAN SWEEP", text: "Win 2 fights at 75% HP or higher.", goal: 2 },
  { id: "shock_assault", name: "SHOCK ASSAULT", text: "Win 2 fights in 2 turns or less.", goal: 2 },
  { id: "iron_line", name: "IRON LINE", text: "Win 2 fights with Block or Armor remaining.", goal: 2 },
];

export function makeContract(index: number): ContractState {
  const d = CONTRACTS[((index % CONTRACTS.length) + CONTRACTS.length) % CONTRACTS.length]!;
  return { ...d, progress: 0, complete: false };
}