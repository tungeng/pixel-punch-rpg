import type { CardDef, CardInstance } from "./types";

let uidCounter = 0;
export function nextUid(prefix = "c"): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}_${Math.floor(Math.random() * 1e6)}`;
}

export const CARDS: Record<string, CardDef> = {
  // ---------------- TRACER (fast burst) ----------------
  tracer_blink: { id: "tracer_blink", name: "Blink", type: "attack", cost: 1, hero: "tracer", rarity: "starter", damage: 6, draw: 1, text: "Deal 6 damage. Draw 1 card.", up: { damage: 9 } },
  tracer_pistols: { id: "tracer_pistols", name: "Pulse Pistols", type: "attack", cost: 1, hero: "tracer", rarity: "starter", damage: 4, hits: 2, text: "Deal 4 damage twice.", up: { damage: 6 } },
  tracer_recall: { id: "tracer_recall", name: "Recall", type: "skill", cost: 1, hero: "tracer", rarity: "starter", block: 5, heal: 3, text: "Gain 5 Block. Heal 3.", up: { block: 8, heal: 5 } },
  tracer_strafe: { id: "tracer_strafe", name: "Strafe", type: "attack", cost: 0, hero: "tracer", rarity: "common", damage: 3, draw: 1, text: "Deal 3 damage. Draw 1 card.", up: { damage: 5 } },
  tracer_charged: { id: "tracer_charged", name: "Charged Shot", type: "attack", cost: 2, hero: "tracer", rarity: "uncommon", damage: 10, vulnerable: 1, text: "Deal 10 damage. Apply 1 Vulnerable.", up: { damage: 14, vulnerable: 2 } },
  tracer_adrenaline: { id: "tracer_adrenaline", name: "Adrenaline", type: "skill", cost: 0, hero: "tracer", rarity: "uncommon", energyGain: 2, text: "Gain 2 Energy. Exhaust.", exhaust: true, up: { energyGain: 3 } },
  tracer_hnr: { id: "tracer_hnr", name: "Hit & Run", type: "attack", cost: 1, hero: "tracer", rarity: "common", damage: 5, block: 4, text: "Deal 5 damage. Gain 4 Block.", up: { damage: 7, block: 6 } },
  tracer_reload: { id: "tracer_reload", name: "Quick Reload", type: "skill", cost: 0, hero: "tracer", rarity: "common", draw: 2, text: "Draw 2 cards.", up: { draw: 3 } },
  tracer_dual: { id: "tracer_dual", name: "Dual Wield", type: "attack", cost: 1, hero: "tracer", rarity: "uncommon", damage: 3, hits: 3, text: "Deal 3 damage 3 times.", up: { damage: 4 } },
  tracer_flurry: { id: "tracer_flurry", name: "Chrono Flurry", type: "attack", cost: 1, hero: "tracer", rarity: "uncommon", damage: 4, damagePerCardPlayed: 3, text: "Deal 4 damage, +3 for each other card played this turn.", up: { damage: 5, damagePerCardPlayed: 4 } },
  tracer_overclock: { id: "tracer_overclock", name: "Overclock", type: "skill", cost: 0, hero: "tracer", rarity: "rare", exhaust: true, overclock: { blockPerEnergy: 4, damagePerEnergy: 2 }, text: "At end of turn, each unspent Energy grants 4 Block and 2 damage to a random enemy. Exhaust." },


  // ---------------- MERCY (support / attrition) ----------------
  mercy_blaster: { id: "mercy_blaster", name: "Caduceus Blaster", type: "attack", cost: 1, hero: "mercy", rarity: "starter", damage: 5, text: "Deal 5 damage.", up: { damage: 7 } },
  mercy_heal: { id: "mercy_heal", name: "Heal Beam", type: "skill", cost: 1, hero: "mercy", rarity: "starter", heal: 6, text: "Heal 6 HP.", up: { heal: 10 } },
  mercy_boost: { id: "mercy_boost", name: "Damage Boost", type: "skill", cost: 1, hero: "mercy", rarity: "uncommon", strength: 2, text: "Gain 2 Strength.", up: { strength: 3 } },
  mercy_guardian: { id: "mercy_guardian", name: "Guardian Angel", type: "skill", cost: 1, hero: "mercy", rarity: "common", heal: 4, block: 5, text: "Heal 4. Gain 5 Block.", up: { heal: 6, block: 8 } },
  mercy_resurrect: { id: "mercy_resurrect", name: "Resurrect", type: "skill", cost: 1, hero: "mercy", rarity: "rare", heal: 8, draw: 2, text: "Heal 8. Draw 2 cards.", up: { heal: 12, draw: 3 } },
  mercy_shot: { id: "mercy_shot", name: "Caduceus Shot", type: "attack", cost: 1, hero: "mercy", rarity: "common", damage: 7, heal: 3, text: "Deal 7 damage. Heal 3.", up: { damage: 10, heal: 5 } },
  mercy_pacify: { id: "mercy_pacify", name: "Pacify", type: "skill", cost: 0, hero: "mercy", rarity: "common", weak: 2, text: "Apply 2 Weak.", up: { weak: 3 } },
  mercy_regen: { id: "mercy_regen", name: "Regeneration", type: "skill", cost: 0, hero: "mercy", rarity: "common", heal: 3, text: "Heal 3.", up: { heal: 5 } },
  mercy_blight: { id: "mercy_blight", name: "Blight", type: "attack", cost: 1, hero: "mercy", rarity: "uncommon", damage: 4, vulnerable: 2, text: "Deal 4 damage. Apply 2 Vulnerable.", up: { damage: 6, vulnerable: 3 } },
  mercy_lastrites: { id: "mercy_lastrites", name: "Last Rites", type: "attack", cost: 1, hero: "mercy", rarity: "uncommon", damage: 4, damagePerMissingHp: 6, text: "Deal 4 damage, +1 for every 6 HP you are missing.", up: { damage: 6, damagePerMissingHp: 4 } },
  mercy_overflow: { id: "mercy_overflow", name: "Overflow Barrier", type: "skill", cost: 1, hero: "mercy", rarity: "uncommon", heal: 8, overheal: true, text: "Heal 8. Healing above max HP becomes Block.", up: { heal: 12 } },


  // ---------------- GENJI (combo) ----------------
  genji_shuriken: { id: "genji_shuriken", name: "Shuriken", type: "attack", cost: 0, hero: "genji", rarity: "starter", damage: 4, text: "Deal 4 damage.", up: { damage: 6 } },
  genji_swift: { id: "genji_swift", name: "Swift Strike", type: "attack", cost: 1, hero: "genji", rarity: "starter", damage: 8, bonusIfAttack: 4, text: "Deal 8 damage. +4 if you played an Attack this turn.", up: { damage: 11, bonusIfAttack: 6 } },
  genji_deflect: { id: "genji_deflect", name: "Deflect", type: "skill", cost: 1, hero: "genji", rarity: "starter", block: 10, text: "Gain 10 Block.", up: { block: 14 } },
  genji_fang: { id: "genji_fang", name: "Dragon Fang", type: "attack", cost: 1, hero: "genji", rarity: "common", damage: 6, draw: 1, text: "Deal 6 damage. Draw 1 card.", up: { damage: 9 } },
  genji_agility: { id: "genji_agility", name: "Cyber Agility", type: "skill", cost: 1, hero: "genji", rarity: "common", block: 6, draw: 1, text: "Gain 6 Block. Draw 1 card.", up: { block: 9 } },
  genji_spirit: { id: "genji_spirit", name: "Spirit Dragon", type: "attack", cost: 1, hero: "genji", rarity: "uncommon", damage: 5, hits: 2, text: "Deal 5 damage twice.", up: { damage: 7 } },
  genji_riposte: { id: "genji_riposte", name: "Riposte", type: "attack", cost: 1, hero: "genji", rarity: "common", damage: 5, block: 5, text: "Deal 5 damage. Gain 5 Block.", up: { damage: 7, block: 8 } },
  genji_dash: { id: "genji_dash", name: "Dash", type: "attack", cost: 0, hero: "genji", rarity: "common", damage: 3, draw: 1, text: "Deal 3 damage. Draw 1 card.", up: { damage: 5 } },
  genji_storm: { id: "genji_storm", name: "Storm of Blades", type: "attack", cost: 2, hero: "genji", rarity: "rare", damage: 4, hits: 3, text: "Deal 4 damage 3 times.", up: { damage: 6 } },
  genji_rush: { id: "genji_rush", name: "Dragon Rush", type: "attack", cost: 1, hero: "genji", rarity: "uncommon", damage: 7, freeIfAttack: true, text: "Deal 7 damage. Costs 0 if you played an Attack this turn.", up: { damage: 10 } },
  genji_windcut: { id: "genji_windcut", name: "Wind Cut", type: "attack", cost: 1, hero: "genji", rarity: "uncommon", damage: 6, comboCards: 2, comboDraw: 1, comboEnergy: 1, text: "Deal 6 damage. If you played 2+ cards this turn, draw 1 and gain 1 Energy.", up: { damage: 9 } },


  // ---------------- JUNKRAT (chaos / area) ----------------
  junkrat_launcher: { id: "junkrat_launcher", name: "Frag Launcher", type: "attack", cost: 1, hero: "junkrat", rarity: "starter", damage: 7, text: "Deal 7 damage.", up: { damage: 10 } },
  junkrat_trap: { id: "junkrat_trap", name: "Steel Trap", type: "skill", cost: 1, hero: "junkrat", rarity: "starter", vulnerable: 2, block: 4, text: "Apply 2 Vulnerable. Gain 4 Block.", up: { vulnerable: 3, block: 6 } },
  junkrat_concussive: { id: "junkrat_concussive", name: "Concussion Mine", type: "attack", cost: 1, hero: "junkrat", rarity: "common", damage: 5, weak: 2, text: "Deal 5 damage. Apply 2 Weak.", up: { damage: 7, weak: 3 } },
  junkrat_mine: { id: "junkrat_mine", name: "Rip Tire", type: "attack", cost: 1, hero: "junkrat", rarity: "common", damage: 9, selfDamage: 2, text: "Deal 9 damage. Take 2 damage.", up: { damage: 12 } },
  junkrat_rpg: { id: "junkrat_rpg", name: "RPG", type: "attack", cost: 2, hero: "junkrat", rarity: "uncommon", damage: 13, text: "Deal 13 damage.", up: { damage: 17 } },
  junkrat_scatter: { id: "junkrat_scatter", name: "Scatter Shot", type: "attack", cost: 1, hero: "junkrat", rarity: "common", damage: 4, hits: 2, text: "Deal 4 damage twice.", up: { damage: 6 } },
  junkrat_armor: { id: "junkrat_armor", name: "Junk Armor", type: "skill", cost: 0, hero: "junkrat", rarity: "common", block: 4, text: "Gain 4 Block.", up: { block: 7 } },
  junkrat_frag: { id: "junkrat_frag", name: "Frag Toss", type: "attack", cost: 1, hero: "junkrat", rarity: "common", damage: 5, vulnerable: 1, text: "Deal 5 damage. Apply 1 Vulnerable.", up: { damage: 7 } },
  junkrat_blast: { id: "junkrat_blast", name: "Total Mayhem", type: "attack", cost: 2, hero: "junkrat", rarity: "uncommon", damage: 8, aoe: true, text: "Deal 8 damage to ALL enemies.", up: { damage: 11 } },
  junkrat_loose: { id: "junkrat_loose", name: "Loose Cannon", type: "attack", cost: 1, hero: "junkrat", rarity: "uncommon", randomDamage: [2, 10], text: "Deal 2-10 damage at random.", up: { randomDamage: [5, 13] } },
  junkrat_scrap: { id: "junkrat_scrap", name: "Scrap Heap", type: "attack", cost: 2, hero: "junkrat", rarity: "rare", damage: 3, damagePerDiscard: 1, shuffleDiscard: true, text: "Deal 3 damage, +1 per card in your discard pile. Then shuffle discard into your draw pile.", up: { damage: 6 } },


  // ---------------- DOOMFIST (bruiser / tank) ----------------
  doomfist_punch: { id: "doomfist_punch", name: "Rocket Punch", type: "attack", cost: 1, hero: "doomfist", rarity: "starter", damage: 8, text: "Deal 8 damage.", up: { damage: 11 } },
  doomfist_slam: { id: "doomfist_slam", name: "Seismic Slam", type: "attack", cost: 1, hero: "doomfist", rarity: "starter", damage: 6, block: 5, text: "Deal 6 damage. Gain 5 Block.", up: { damage: 8, block: 8 } },
  doomfist_shield: { id: "doomfist_shield", name: "Power Block", type: "skill", cost: 1, hero: "doomfist", rarity: "starter", block: 10, text: "Gain 10 Block.", up: { block: 14 } },
  doomfist_uppercut: { id: "doomfist_uppercut", name: "Rising Uppercut", type: "attack", cost: 2, hero: "doomfist", rarity: "uncommon", damage: 12, text: "Deal 12 damage.", up: { damage: 16 } },
  doomfist_bestdefense: { id: "doomfist_bestdefense", name: "Best Defense", type: "skill", cost: 1, hero: "doomfist", rarity: "common", strength: 1, block: 4, text: "Gain 1 Strength and 4 Block.", up: { strength: 2, block: 7 } },
  doomfist_charge: { id: "doomfist_charge", name: "Meteor Strike", type: "attack", cost: 1, hero: "doomfist", rarity: "common", damage: 9, vulnerable: 1, text: "Deal 9 damage. Apply 1 Vulnerable.", up: { damage: 12, vulnerable: 2 } },
  doomfist_bruise: { id: "doomfist_bruise", name: "Bruise", type: "attack", cost: 0, hero: "doomfist", rarity: "common", damage: 4, text: "Deal 4 damage.", up: { damage: 6 } },
  doomfist_fortify: { id: "doomfist_fortify", name: "Fortify", type: "skill", cost: 1, hero: "doomfist", rarity: "common", block: 6, draw: 1, text: "Gain 6 Block. Draw 1 card.", up: { block: 9 } },
  doomfist_quake: { id: "doomfist_quake", name: "Ground Quake", type: "attack", cost: 2, hero: "doomfist", rarity: "rare", damage: 6, hits: 2, aoe: true, text: "Deal 6 damage twice to ALL enemies.", up: { damage: 8 } },
  doomfist_executioner: { id: "doomfist_executioner", name: "Executioner", type: "attack", cost: 2, hero: "doomfist", rarity: "uncommon", damage: 11, strengthOnKill: 2, text: "Deal 11 damage. If this kills an enemy, gain 2 Strength for the rest of combat.", up: { damage: 14, strengthOnKill: 3 } },
  doomfist_momentum: { id: "doomfist_momentum", name: "Vengeful Momentum", type: "attack", cost: 3, hero: "doomfist", rarity: "rare", damage: 14, costPerDamageTaken: 12, text: "Deal 14 damage. Costs 1 less per 12 damage you have taken this combat.", up: { damage: 18 } },


  // ---------------- NEUTRAL (reward pool, any hero) ----------------
  n_block: { id: "n_block", name: "Reinforce", type: "skill", cost: 0, rarity: "common", block: 4, text: "Gain 4 Block.", up: { block: 6 } },
  n_strike: { id: "n_strike", name: "Strike", type: "attack", cost: 1, rarity: "common", damage: 6, text: "Deal 6 damage.", up: { damage: 9 } },
  n_vuln: { id: "n_vuln", name: "Expose", type: "skill", cost: 0, rarity: "common", vulnerable: 2, text: "Apply 2 Vulnerable.", up: { vulnerable: 3 } },
  n_heal: { id: "n_heal", name: "Field Kit", type: "skill", cost: 1, rarity: "common", heal: 6, text: "Heal 6 HP.", up: { heal: 10 } },
  n_focus: { id: "n_focus", name: "Focus", type: "skill", cost: 0, rarity: "uncommon", draw: 2, text: "Draw 2 cards.", up: { draw: 3 } },
  n_power: { id: "n_power", name: "Power Surge", type: "skill", cost: 1, rarity: "uncommon", strength: 1, block: 4, text: "Gain 1 Strength and 4 Block.", up: { strength: 2 } },
};

export const NEUTRAL_POOL = ["n_block", "n_strike", "n_vuln", "n_heal", "n_focus", "n_power"];

export function makeCard(defId: string, upgraded = false): CardInstance {
  const base = CARDS[defId];
  if (!base) throw new Error(`Unknown card: ${defId}`);
  const merged: CardInstance = { ...base, uid: nextUid(defId), upgraded };
  if (upgraded && base.up) {
    const up = base.up;
    if (up.damage !== undefined) merged.damage = (base.damage ?? 0) + (up.damage - (base.damage ?? 0));
    if (up.hits !== undefined) merged.hits = up.hits;
    if (up.block !== undefined) merged.block = up.block;
    if (up.heal !== undefined) merged.heal = up.heal;
    if (up.draw !== undefined) merged.draw = up.draw;
    if (up.cost !== undefined) merged.cost = up.cost;
    if (up.vulnerable !== undefined) merged.vulnerable = up.vulnerable;
    if (up.weak !== undefined) merged.weak = up.weak;
    if (up.damagePerCardPlayed !== undefined) merged.damagePerCardPlayed = up.damagePerCardPlayed;
    if (up.damagePerMissingHp !== undefined) merged.damagePerMissingHp = up.damagePerMissingHp;
    if (up.damagePerDiscard !== undefined) merged.damagePerDiscard = up.damagePerDiscard;
    if (up.strengthOnKill !== undefined) merged.strengthOnKill = up.strengthOnKill;
    if (up.randomDamage !== undefined) merged.randomDamage = up.randomDamage;
    if (up.strength !== undefined) merged.strength = up.strength;
    if (up.energyGain !== undefined) merged.energyGain = up.energyGain;
    if (up.bonusIfAttack !== undefined) merged.bonusIfAttack = up.bonusIfAttack;
  }
  return merged;
}
