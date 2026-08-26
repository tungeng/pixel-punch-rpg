import rockethammer from "../assets/icons/rockethammer.png";
import firestrike from "../assets/icons/firestrike.png";
import barrierfield from "../assets/icons/barrierfield.png";
import steelplating from "../assets/icons/steelplating.png";
import earthshatter from "../assets/icons/earthshatter.png";
import spikeshield from "../assets/icons/spikeshield.png";
import crusaderforge from "../assets/icons/crusaderforge.png";
import shieldcharge from "../assets/icons/shieldcharge.png";
import shieldbash from "../assets/icons/shieldbash.png";
import dash from "../assets/icons/dash.png";
import dualpistols from "../assets/icons/dualpistols.png";
import rewind from "../assets/icons/rewind.png";
import bullets from "../assets/icons/bullets.png";
import plasma from "../assets/icons/plasma.png";
import syringe from "../assets/icons/syringe.png";
import bootshield from "../assets/icons/bootshield.png";
import reload from "../assets/icons/reload.png";
import crossblades from "../assets/icons/crossblades.png";
import caduceus from "../assets/icons/caduceus.png";
import healbeam from "../assets/icons/healbeam.png";
import boostarrow from "../assets/icons/boostarrow.png";
import wingshield from "../assets/icons/wingshield.png";
import halo from "../assets/icons/halo.png";
import crossbullet from "../assets/icons/crossbullet.png";
import hush from "../assets/icons/hush.png";
import regenheart from "../assets/icons/regenheart.png";
import poisonskull from "../assets/icons/poisonskull.png";
import shuriken from "../assets/icons/shuriken.png";
import slasharc from "../assets/icons/slasharc.png";
import deflect from "../assets/icons/deflect.png";
import dragonfang from "../assets/icons/dragonfang.png";
import speedwing from "../assets/icons/speedwing.png";
import spiritdragon from "../assets/icons/spiritdragon.png";
import parry from "../assets/icons/parry.png";
import dashfoot from "../assets/icons/dashfoot.png";
import bladefan from "../assets/icons/bladefan.png";
import grenadelauncher from "../assets/icons/grenadelauncher.png";
import beartrap from "../assets/icons/beartrap.png";
import mine from "../assets/icons/mine.png";
import tirebomb from "../assets/icons/tirebomb.png";
import rpg from "../assets/icons/rpg.png";
import pellets from "../assets/icons/pellets.png";
import junkshield from "../assets/icons/junkshield.png";
import frag from "../assets/icons/frag.png";
import explosion from "../assets/icons/explosion.png";
import gauntlet from "../assets/icons/gauntlet.png";
import groundslam from "../assets/icons/groundslam.png";
import energybarrier from "../assets/icons/energybarrier.png";
import uppercut from "../assets/icons/uppercut.png";
import swordshield from "../assets/icons/swordshield.png";
import meteor from "../assets/icons/meteor.png";
import bruise from "../assets/icons/bruise.png";
import fortify from "../assets/icons/fortify.png";
import quake from "../assets/icons/quake.png";
import reinforce from "../assets/icons/reinforce.png";
import sword from "../assets/icons/sword.png";
import crosshair from "../assets/icons/crosshair.png";
import medkit from "../assets/icons/medkit.png";
import focuseye from "../assets/icons/focuseye.png";
import lightning from "../assets/icons/lightning.png";
import carddraw from "../assets/icons/carddraw.png";
import pulsebomb from "../assets/icons/pulsebomb.png";
import valkyrie from "../assets/icons/valkyrie.png";
import dragonblade from "../assets/icons/dragonblade.png";
import riptire from "../assets/icons/riptire.png";
import meteorfist from "../assets/icons/meteorfist.png";
import fireburst from "../assets/icons/fireburst.png";
import chronoflurry from "../assets/icons/chronoflurry.png";
import overclockicon from "../assets/icons/overclock.png";
import lastrites from "../assets/icons/lastrites.png";
import overflowbarrier from "../assets/icons/overflowbarrier.png";
import dragonrush from "../assets/icons/dragonrush.png";
import windcut from "../assets/icons/windcut.png";
import loosecannon from "../assets/icons/loosecannon.png";
import scrapheap from "../assets/icons/scrapheap.png";
import executionericon from "../assets/icons/executioner.png";
import momentum from "../assets/icons/momentum.png";
import voidskull from "../assets/icons/voidskull.png";
import potion from "../assets/icons/potion.png";
import clawslash from "../assets/icons/clawslash.png";
import brokenshield from "../assets/icons/brokenshield.png";
import timevortex from "../assets/icons/timevortex.png";
import reconmode from "../assets/icons/reconmode.png";
import sentrymode from "../assets/icons/sentrymode.png";
import tankmode from "../assets/icons/tankmode.png";
import selfrepair from "../assets/icons/selfrepair.png";
import tacgrenade from "../assets/icons/tacgrenade.png";
import ricochet from "../assets/icons/ricochet.png";
import bunkericon from "../assets/icons/bunker.png";
import artillery from "../assets/icons/artillery.png";

