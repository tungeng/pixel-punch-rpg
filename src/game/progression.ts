export interface AugmentDef {
  id: string;
  hero: string;
  name: string;
  icon: string;
  text: string;
  block: number;
  strength: number;
  energy: number;
  draw: number;
  ult: number;
}

const A = (id: string, hero: string, name: string, icon: string, text: string, power: Partial<Omit<AugmentDef, "id" | "hero" | "name" | "icon" | "text">>): AugmentDef => ({
  id, hero, name, icon, text, block: 0, strength: 0, energy: 0, draw: 0, ult: 0, ...power,
});

export const AUGMENTS: Record<string, AugmentDef> = Object.fromEntries([
  A("tracer_afterimage", "tracer", "Afterimage", "≫", "Blink into each fight behind 12 Block.", { block: 12 }),
  A("tracer_accelerant", "tracer", "Pulse Accelerant", "◎", "Start combat with 35 Ultimate charge.", { ult: 35 }),
  A("tracer_slipstream", "tracer", "Slipstream", "↯", "Draw 1 more card and gain 1 Energy on turn one.", { draw: 1, energy: 1 }),
  A("mercy_caduceus", "mercy", "Caduceus Prime", "+", "Deploy with 16 Block protecting the triage line.", { block: 16 }),
  A("mercy_bluebeam", "mercy", "Blue Beam", "⌁", "Deploy with 2 Strength.", { strength: 2 }),
  A("mercy_valkyrie", "mercy", "Valkyrie Protocol", "✚", "Start 30% closer to Valkyrie.", { ult: 30 }),
  A("genji_flow", "genji", "Flow State", "刃", "Draw 2 extra cards on turn one.", { draw: 2 }),
  A("genji_deflect", "genji", "Perfect Deflect", "◇", "Enter combat with 14 Block.", { block: 14 }),
  A("genji_dragon", "genji", "Dragon Within", "龍", "Begin with 1 Strength and 20 Ultimate charge.", { strength: 1, ult: 20 }),
  A("junkrat_shrapnel", "junkrat", "Shrapnel Rain", "✹", "The opening blast grants 2 Strength.", { strength: 2 }),
  A("junkrat_total", "junkrat", "Total Mayhem", "☢", "Crash in with 1 Energy and 1 extra card.", { energy: 1, draw: 1 }),
  A("junkrat_hairtrigger", "junkrat", "Hair Trigger", "!", "RIP-Tire starts at 40 charge.", { ult: 40 }),
  A("moira_adaptation", "moira", "Adaptive Strain", "∴", "Begin each experiment with 2 Strength.", { strength: 2 }),
  A("moira_reservoir", "moira", "Biotic Reservoir", "◉", "Open with 12 Block and one extra specimen card.", { block: 12, draw: 1 }),
  A("moira_coalescence", "moira", "Coalescent Seed", "∞", "Start 35% closer to Coalescence.", { ult: 35 }),
  A("rein_crusader", "reinhardt", "Crusader Protocol", "♜", "Begin every battle with 12 persistent Armor.", { block: 0 }),
  A("rein_barrier", "reinhardt", "Barrier Relay", "⬡", "Deploy with 20 Block.", { block: 20 }),
  A("rein_honor", "reinhardt", "Honorbound", "⚒", "Begin with 2 Strength and 10 Ultimate charge.", { strength: 2, ult: 10 }),
  A("doom_gauntlet", "doomfist", "Seismic Gauntlet", "拳", "Open with 16 Block.", { block: 16 }),
  A("doom_rising", "doomfist", "Rising Power", "▲", "Begin combat with 2 Strength.", { strength: 2 }),
  A("doom_meteor", "doomfist", "Meteor Vector", "◆", "Meteor Strike begins at 40 charge.", { ult: 40 }),
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