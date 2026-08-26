import type { CardDef, CardInstance } from "./types";

let uidCounter = 0;
export function nextUid(prefix = "c"): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}_${Math.floor(Math.random() * 1e6)}`;
}

export const CARDS: Record<string, CardDef> = {
  // ---------------- TRACER (fast burst) ----------------
  tracer_blink: { id: "tracer_blink", name: "Blink", type: "attack", cost: 1, hero: "tracer", rarity: "starter", damage: 5, draw: 1, text: "Deal 5 damage. Draw 1 card.", up: { damage: 8 } },
  tracer_pistols: { id: "tracer_pistols", name: "Pulse Pistols", type: "attack", cost: 1, hero: "tracer", rarity: "starter", damage: 4, hits: 2, text: "Deal 4 damage twice.", up: { damage: 6 } },
  tracer_recall: { id: "tracer_recall", name: "Recall", type: "skill", cost: 1, hero: "tracer", rarity: "starter", block: 3, heal: 2, text: "Gain 3 Block. Heal 2.", up: { block: 5, heal: 4 } },
  tracer_strafe: { id: "tracer_strafe", name: "Strafe", type: "attack", cost: 0, hero: "tracer", rarity: "common", damage: 2, draw: 1, text: "Deal 2 damage. Draw 1 card.", up: { damage: 4 } },
  tracer_charged: { id: "tracer_charged", name: "Charged Shot", type: "attack", cost: 2, hero: "tracer", rarity: "uncommon", damage: 10, vulnerable: 1, text: "Deal 10 damage. Apply 1 Vulnerable.", up: { damage: 14, vulnerable: 2 } },
  tracer_adrenaline: { id: "tracer_adrenaline", name: "Adrenaline", type: "skill", cost: 0, hero: "tracer", rarity: "uncommon", energyGain: 2, text: "Gain 2 Energy. Exhaust.", exhaust: true, up: { energyGain: 3 } },
  tracer_hnr: { id: "tracer_hnr", name: "Hit & Run", type: "attack", cost: 1, hero: "tracer", rarity: "common", damage: 5, block: 3, text: "Deal 5 damage. Gain 3 Block.", up: { damage: 7, block: 5 } },
  tracer_reload: { id: "tracer_reload", name: "Quick Reload", type: "skill", cost: 0, hero: "tracer", rarity: "common", draw: 2, text: "Draw 2 cards.", up: { draw: 3 } },
  tracer_dual: { id: "tracer_dual", name: "Dual Wield", type: "attack", cost: 1, hero: "tracer", rarity: "uncommon", damage: 3, hits: 3, text: "Deal 3 damage 3 times.", up: { damage: 4 } },
  tracer_flurry: { id: "tracer_flurry", name: "Chrono Flurry", type: "attack", cost: 1, hero: "tracer", rarity: "uncommon", damage: 4, damagePerCardPlayed: 2, text: "Deal 4 damage, +2 for each other card played this turn.", up: { damage: 5, damagePerCardPlayed: 3 } },
  tracer_overclock: { id: "tracer_overclock", name: "Overclock", type: "skill", cost: 0, hero: "tracer", rarity: "rare", exhaust: true, overclock: { blockPerEnergy: 3, damagePerEnergy: 2 }, text: "At end of turn, each unspent Energy grants 3 Block and 2 damage to a random enemy. Exhaust." },


  // ---------------- MERCY (support / attrition) ----------------
  mercy_blaster: { id: "mercy_blaster", name: "Caduceus Blaster", type: "attack", cost: 1, hero: "mercy", rarity: "starter", damage: 5, text: "Deal 5 damage.", up: { damage: 7 } },
  mercy_heal: { id: "mercy_heal", name: "Heal Beam", type: "skill", cost: 1, hero: "mercy", rarity: "starter", heal: 5, text: "Heal 5 HP.", up: { heal: 8 } },
  mercy_boost: { id: "mercy_boost", name: "Damage Boost", type: "skill", cost: 1, hero: "mercy", rarity: "uncommon", strength: 2, text: "Gain 2 Strength.", up: { strength: 3 } },
  mercy_guardian: { id: "mercy_guardian", name: "Guardian Angel", type: "skill", cost: 1, hero: "mercy", rarity: "common", heal: 3, block: 5, bonusHealIfLowHp: 6, text: "Gain 5 Block. Heal 3, or 9 if below half HP.", up: { block: 7, bonusHealIfLowHp: 9 } },
  mercy_resurrect: { id: "mercy_resurrect", name: "Resurrect", type: "skill", cost: 1, hero: "mercy", rarity: "rare", heal: 6, draw: 2, text: "Heal 6. Draw 2 cards.", up: { heal: 10, draw: 3 } },
  mercy_shot: { id: "mercy_shot", name: "Caduceus Shot", type: "attack", cost: 1, hero: "mercy", rarity: "common", damage: 7, heal: 2, text: "Deal 7 damage. Heal 2.", up: { damage: 10, heal: 4 } },
  mercy_pacify: { id: "mercy_pacify", name: "Pacify", type: "skill", cost: 0, hero: "mercy", rarity: "common", weak: 2, text: "Apply 2 Weak.", up: { weak: 3 } },
  mercy_regen: { id: "mercy_regen", name: "Regeneration", type: "skill", cost: 0, hero: "mercy", rarity: "common", heal: 2, text: "Heal 2.", up: { heal: 4 } },
  mercy_blight: { id: "mercy_blight", name: "Blight", type: "attack", cost: 1, hero: "mercy", rarity: "uncommon", damage: 4, vulnerable: 2, text: "Deal 4 damage. Apply 2 Vulnerable.", up: { damage: 6, vulnerable: 3 } },
  mercy_lastrites: { id: "mercy_lastrites", name: "Last Rites", type: "attack", cost: 1, hero: "mercy", rarity: "uncommon", damage: 4, damagePerMissingHp: 6, text: "Deal 4 damage, +1 for every 6 HP you are missing.", up: { damage: 6, damagePerMissingHp: 4 } },
  mercy_overflow: { id: "mercy_overflow", name: "Overflow Barrier", type: "skill", cost: 1, hero: "mercy", rarity: "uncommon", heal: 6, overheal: true, text: "Heal 6. Healing above max HP becomes Block.", up: { heal: 10 } },


  // ---------------- GENJI (combo) ----------------
  genji_shuriken: { id: "genji_shuriken", name: "Shuriken", type: "attack", cost: 0, hero: "genji", rarity: "starter", damage: 3, text: "Deal 3 damage.", up: { damage: 5 } },
  genji_swift: { id: "genji_swift", name: "Swift Strike", type: "attack", cost: 1, hero: "genji", rarity: "starter", damage: 6, bonusIfAttack: 3, text: "Deal 6 damage. +3 if you played an Attack this turn.", up: { damage: 9, bonusIfAttack: 5 } },
  genji_deflect: { id: "genji_deflect", name: "Deflect", type: "skill", cost: 1, hero: "genji", rarity: "starter", block: 8, text: "Gain 8 Block.", up: { block: 11 } },
  genji_fang: { id: "genji_fang", name: "Dragon Fang", type: "attack", cost: 1, hero: "genji", rarity: "common", damage: 5, draw: 1, text: "Deal 5 damage. Draw 1 card.", up: { damage: 8 } },
  genji_agility: { id: "genji_agility", name: "Cyber Agility", type: "skill", cost: 1, hero: "genji", rarity: "common", block: 5, comboCards: 2, comboEnergy: 1, text: "Gain 5 Block. If you played 2+ cards this turn, gain 1 Energy.", up: { block: 8 } },
  genji_spirit: { id: "genji_spirit", name: "Spirit Dragon", type: "attack", cost: 1, hero: "genji", rarity: "uncommon", damage: 3, hitsPerAttack: true, text: "Deal 3 damage, once more for each Attack already played this turn.", up: { damage: 5 } },
  genji_riposte: { id: "genji_riposte", name: "Riposte", type: "skill", cost: 1, hero: "genji", rarity: "common", block: 6, comboCards: 2, comboDraw: 1, text: "Gain 6 Block. If you played 2+ cards this turn, draw 1 card.", up: { block: 9 } },
  genji_dash: { id: "genji_dash", name: "Dash", type: "attack", cost: 0, hero: "genji", rarity: "common", damage: 3, bonusIfAttack: 3, text: "Deal 3 damage. +3 if you played an Attack this turn.", up: { damage: 5, bonusIfAttack: 5 } },
  genji_storm: { id: "genji_storm", name: "Storm of Blades", type: "attack", cost: 2, hero: "genji", rarity: "rare", damage: 3, hits: 3, text: "Deal 3 damage 3 times.", up: { damage: 5 } },
  genji_rush: { id: "genji_rush", name: "Dragon Rush", type: "attack", cost: 1, hero: "genji", rarity: "uncommon", damage: 6, freeIfAttack: true, text: "Deal 6 damage. Costs 0 if you played an Attack this turn.", up: { damage: 9 } },
  genji_windcut: { id: "genji_windcut", name: "Wind Cut", type: "attack", cost: 1, hero: "genji", rarity: "uncommon", damage: 6, comboCards: 2, comboDraw: 1, comboEnergy: 1, text: "Deal 6 damage. If you played 2+ cards this turn, draw 1 and gain 1 Energy.", up: { damage: 9 } },


  // ---------------- JUNKRAT (chaos / area) ----------------
  junkrat_launcher: { id: "junkrat_launcher", name: "Frag Launcher", type: "attack", cost: 1, hero: "junkrat", rarity: "starter", damage: 10, text: "Deal 10 damage.", up: { damage: 13 } },
  junkrat_trap: { id: "junkrat_trap", name: "Steel Trap", type: "skill", cost: 1, hero: "junkrat", rarity: "starter", vulnerable: 3, block: 6, text: "Apply 3 Vulnerable. Gain 6 Block.", up: { vulnerable: 4, block: 8 } },
  junkrat_concussive: { id: "junkrat_concussive", name: "Concussion Mine", type: "attack", cost: 1, hero: "junkrat", rarity: "common", damage: 6, weak: 2, text: "Deal 6 damage. Apply 2 Weak.", up: { damage: 8, weak: 3 } },
  junkrat_mine: { id: "junkrat_mine", name: "Rip Tire", type: "attack", cost: 1, hero: "junkrat", rarity: "common", damage: 11, selfDamage: 2, text: "Deal 11 damage. Take 2 damage.", up: { damage: 14 } },
  junkrat_rpg: { id: "junkrat_rpg", name: "RPG", type: "attack", cost: 2, hero: "junkrat", rarity: "uncommon", damage: 15, text: "Deal 15 damage.", up: { damage: 19 } },
  junkrat_scatter: { id: "junkrat_scatter", name: "Scatter Shot", type: "attack", cost: 1, hero: "junkrat", rarity: "common", damage: 5, randomHits: [2, 3], text: "Deal 5 damage 2-3 times at random.", up: { damage: 7, randomHits: [2, 4] } },
  junkrat_armor: { id: "junkrat_armor", name: "Junk Armor", type: "skill", cost: 0, hero: "junkrat", rarity: "common", block: 8, selfDamage: 3, text: "Gain 8 Block. Take 3 damage.", up: { block: 10 } },
  junkrat_rummage: { id: "junkrat_rummage", name: "Rummage", type: "skill", cost: 0, hero: "junkrat", rarity: "common", draw: 2, selfDamage: 3, text: "Draw 2 cards. Take 3 damage.", up: { draw: 3 } },
  junkrat_frag: { id: "junkrat_frag", name: "Frag Toss", type: "attack", cost: 1, hero: "junkrat", rarity: "common", damage: 4, damagePerDebuff: 3, text: "Deal 4 damage, +3 per Vulnerable or Weak stack on the target.", up: { damage: 6, damagePerDebuff: 4 } },
  junkrat_blast: { id: "junkrat_blast", name: "Total Mayhem", type: "attack", cost: 2, hero: "junkrat", rarity: "uncommon", damage: 12, aoe: true, text: "Deal 12 damage to ALL enemies.", up: { damage: 14 } },
  junkrat_loose: { id: "junkrat_loose", name: "Loose Cannon", type: "attack", cost: 1, hero: "junkrat", rarity: "uncommon", randomDamage: [5, 13], text: "Deal 5-13 damage at random.", up: { randomDamage: [8, 16] } },
  junkrat_scrap: { id: "junkrat_scrap", name: "Scrap Heap", type: "attack", cost: 2, hero: "junkrat", rarity: "rare", damage: 3, damagePerDiscard: 1, shuffleDiscard: true, text: "Deal 3 damage, +1 per card in your discard pile. Then shuffle discard into your draw pile.", up: { damage: 6 } },



  // ---------------- MOIRA (biotic / damage-over-time) ----------------
  moira_orb_dmg: { id: "moira_orb_dmg", name: "Biotic Orb (Damage)", type: "attack", cost: 1, hero: "moira", rarity: "starter", damage: 5, poison: 6, text: "Deal 5 damage. Apply 6 Poison.", up: { damage: 7, poison: 8 } },
  moira_orb_heal: { id: "moira_orb_heal", name: "Biotic Orb (Healing)", type: "skill", cost: 1, hero: "moira", rarity: "starter", regen: 4, text: "Gain 4 Regen (heals each turn, decaying).", up: { regen: 6 } },
  moira_grasp: { id: "moira_grasp", name: "Biotic Grasp", type: "attack", cost: 1, hero: "moira", rarity: "starter", damage: 4, damagePerPoison: 3, text: "Deal 4 damage, +3 per Poison on the target.", up: { damage: 6, damagePerPoison: 4 } },
  moira_fade: { id: "moira_fade", name: "Fade", type: "skill", cost: 1, hero: "moira", rarity: "starter", block: 5, blockPerPoisonedEnemy: 4, text: "Gain 5 Block, +4 per poisoned enemy.", up: { block: 8, blockPerPoisonedEnemy: 5 } },
  moira_decay: { id: "moira_decay", name: "Decay", type: "skill", cost: 0, hero: "moira", rarity: "common", poison: 3, text: "Apply 3 Poison.", up: { poison: 5 } },
  moira_surge: { id: "moira_surge", name: "Biotic Surge", type: "skill", cost: 1, hero: "moira", rarity: "common", poisonBoost: 3, text: "Your next Poison application applies 3 more.", up: { poisonBoost: 5 } },
  moira_bloom: { id: "moira_bloom", name: "Necrotic Bloom", type: "attack", cost: 1, hero: "moira", rarity: "uncommon", poisonDetonate: 4, text: "Consume all Poison on the target: deal 4 damage per stack.", up: { poisonDetonate: 6 } },
  moira_contagion: { id: "moira_contagion", name: "Contagion", type: "skill", cost: 1, hero: "moira", rarity: "uncommon", poisonSpread: true, text: "Spread the highest Poison on the board to every enemy.", up: { cost: 0 } },
  moira_miasma: { id: "moira_miasma", name: "Miasma", type: "skill", cost: 2, hero: "moira", rarity: "uncommon", poison: 4, aoe: true, text: "Apply 4 Poison to ALL enemies.", up: { poison: 6 } },
  moira_bioticfield: { id: "moira_bioticfield", name: "Biotic Field", type: "skill", cost: 1, hero: "moira", rarity: "common", heal: 5, draw: 1, text: "Heal 5. Draw 1.", up: { heal: 8 } },
  moira_rot: { id: "moira_rot", name: "Virulence", type: "skill", cost: 1, hero: "moira", rarity: "uncommon", poisonDouble: true, text: "Double the Poison on the target.", up: { cost: 0 } },
  moira_leech: { id: "moira_leech", name: "Siphon Life", type: "attack", cost: 1, hero: "moira", rarity: "uncommon", damage: 5, healPerPoisonBoard: 1, text: "Deal 5 damage. Heal 1 per Poison stack on the board.", up: { damage: 8, healPerPoisonBoard: 2 } },
  moira_purge: { id: "moira_purge", name: "Necrotic Purge", type: "attack", cost: 2, hero: "moira", rarity: "rare", consumeRegenDamage: 3, text: "Consume all Regen: deal 3 damage per stack to ALL enemies.", up: { consumeRegenDamage: 5 } },

  // ---------------- DOOMFIST (bruiser / tank) ----------------
  doomfist_punch: { id: "doomfist_punch", name: "Rocket Punch", type: "attack", cost: 1, hero: "doomfist", rarity: "starter", damage: 10, text: "Deal 10 damage.", up: { damage: 13 } },
  doomfist_slam: { id: "doomfist_slam", name: "Seismic Slam", type: "attack", cost: 1, hero: "doomfist", rarity: "starter", damage: 6, block: 5, text: "Deal 6 damage. Gain 5 Block.", up: { damage: 8, block: 8 } },
  doomfist_shield: { id: "doomfist_shield", name: "Power Block", type: "skill", cost: 1, hero: "doomfist", rarity: "starter", block: 8, text: "Gain 8 Block.", up: { block: 11 } },
  doomfist_uppercut: { id: "doomfist_uppercut", name: "Rising Uppercut", type: "attack", cost: 2, hero: "doomfist", rarity: "uncommon", damage: 14, text: "Deal 14 damage.", up: { damage: 18 } },
  doomfist_bestdefense: { id: "doomfist_bestdefense", name: "Best Defense", type: "skill", cost: 1, hero: "doomfist", rarity: "common", strength: 1, block: 3, blockPerAttackPlayed: 3, text: "Gain 1 Strength and 3 Block, +3 per Attack played this turn.", up: { strength: 2, blockPerAttackPlayed: 4 } },
  doomfist_grapple: { id: "doomfist_grapple", name: "Iron Grip", type: "skill", cost: 0, hero: "doomfist", rarity: "common", block: 4, draw: 1, text: "Gain 4 Block. Draw 1 card.", up: { block: 6 } },
  doomfist_charge: { id: "doomfist_charge", name: "Meteor Strike", type: "attack", cost: 1, hero: "doomfist", rarity: "common", damage: 9, vulnerable: 1, text: "Deal 9 damage. Apply 1 Vulnerable.", up: { damage: 12, vulnerable: 2 } },
  doomfist_bruise: { id: "doomfist_bruise", name: "Bruise", type: "attack", cost: 0, hero: "doomfist", rarity: "common", damage: 3, damagePerBlock: 8, text: "Deal 3 damage, +1 for every 8 Block you have.", up: { damage: 5, damagePerBlock: 6 } },
  doomfist_fortify: { id: "doomfist_fortify", name: "Fortify", type: "skill", cost: 1, hero: "doomfist", rarity: "common", block: 5, draw: 1, text: "Gain 5 Block. Draw 1 card.", up: { block: 7 } },
  doomfist_quake: { id: "doomfist_quake", name: "Ground Quake", type: "attack", cost: 2, hero: "doomfist", rarity: "rare", damage: 6, hits: 2, aoe: true, text: "Deal 6 damage twice to ALL enemies.", up: { damage: 8 } },
  doomfist_executioner: { id: "doomfist_executioner", name: "Executioner", type: "attack", cost: 2, hero: "doomfist", rarity: "uncommon", damage: 11, strengthOnKill: 2, text: "Deal 11 damage. If this kills an enemy, gain 2 Strength for the rest of combat.", up: { damage: 14, strengthOnKill: 3 } },
  doomfist_momentum: { id: "doomfist_momentum", name: "Vengeful Momentum", type: "attack", cost: 2, hero: "doomfist", rarity: "rare", damage: 13, costPerDamageTaken: 12, text: "Deal 13 damage. Costs 1 less per 12 damage you have taken this combat.", up: { damage: 17 } },


  // ---------------- NEUTRAL (reward pool, any hero) ----------------
  n_block: { id: "n_block", name: "Reinforce", type: "skill", cost: 0, rarity: "common", block: 3, text: "Gain 3 Block.", up: { block: 5 } },
  n_strike: { id: "n_strike", name: "Strike", type: "attack", cost: 1, rarity: "common", damage: 6, text: "Deal 6 damage.", up: { damage: 9 } },
  n_vuln: { id: "n_vuln", name: "Expose", type: "skill", cost: 0, rarity: "common", vulnerable: 2, text: "Apply 2 Vulnerable.", up: { vulnerable: 3 } },
  n_heal: { id: "n_heal", name: "Field Kit", type: "skill", cost: 1, rarity: "common", heal: 5, text: "Heal 5 HP.", up: { heal: 8 } },
  n_focus: { id: "n_focus", name: "Focus", type: "skill", cost: 0, rarity: "uncommon", draw: 2, text: "Draw 2 cards.", up: { draw: 3 } },
  n_power: { id: "n_power", name: "Power Surge", type: "skill", cost: 1, rarity: "uncommon", strength: 1, block: 3, text: "Gain 1 Strength and 3 Block.", up: { strength: 2 } },
  // ---------------- REINHARDT (persistent armor / bulwark) ----------------
  rein_hammer: { id: "rein_hammer", name: "Rocket Hammer", type: "attack", cost: 1, hero: "reinhardt", rarity: "starter", damage: 6, damagePerArmor: 1, text: "Deal 6 damage, +1 per Armor.", up: { damage: 10 } },
  rein_plating: { id: "rein_plating", name: "Steel Plating", type: "skill", cost: 1, hero: "reinhardt", rarity: "starter", armor: 9, text: "Gain 9 Armor (Armor never expires).", up: { armor: 10 } },
  rein_barrier: { id: "rein_barrier", name: "Barrier Field", type: "skill", cost: 1, hero: "reinhardt", rarity: "starter", block: 5, blockFromArmor: true, text: "Gain 5 Block plus Block equal to your Armor.", up: { block: 8 } },
  rein_firestrike: { id: "rein_firestrike", name: "Fire Strike", type: "attack", cost: 1, hero: "reinhardt", rarity: "starter", damage: 6, aoe: true, ignoreBlock: true, text: "Deal 6 damage to ALL enemies, ignoring Block.", up: { damage: 9 } },
  rein_charge: { id: "rein_charge", name: "Charge", type: "attack", cost: 2, hero: "reinhardt", rarity: "starter", damage: 11, doubleIfArmor: 12, selfDamage: 3, text: "Take 3 damage. Deal 11 damage, doubled at 12+ Armor.", up: { damage: 15, doubleIfArmor: 10 } },
  rein_bulwark: { id: "rein_bulwark", name: "Barbed Bulwark", type: "skill", cost: 1, hero: "reinhardt", rarity: "common", thorns: 5, block: 3, text: "Gain 3 Block. Retaliate 5: attackers take 5 damage this turn.", up: { thorns: 8, block: 5 } },
  rein_forge: { id: "rein_forge", name: "Crusader Forge", type: "skill", cost: 0, hero: "reinhardt", rarity: "common", blockToArmor: true, text: "Reforge all of your Block into Armor.", up: { armor: 3 } },
  rein_bash: { id: "rein_bash", name: "Shield Bash", type: "attack", cost: 1, hero: "reinhardt", rarity: "uncommon", damage: 7, stealBlockAsArmor: true, text: "Deal 7 damage. Strip the target's Block and bolt it on as Armor.", up: { damage: 10 } },
  rein_smash: { id: "rein_smash", name: "Ground Smash", type: "attack", cost: 2, hero: "reinhardt", rarity: "uncommon", damage: 4, damagePerArmor: 1, aoe: true, text: "Deal 4 damage, +1 per Armor, to ALL enemies.", up: { damage: 8 } },
  rein_endure: { id: "rein_endure", name: "Endure", type: "skill", cost: 1, hero: "reinhardt", rarity: "uncommon", armor: 12, selfDamage: 5, text: "Take 5 damage. Gain 12 Armor.", up: { armor: 18 } },
  rein_rally: { id: "rein_rally", name: "Rally", type: "skill", cost: 1, hero: "reinhardt", rarity: "uncommon", armorPerCardPlayed: 3, draw: 1, text: "Draw 1. Gain 3 Armor per card played earlier this turn.", up: { armorPerCardPlayed: 4 } },
  rein_will: { id: "rein_will", name: "Unbreakable Will", type: "skill", cost: 2, hero: "reinhardt", rarity: "rare", armor: 8, strength: 2, retain: true, text: "Gain 8 Armor and 2 Strength. Retained in hand.", up: { armor: 12, strength: 3 } },
};

export const NEUTRAL_EXPANSION: Record<string, CardDef> = {
  n_gambit: { id: "n_gambit", name: "Gambit", type: "attack", cost: 1, rarity: "uncommon", damageEqualToBlock: true, exhaust: true, text: "Deal damage equal to your current Block. Exhaust." },
  n_overclock_cell: { id: "n_overclock_cell", name: "Overclock Cell", type: "skill", cost: 0, rarity: "uncommon", selfDamage: 4, draw: 2, energyGain: 1, exhaust: true, text: "Take 4 damage. Draw 2 cards. Gain 1 Energy. Exhaust.", up: { draw: 3 } },
  n_adrenaline: { id: "n_adrenaline", name: "Adrenaline Rush", type: "skill", cost: 2, rarity: "uncommon", freeIfCardsPlayed: 3, energyGain: 2, draw: 1, text: "Gain 2 Energy. Draw 1. Costs 0 if you have played 3+ cards this turn.", up: { draw: 2 } },
  n_scavenge: { id: "n_scavenge", name: "Scavenge", type: "attack", cost: 1, rarity: "common", damage: 4, goldOnKill: 15, text: "Deal 4 damage. If this kills the enemy, gain 15 gold.", up: { damage: 7 } },
  n_mirror_ward: { id: "n_mirror_ward", name: "Mirror Ward", type: "skill", cost: 1, rarity: "uncommon", block: 5, nextAttackBonusPct: 50, text: "Gain 5 Block. Your next Attack this turn deals +50% damage.", up: { block: 8 } },
  n_last_stand: { id: "n_last_stand", name: "Last Stand", type: "skill", cost: 1, rarity: "rare", strength: 1, lowHpStrength: 3, lowHpBlock: 10, exhaust: true, text: "Below half HP: gain 3 Strength and 10 Block. Otherwise gain 1 Strength. Exhaust.", up: { strength: 2 } },
  n_pawn_shop: { id: "n_pawn_shop", name: "Pawn Shop", type: "skill", cost: 0, rarity: "uncommon", goldCost: 45, draw: 2, energyGain: 1, exhaust: true, text: "Spend 45 gold. Draw 2 cards and gain 1 Energy. Exhaust.", up: { draw: 3 } },
  n_bloodletting: { id: "n_bloodletting", name: "Bloodletting", type: "attack", cost: 0, rarity: "uncommon", damage: 8, selfDamage: 5, text: "Take 5 damage. Deal 8 damage.", up: { damage: 11 } },

  n_salvage_rites: { id: "n_salvage_rites", name: "Salvage Rites", type: "skill", cost: 1, rarity: "uncommon", blockPerExhaust: 4, text: "Gain 4 Block for each card in your exhaust pile.", up: { block: 4 } },
  n_second_wind: { id: "n_second_wind", name: "Second Wind", type: "skill", cost: 1, rarity: "uncommon", blockToHealRatio: 2, draw: 1, exhaust: true, text: "Convert all your Block into 1 HP per 2 Block. Draw 1. Exhaust.", up: { draw: 2 } },
  n_all_in: { id: "n_all_in", name: "All In", type: "attack", cost: 2, rarity: "rare", damage: 9, doubleIfHandEmpty: true, exhaust: true, text: "Deal 9 damage, doubled if your hand is empty. Exhaust.", up: { damage: 13 } },
};

Object.assign(CARDS, NEUTRAL_EXPANSION);

export const NEUTRAL_POOL = [
  "n_block",
  "n_strike",
  "n_vuln",
  "n_heal",
  "n_focus",
  "n_power",
  ...Object.keys(NEUTRAL_EXPANSION),
];

export function makeCard(defId: string, upgraded = false): CardInstance {
  const base = CARDS[defId];
  if (!base) throw new Error(`Unknown card: ${defId}`);
  const merged: CardInstance = { ...base, uid: nextUid(defId), upgraded 
};
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
    if (up.damagePerBlock !== undefined) merged.damagePerBlock = up.damagePerBlock;
    if (up.blockPerAttackPlayed !== undefined) merged.blockPerAttackPlayed = up.blockPerAttackPlayed;
    if (up.damagePerDebuff !== undefined) merged.damagePerDebuff = up.damagePerDebuff;
    if (up.bonusHealIfLowHp !== undefined) merged.bonusHealIfLowHp = up.bonusHealIfLowHp;
    if (up.randomHits !== undefined) merged.randomHits = up.randomHits;
    if (up.poison !== undefined) merged.poison = up.poison;
    if (up.regen !== undefined) merged.regen = up.regen;
    if (up.poisonBoost !== undefined) merged.poisonBoost = up.poisonBoost;
    if (up.poisonDetonate !== undefined) merged.poisonDetonate = up.poisonDetonate;
  }
  return merged;
}