/** Per-card pixel-art effect icon (replaces hero portraits on cards). */
export const CARD_ICONS: Record<string, string> = {
  // Tracer
  tracer_blink: dash,
  tracer_pistols: dualpistols,
  tracer_recall: rewind,
  tracer_strafe: bullets,
  tracer_charged: plasma,
  tracer_adrenaline: syringe,
  tracer_reload: reload,
  tracer_dual: crossblades,
  tracer_flurry: chronoflurry,
  tracer_overclock: overclockicon,
  tracer_pulse: pulsebomb,
  // Mercy
  mercy_blaster: caduceus,
  mercy_heal: healbeam,
  mercy_boost: boostarrow,
  mercy_guardian: wingshield,
  mercy_resurrect: halo,
  mercy_pacify: hush,
  mercy_regen: regenheart,
  mercy_blight: poisonskull,
  mercy_lastrites: lastrites,
  mercy_overflow: overflowbarrier,
  mercy_valkyrie: valkyrie,
  // Genji
  genji_shuriken: shuriken,
  genji_swift: slasharc,
  genji_deflect: deflect,
  genji_agility: speedwing,
  genji_spirit: spiritdragon,
  genji_dash: dashfoot,
  genji_storm: bladefan,
  genji_rush: dragonrush,
  genji_windcut: windcut,
  genji_dragon: dragonblade,
  // Junkrat
  junkrat_launcher: grenadelauncher,
  junkrat_trap: beartrap,
  junkrat_concussive: mine,
  junkrat_mine: tirebomb,
  junkrat_rpg: rpg,
  junkrat_scatter: pellets,
  junkrat_armor: junkshield,
  junkrat_rummage: scrapheap,
  junkrat_frag: frag,
  junkrat_blast: explosion,
  junkrat_scrap: scrapheap,
  junkrat_riptire: riptire,
  // Moira
  moira_orb_dmg: poisonskull,
  moira_orb_heal: syringe,
  moira_grasp: clawslash,
  moira_fade: brokenshield,
  moira_decay: voidskull,
  moira_surge: focuseye,
  moira_bloom: fireburst,
  moira_contagion: pellets,
  moira_miasma: plasma,
  moira_bioticfield: potion,
  moira_purge: explosion,
  moira_leech: healbeam,
  moira_coalescence: timevortex,
  rein_hammer: rockethammer,
  rein_plating: steelplating,
  rein_barrier: barrierfield,
  rein_firestrike: firestrike,
  rein_charge: shieldcharge,
  rein_bulwark: spikeshield,
  rein_bash: shieldbash,
  rein_smash: quake,
  rein_endure: fortify,
  rein_rally: reinforce,
  rein_will: swordshield,
  rein_earthshatter: earthshatter,
  // Doomfist
  doomfist_punch: gauntlet,
  doomfist_slam: groundslam,
  doomfist_shield: energybarrier,
  doomfist_uppercut: uppercut,
  doomfist_bestdefense: swordshield,
  doomfist_charge: meteor,
  doomfist_bruise: bruise,
  doomfist_fortify: fortify,
  doomfist_quake: quake,
  doomfist_executioner: executionericon,
  doomfist_momentum: momentum,
  doomfist_meteor: meteorfist,
  // Bastion
  bastion_rounds: bullets,
  bastion_plating: steelplating,
  bastion_recon: reconmode,
  bastion_sentry: sentrymode,
  bastion_assaultmode: tankmode,
  bastion_repair: selfrepair,
  bastion_suppress: pellets,
  bastion_grenade: tacgrenade,
  bastion_recalibrate: reload,
  bastion_ricochet: ricochet,
  bastion_assault: bullets,
  bastion_burst: fireburst,
  bastion_bunker: bunkericon,
  bastion_lockdown: spikeshield,
  bastion_overhaul: medkit,
  bastion_siege: tankmode,
  bastion_artillery: artillery,
  // Neutral
  n_block: reinforce,
  n_strike: sword,
  n_vuln: crosshair,
  n_heal: medkit,
  n_focus: focuseye,
  n_power: lightning,
};

export const FALLBACK_ICON = fireburst;
export const CARD_DRAW_ICON = carddraw;
