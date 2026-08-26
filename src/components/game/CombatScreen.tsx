import { useGame, effectiveCost, cardDealsDamage } from "@/game/store";
import { HEROES } from "@/game/heroes";
import { AnimatePresence, motion } from "motion/react";
import { CardView } from "./CardView";
import { Bar } from "./Bar";
import { PixelButton } from "./PixelButton";
import { useEffect, useRef, useState } from "react";
import type { CardInstance } from "@/game/types";
import { RelicTray } from "./RelicTray";
import { HeroVfx, BEAM_HEROES } from "./HeroVfx";
import { UltimateAnnounce } from "./UltimateAnnounce";
import { FractureChoice } from "./FractureChoice";
import { KeywordTips } from "./KeywordTips";
import { BossOutro } from "./BossOutro";

/**
 * Picks which of the hero's three signature attack animations to play:
 * 0 = basic strike, 1 = multi-hit / combo flourish, 2 = heavy or AoE finisher.
 */
function vfxVariantFor(card: CardInstance): number {
  if (card.aoe || card.type === "ultimate" || (card.damage ?? 0) >= 12) return 2;
  if ((card.hits ?? 1) > 1 || card.hitsPerAttack || card.randomHits) return 1;
  return 0;
}




/** Slay-the-Spire style intent readout: what the enemy will do, and for how much. */
function intentParts(intent: {
  type: string;
  damage?: number;
  hits?: number;
  block?: number;
  strength?: number;
  vulnerable?: number;
  weak?: number;
  poison?: number;
  summonId?: string;
  hack?: "energy" | "draw";
}) {
  const out: { icon: string; text: string; color: string }[] = [];
  if (intent.type === "summon") out.push({ icon: "SUM", text: "+1", color: "#ff9f43" });
  if (intent.damage) {
    out.push({
      icon: "ATK",
      text: `${intent.damage}${intent.hits && intent.hits > 1 ? `x${intent.hits}` : ""}`,
      color: "#ff3b3b",
    });
  }
  if (intent.block) out.push({ icon: "DEF", text: `${intent.block}`, color: "#54a8ff" });
  if (intent.strength) out.push({ icon: "STR", text: `+${intent.strength}`, color: "#54d98c" });
  if (intent.vulnerable) out.push({ icon: "VULN", text: `${intent.vulnerable}`, color: "#ffcc4d" });
  if (intent.weak) out.push({ icon: "WEAK", text: `${intent.weak}`, color: "#c47bff" });
  if (intent.poison) out.push({ icon: "PSN", text: `${intent.poison}`, color: "#5ce68a" });
  if (intent.hack) out.push({ icon: "HACK", text: intent.hack.toUpperCase(), color: "#ff5cf0" });
  if (out.length === 0) out.push({ icon: "?", text: "", color: "#cbd5e1" });
  return out;
}


const BURST = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { x: Math.cos(a) * 34, y: Math.sin(a) * 30 };
});

export function CombatScreen() {
  const combat = useGame((s) => s.combat);
  const heroId = useGame((s) => s.heroId);
  const gold = useGame((s) => s.gold);
  const hasNullSectorCore = useGame((s) => s.relics.includes("null_sector_core"));
  const playCard = useGame((s) => s.playCard);
  const selectTarget = useGame((s) => s.selectTarget);
  const cancelTarget = useGame((s) => s.cancelTarget);
  const endTurn = useGame((s) => s.endTurn);
  const useUlt = useGame((s) => s.useUltimate);
  const [ultAnnounce, setUltAnnounce] = useState(false);
  const pruneFloats = useGame((s) => s.pruneFloats);


  const [shake, setShake] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  /** major, slower announcement reserved for boss openings and phase turns */
  const [bigBanner, setBigBanner] = useState<{ kicker: string; text: string; seq: number } | null>(
    null,
  );
  const [flash, setFlash] = useState<{ seq: number; kind: "big" | "kill" | "boss" } | null>(null);
  const [flying, setFlying] = useState<CardInstance | null>(null);
  const [lunge, setLunge] = useState(0);
  const [sweep, setSweep] = useState(0);
  const [vfx, setVfx] = useState(0);
  const [vfxVariant, setVfxVariant] = useState(0);
  const [aimUid, setAimUid] = useState<string | null>(null);

  const [blockFlash, setBlockFlash] = useState(0);
  const [healFlash, setHealFlash] = useState(0);
  const prevHp = useRef<number | null>(null);
  const prevBlock = useRef<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fxSeq = useRef(0);
  const bannerSeq = useRef(0);

  /** children report notable hits so the screen itself can react once, briefly */
  const onImpact = (kind: "big" | "kill" | "boss") => {
    fxSeq.current += 1;
    setFlash({ seq: fxSeq.current, kind });
  };
  const onPhase = (kicker: string, text: string) => {
    bannerSeq.current += 1;
    setBigBanner({ kicker, text, seq: bannerSeq.current });
  };

  useEffect(() => {
    const t = setInterval(pruneFloats, 400);
    return () => clearInterval(t);
  }, [pruneFloats]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const hp = combat?.hp ?? null;
  useEffect(() => {
    if (hp == null) return;
    if (prevHp.current != null && hp < prevHp.current) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 300);
      prevHp.current = hp;
      return () => clearTimeout(t);
    }
    if (prevHp.current != null && hp > prevHp.current) setHealFlash((n) => n + 1);
    prevHp.current = hp;
    return;
  }, [hp]);

  const blockVal = combat?.block ?? null;
  useEffect(() => {
    if (blockVal == null) return;
    if (prevBlock.current != null && blockVal > prevBlock.current) setBlockFlash((n) => n + 1);
    prevBlock.current = blockVal;
  }, [blockVal]);

  const turn = combat?.turn ?? 0;
  const isBossFight = !!combat?.isBoss;
  const bossName = combat?.enemies[0]?.name ?? "";
  useEffect(() => {
    if (turn === 0) return;
    // Turn 1 of a boss fight gets the heavy announcement instead of "TURN 1".
    if (turn === 1 && isBossFight) {
      bannerSeq.current += 1;
      setBigBanner({ kicker: "BREACH CONTACT", text: bossName, seq: bannerSeq.current });
      return;
    }
    setBanner(`TURN ${turn}`);
  }, [turn, isBossFight, bossName]);


  if (!combat) return null;
  const hero = HEROES[heroId]!;
  const targeting = !!combat.targetingCardUid;
  const ultimateReady = combat.ultCharge >= 100 || (hasNullSectorCore && !combat.freeUltUsed);
  const hand = combat.hand;
  const mid = (hand.length - 1) / 2;
  // Turn readability: when nothing in hand is castable the END button becomes the
  // obvious next input instead of the player hunting for a play they cannot make.
  const hasPlayable = hand.some(
    (card) =>
      effectiveCost(card, combat) <= combat.energy &&
      !(card.goldCost && gold < card.goldCost) &&
      combat.hackedType !== card.type,
  );
  // fit the fan inside the portrait viewport by scaling it down instead of
  // overlapping cards — overlap used to hide the right edge of each card's text
  const CARD_W = 100;
  const CARD_GAP = 2;
  const AVAIL = 404;
  const handWidth = hand.length * CARD_W + Math.max(0, hand.length - 1) * CARD_GAP;
  const handScale = handWidth > AVAIL ? AVAIL / handWidth : 1;
  const overlap = -CARD_GAP;


  /** play the card only after its fly-to-center + hero lunge has read on screen */
  const launch = (card: CardInstance, resolve: () => void) => {
    if (flying) return;
    setFlying(card);
    if (cardDealsDamage(card)) {
      // Mercy/Moira project a beam instead of physically closing the distance.
      if (!BEAM_HEROES.has(heroId)) setLunge((n) => n + 1);
      setVfxVariant(vfxVariantFor(card));
      setVfx((n) => n + 1);
    }
    if (card.aoe && cardDealsDamage(card)) setSweep((n) => n + 1);

    const t = setTimeout(() => {
      setFlying(null);
      resolve();
    }, 260);
    timers.current.push(t);
  };

  const onPlayCard = (card: CardInstance) => {
    if (effectiveCost(card, combat) > combat.energy) return;
    if (card.goldCost && gold < card.goldCost) return;
    const living = combat.enemies.filter((e) => !e.isDead && !e.untargetable);
    const needsTarget = cardDealsDamage(card) && !card.aoe && living.length > 1;
    if (needsTarget) {
      playCard(card.uid);
      return;
    }
    launch(card, () => playCard(card.uid));
  };

  const onSelectTarget = (enemyUid: string) => {
    setAimUid(enemyUid);
    const card = combat.hand.find((c) => c.uid === combat.targetingCardUid);
    if (!card) return selectTarget(enemyUid);
    return launch(card, () => selectTarget(enemyUid));
  };


  return (
    <div
      className={`relative flex h-full flex-col ${shake ? "screen-shake" : ""}`}
      style={{
        backgroundImage: `url(${combat.bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        imageRendering: "pixelated",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/55" />
      <div className="scanlines pointer-events-none absolute inset-0" />
      <div className="vignette pointer-events-none absolute inset-0" />

      {/* persistent relic tray — tap an icon to read what it does */}
      <div className="absolute left-2 top-2 z-40 w-40">
        <RelicTray size={20} />
      </div>

      {/* Timeline Fracture opening choice */}
      <FractureChoice />

      {/* first-encounter keyword tutorials */}
      <KeywordTips />
      <BossOutro />

      {/* boss dossier bar — a boss fight announces itself before you read the sprite */}
      {combat.isBoss && combat.enemies[0] && (
        <div className="pointer-events-none absolute left-1/2 top-2 z-30 w-[62%] -translate-x-1/2">
          <div
            className="px-2 py-1"
            style={{ background: "#12060f", border: "2px solid #ff5cf0", boxShadow: "0 0 12px #ff5cf055" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-pixel text-[7px] tracking-widest" style={{ color: "#ff5cf0" }}>
                BOSS
              </span>
              <span className="text-pixel text-[7px] text-foreground/70">
                {Math.max(0, Math.round((combat.enemies[0].hp / Math.max(1, combat.enemies[0].maxHp)) * 100))}%
              </span>
            </div>
            <div className="text-pixel mt-0.5 truncate text-[9px] text-foreground">
              {combat.enemies[0].name}
            </div>
          </div>
        </div>
      )}

      {/* arena — enemies centered in the remaining space */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="relative flex flex-1 items-center justify-center gap-1 px-3 pt-3">
          {combat.enemies.map((e, i) => {
            // stagger enemies across front/back depth slots instead of one flat row
            const n = combat.enemies.length;
            const depth = n === 1 ? 0 : i % 2 === 0 ? 0 : 1;
            return (
              <EnemyView
                key={e.uid}
                enemyUid={e.uid}
                targeting={targeting}
                aiming={aimUid === e.uid}
                depth={depth}
                onSelect={onSelectTarget}
                onImpact={onImpact}
                onPhase={onPhase}
              />
            );
          })}


          {/* AoE sweep — a shockwave that crosses every depth slot */}
          <AnimatePresence>
            {sweep > 0 && (
              <motion.div
                key={`sweep-${sweep}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
              >
                <div
                  className="aoe-sweep absolute inset-y-0 -left-1/2 w-1/2"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #ffcc4d55, #ffffffcc, #ff7a4555, transparent)",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* per-hero attack flourish */}
          {vfx > 0 && <HeroVfx key={`vfx-${vfx}`} heroId={heroId} variant={vfxVariant} />}
        </div>


        {/* log */}
        <div
          className="mx-3 mb-1 h-[42px] shrink-0 overflow-hidden rounded-[2px] border-2 border-white/10 bg-black/50 px-2 py-1 text-[12px] leading-[13px] text-foreground/75"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          <AnimatePresence initial={false}>
            {combat.log.slice(-3).map((l, i) => (
              <motion.div
                key={`${combat.log.length - 3 + i}-${l}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {l}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* player */}
      <div className="relative z-10 flex shrink-0 items-end justify-between px-3">

        <div className="relative">
          <motion.div
            key={`lunge-${lunge}`}
            initial={{ x: 0, y: 0 }}
            animate={lunge > 0 ? { x: [0, 22, 30, 0], y: [0, -14, -6, 0] } : { x: 0, y: 0 }}
            transition={{ duration: 0.34, times: [0, 0.35, 0.55, 1], ease: "easeOut" }}
          >
            <motion.img
              src={hero.asset}
              alt={hero.name}
              className="pixelated idle-bob h-24 w-24 object-contain"
              animate={shake ? { x: [0, -5, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.3 }}
              style={{ filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.6))" }}
            />
          </motion.div>

          {/* block gained — blue shield flash */}
          <AnimatePresence>
            {blockFlash > 0 && (
              <motion.div
                key={`blk-${blockFlash}`}
                initial={{ opacity: 0.9, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  border: "3px solid #54a8ff",
                  boxShadow: "0 0 18px 4px #54a8ff inset, 0 0 16px 2px #54a8ff",
                }}
              />
            )}
          </AnimatePresence>

          {/* healed — green pulse */}
          <AnimatePresence>
            {healFlash > 0 && (
              <motion.div
                key={`heal-${healFlash}`}
                initial={{ opacity: 0.75, scale: 0.7 }}
                animate={{ opacity: 0, scale: 1.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, #54d98caa, transparent 68%)" }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {combat.floats
              .filter((f) => f.target === "player")
              .slice(-4)
              .map((f) => (
                <FloatText key={f.id} text={f.text} kind={f.kind} of={combat.maxHp} />
              ))}
          </AnimatePresence>

          <div className="absolute -right-1 top-0 flex flex-col items-end gap-1">
            {(() => {
              const incoming = combat.enemies
                .filter((e) => !e.isDead)
                .reduce(
                  (n, e) =>
                    n +
                    (e.intent.type === "attack" || e.intent.type === "attack_block"
                      ? (e.intent.damage ?? 0) * (e.intent.hits ?? 1)
                      : 0),
                  0,
                );
              if (incoming <= 0) return null;
              const net = Math.max(0, incoming - combat.block - combat.armor);
              // A turn that can kill you must never read like an ordinary turn.
              const lethal = net >= combat.hp;
              if (lethal) {
                return (
                  <motion.div
                    animate={{ opacity: [1, 0.45, 1] }}
                    transition={{ repeat: Infinity, duration: 0.9 }}
                  >
                    <Badge text={`LETHAL ${net} vs ${combat.hp} HP`} color="#ff3b3b" />
                  </motion.div>
                );
              }
              return (
                <Badge
                  text={net > 0 ? `INCOMING ${incoming} → ${net} HP` : `INCOMING ${incoming} BLOCKED`}
                  color={net > 0 ? "#ff5c7a" : "#54d98c"}
                />
              );
            })()}

            {combat.block > 0 && <Badge text={`🛡 ${combat.block}`} color="#54a8ff" />}
            {combat.stance && (
              <Badge
                text={
                  combat.stance === "recon"
                    ? "▷ RECON +DRAW"
                    : combat.stance === "sentry"
                      ? "▣ SENTRY +HIT / +DMG TAKEN"
                      : "◤ TANK PIERCE / NO BLOCK"
                }
                color={combat.stance === "recon" ? "#84cc16" : combat.stance === "sentry" ? "#fbbf24" : "#f87171"}
              />
            )}
            {combat.armor > 0 && <Badge text={`⛨ ${combat.armor} ARM`} color="#38bdf8" />}
            {combat.thorns > 0 && <Badge text={`RETALIATE ${combat.thorns}`} color="#f87171" />}
            {combat.strength > 0 && <Badge text={`▲ ${combat.strength}`} color="#ff7a45" />}
            {combat.vulnerable > 0 && <Badge text={`VULN ${combat.vulnerable}`} color="#ffcc4d" />}
            {combat.weak > 0 && <Badge text={`WEAK ${combat.weak}`} color="#c47bff" />}
            {combat.poison > 0 && <Badge text={`VENOM ${combat.poison}`} color="#54d98c" />}
            {combat.regen > 0 && <Badge text={`REGEN ${combat.regen}`} color="#7cf5c4" />}
            {combat.poisonBoost > 0 && <Badge text={`SURGE +${combat.poisonBoost}`} color="#c47bff" />}
            {combat.beams.length > 0 && <Badge text="COALESCENCE" color="#e879f9" />}
            {combat.hackedType && (
              <Badge text={`HACKED ${combat.hackedType.toUpperCase()}`} color="#ff5cf0" />
            )}
          </div>

          <div className="mt-0.5 w-24">
            <Bar
              value={combat.hp}
              max={combat.maxHp}
              color="linear-gradient(90deg,#54d98c,#a8ff60)"
              height={16}
              label={`${combat.hp}/${combat.maxHp}`}
            />
          </div>

        </div>

        {/* energy orb + piles */}
        <div className="flex flex-col items-end gap-1 pb-1">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div
              className="energy-ring absolute inset-0"
              style={{
                border: "3px dashed #54a8ff",
                borderRadius: "50%",
                opacity: 0.7,
              }}
            />
            <motion.div
              key={combat.energy}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              className="text-pixel flex h-10 w-10 items-center justify-center rounded-full text-[11px] text-black"
              style={{
                background: "radial-gradient(circle at 35% 30%, #bde3ff, #2a7fd4)",
                border: "3px solid #07060c",
                boxShadow: "0 0 14px 1px #54a8ff",
              }}
            >
              {combat.energy}
            </motion.div>
          </div>
          <div className="flex gap-1">
            <PileChip label="DRAW" value={combat.drawPile.length} color="#54a8ff" />
            <PileChip label="DISCARD" value={combat.discardPile.length} color="#c47bff" />
          </div>

        </div>
      </div>

      {/* ult bar + end turn */}
      <div className="relative z-10 flex items-center gap-2 px-3 pt-2">
        <div className="flex-1">
          <Bar
            value={combat.ultCharge}
            max={100}
            color="linear-gradient(90deg,#c47bff,#ff6bd6)"
            label={`ULT ${combat.ultCharge}%`}
            height={14}
          />
        </div>
        <motion.div
          animate={ultimateReady ? { scale: [1, 1.07, 1] } : { scale: 1 }}
          transition={{ repeat: ultimateReady ? Infinity : 0, duration: 1 }}
        >
          <PixelButton
            onClick={() => {
              if (ultAnnounce) return;
              setUltAnnounce(true);
            }}
            disabled={!ultimateReady || ultAnnounce}
            color="danger"
            className="px-3 py-2"
          >
            ULT
          </PixelButton>
        </motion.div>
        <motion.div
          animate={hasPlayable ? { scale: 1 } : { scale: [1, 1.08, 1] }}
          transition={{ repeat: hasPlayable ? 0 : Infinity, duration: 1.1 }}
        >
          <PixelButton onClick={endTurn} color={hasPlayable ? "secondary" : "primary"} className="px-3 py-2">
            END
          </PixelButton>
        </motion.div>
      </div>

      {/* hand — fanned, scaled to fit so no card text is covered */}
      <div className="relative z-10 flex shrink-0 items-end justify-center overflow-visible px-2 pb-6 pt-3">
        <div
          className="flex items-end justify-center"
          style={{ transform: `scale(${handScale})`, transformOrigin: "bottom center" }}
        >
          <AnimatePresence mode="popLayout">
            {hand.map((card, i) => {
              const dimmed =
                effectiveCost(card, combat) > combat.energy ||
                (!!card.goldCost && gold < card.goldCost) ||
                combat.hackedType === card.type;
              const offset = i - mid;
              return (
                <motion.div
                  key={card.uid}
                  className="shrink-0"
                  layout
                  initial={{ y: 90, opacity: 0, rotate: 0 }}
                  animate={{
                    y: Math.abs(offset) * 3 - 12,
                    opacity: 1,
                    rotate: offset * 2,
                  }}
                  exit={{ y: -140, opacity: 0, scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  style={{
                    marginLeft: i === 0 ? 0 : -overlap,
                    zIndex: 10 + i,
                    transformOrigin: "bottom center",
                  }}
                >
                  <CardView
                    card={card}
                    dimmed={dimmed || flying?.uid === card.uid}
                    onClick={() => onPlayCard(card)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>


      {/* card in flight — flies from hand up to the arena before resolving */}
      <AnimatePresence>
        {flying && (
          <motion.div
            key={flying.uid}
            initial={{ y: 0, scale: 0.9, opacity: 0.95, rotate: 0 }}
            animate={{ y: -230, scale: 1.15, opacity: 0, rotate: 6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="pointer-events-none absolute bottom-10 left-1/2 z-40 -translate-x-1/2"
          >
            <CardView card={flying} />
          </motion.div>
        )}
      </AnimatePresence>


      {/* targeting overlay */}
      <AnimatePresence>
        {targeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-start pt-1"
          >
            <div className="text-pixel animate-pulse bg-black/70 px-2 py-1 text-[8px] text-primary">
              SELECT A TARGET
            </div>
            <div className="pointer-events-auto absolute bottom-44">
              <PixelButton onClick={cancelTarget} color="ghost">
                Cancel
              </PixelButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* minor beat: the turn ticker is quick and thin so it never costs tempo */}
      {banner && (
        <motion.div
          key={banner}
          initial={{ x: "-110%", opacity: 0, skewX: -14 }}
          animate={{
            x: ["-110%", "0%", "0%", "110%"],
            opacity: [0, 1, 1, 0],
            skewX: [-14, 0, 0, 14],
          }}
          transition={{ duration: 0.6, times: [0, 0.22, 0.55, 1], ease: "easeInOut" }}
          onAnimationComplete={() => setBanner(null)}
          className="text-pixel pointer-events-none absolute left-0 right-0 top-1/3 z-30 bg-primary/85 py-1 text-center text-[11px] text-black"
        >
          {banner}
        </motion.div>
      )}

      {/* run-defining beat: boss contact and phase turns get weight and darkness */}
      <AnimatePresence>
        {bigBanner && (
          <motion.div
            key={`big-${bigBanner.seq}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.7, times: [0, 0.14, 0.72, 1] }}
            onAnimationComplete={() => setBigBanner(null)}
            className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.82, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-[86%] px-3 py-3 text-center"
              style={{
                background: "#0b0410",
                border: "3px solid #ff5cf0",
                boxShadow: "0 0 26px #ff5cf066",
              }}
            >
              <div className="text-pixel text-[8px] tracking-[0.3em]" style={{ color: "#ff5cf0" }}>
                {bigBanner.kicker}
              </div>
              <div className="text-pixel mt-2 text-[16px] leading-[20px] text-foreground">
                {bigBanner.text}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* impact wash — one short frame of colour so big hits register physically */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={`flash-${flash.seq}`}
            initial={{ opacity: flash.kind === "boss" ? 0.85 : flash.kind === "kill" ? 0.5 : 0.28 }}
            animate={{ opacity: 0 }}
            transition={{ duration: flash.kind === "boss" ? 0.5 : 0.26, ease: "easeOut" }}
            onAnimationComplete={() => setFlash(null)}
            className="pointer-events-none absolute inset-0 z-[55]"
            style={{
              background:
                flash.kind === "boss"
                  ? "#ffffff"
                  : flash.kind === "kill"
                    ? "radial-gradient(circle, #fff2c2, transparent 72%)"
                    : "radial-gradient(circle, #ffd9a0, transparent 78%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* near death — a standing warning frame instead of a one-off cue you can miss */}
      {combat.hp > 0 && combat.hp / combat.maxHp <= 0.25 && (
        <motion.div
          animate={{ opacity: [0.35, 0.85, 0.35] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
          className="pointer-events-none absolute inset-0 z-[50]"
          style={{ boxShadow: "inset 0 0 60px 14px #ff2b4d", border: "2px solid #ff2b4d55" }}
        />
      )}


      {/* ultimate announcement — visual only; the ult resolves when it finishes */}
      <AnimatePresence>
        {ultAnnounce && (
          <UltimateAnnounce
            key="ult-announce"
            hero={hero}
            onDone={() => {
              setUltAnnounce(false);
              useUlt();
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

function EnemyView({
  enemyUid,
  targeting,
  aiming,
  depth,
  onSelect,
  onImpact,
  onPhase,
}: {
  enemyUid: string;
  targeting: boolean;
  aiming?: boolean;
  depth: number;
  onSelect: (uid: string) => void;
  onImpact: (kind: "big" | "kill" | "boss") => void;
  onPhase: (kicker: string, text: string) => void;
}) {
  const enemy = useGame((s) => s.combat?.enemies.find((e) => e.uid === enemyUid));
  const floats = useGame((s) => s.combat?.floats ?? []);
  /** hit pulse: seq re-triggers the animation, ratio = damage / max HP */
  const [hitFx, setHitFx] = useState<{ seq: number; ratio: number } | null>(null);
  const [hitstop, setHitstop] = useState(false);
  const [slain, setSlain] = useState(false);
  const prev = useRef<number | null>(null);
  const phased = useRef(false);
  const maxHp = enemy?.maxHp ?? 1;
  const isBoss = !!enemy?.isBoss;
  const isElite = !!enemy?.isElite;
  const name = enemy?.name ?? "";

  const hp = enemy?.hp ?? null;
  useEffect(() => {
    if (hp == null) return;
    if (prev.current != null && hp < prev.current) {
      const ratio = Math.min(1, (prev.current - hp) / Math.max(1, maxHp));
      const lethal = hp <= 0;
      setHitFx((f) => ({ seq: (f?.seq ?? 0) + 1, ratio }));
      if (lethal) {
        setHitstop(true);
        setSlain(true);
        onImpact(isBoss ? "boss" : "kill");
      } else if (ratio >= 0.22) {
        onImpact("big");
      }
      // bosses turn at the halfway mark: same rules, much louder presentation
      if (isBoss && !lethal && !phased.current && hp / Math.max(1, maxHp) <= 0.5) {
        phased.current = true;
        onPhase("THRESHOLD BREACHED", `${name} · PHASE II`);
      }
      const t = setTimeout(() => setHitFx(null), 340);
      const t2 = lethal ? setTimeout(() => setHitstop(false), lethal && isBoss ? 220 : 120) : undefined;
      prev.current = hp;
      return () => {
        clearTimeout(t);
        if (t2) clearTimeout(t2);
      };
    }
    prev.current = hp;
    return;
  }, [hp, maxHp, isBoss, name, onImpact, onPhase]);


  if (!enemy) return null;

  const hit = !!hitFx;
  const ratio = hitFx?.ratio ?? 0;
  const heavy = ratio > 0.2;
  // knockback + shake amplitude scale with how big the hit was
  const kick = 4 + ratio * 26;

  return (
    <motion.button
      layout
      onClick={targeting && !enemy.untargetable ? () => onSelect(enemyUid) : undefined}
      animate={
        enemy.isDead && !hitstop
          ? { opacity: 0, scale: 0.3, rotate: 25, y: 20 }
          : {
              opacity: 1,
              scale: (depth === 1 ? 0.8 : 1) * (targeting ? 1.05 : 1),
              y: depth === 1 ? -26 : 0,
            }
      }
      transition={hitstop ? { duration: 0 } : { duration: 0.35 }}

      style={{ zIndex: depth === 1 ? 1 : 2, filter: depth === 1 ? "brightness(0.82)" : "none" }}
      className={`relative flex flex-col items-center ${targeting ? "cursor-crosshair" : ""}`}
    >
      {/* aiming reticle on the enemy being targeted */}
      <AnimatePresence>
        {targeting && !enemy.isDead && !enemy.untargetable && (
          <motion.div
            key="reticle"
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: aiming ? 1 : 0.55, scale: aiming ? 1 : 1.12 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none absolute left-1/2 top-6 h-24 w-24 -translate-x-1/2 rounded-full"
            style={{
              border: `3px ${aiming ? "solid" : "dashed"} ${aiming ? "#ff3b3b" : "#ffcc4d"}`,
              boxShadow: aiming ? "0 0 18px 2px #ff3b3b" : "0 0 10px 0 #ffcc4d",
            }}
          />
        )}
      </AnimatePresence>
      {!enemy.isDead && (
        <motion.div
          key={enemy.intent.text}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-1 flex flex-col items-center"
        >
          <div className="flex items-center gap-1">
            {intentParts(enemy.intent).map((p, i) => (
              <div
                key={i}
                className="text-pixel flex items-center gap-0.5 px-1 py-0.5 text-[9px] text-black"
                style={{ background: p.color, border: "2px solid #07060c" }}
              >
                <span>{p.icon}</span>
                {p.text && <span>{p.text}</span>}
              </div>
            ))}
          </div>
          <div
            className="text-[12px] text-foreground/85"
            style={{ fontFamily: "var(--font-pixel-body)", textShadow: "1px 1px 0 #000" }}
          >
            {enemy.intent.text}
          </div>
        </motion.div>
      )}


      <motion.div
        key={`hitfx-${hitFx?.seq ?? 0}`}
        className={`relative ${hit ? "" : "idle-bob-slow"}`}
        animate={
          hit
            ? { x: [0, kick, -kick * 0.7, kick * 0.4, 0], rotate: heavy ? [0, -6, 4, 0] : [0, -2, 0] }
            : { x: 0, rotate: 0 }
        }
        transition={hitstop ? { duration: 0 } : { duration: heavy ? 0.34 : 0.2, ease: "easeOut" }}
      >
        <img
          src={enemy.asset}
          alt={enemy.name}
          className="pixelated h-24 w-24 object-contain"
          style={{
            opacity: enemy.untargetable ? 0.45 : 1,
            filter: hit
              ? heavy
                ? "drop-shadow(0 0 0 #fff) brightness(2.6) sepia(1) hue-rotate(-40deg) saturate(6)"
                : "drop-shadow(0 0 0 #fff) brightness(2.4)"
              : "drop-shadow(0 5px 0 rgba(0,0,0,0.55))",
            transition: "filter 0.1s",
          }}
        />

        {/* impact — white flash + pixel shrapnel burst */}
        <AnimatePresence>
          {hit && (
            <motion.div
              key="impact"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="pointer-events-none absolute inset-0"
            >
              <div
                className="absolute inset-0"
                style={{ background: "radial-gradient(circle, #ffffffcc, transparent 70%)" }}
              />
              {BURST.map((b, i) => (
                <motion.span
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{ x: b.x, y: b.y, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.34, ease: "easeOut" }}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    width: 5,
                    height: 5,
                    background: i % 2 ? "#ffcc4d" : "#ff5555",
                    boxShadow: "0 0 6px #ff9f43",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>



      {targeting && !enemy.isDead && (
        <div className="text-pixel absolute -top-1 text-[10px] text-destructive">✖</div>
      )}

      <div className="mt-1 w-28">
        <Bar
          value={enemy.hp}
          max={enemy.maxHp}
          color="linear-gradient(90deg,#ff3b3b,#ff7a45)"
          height={20}
          label={`${enemy.hp}/${enemy.maxHp}`}
        />
      </div>


      <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
        {enemy.block > 0 && <Badge text={`🛡${enemy.block}`} color="#54a8ff" />}
        {enemy.strength > 0 && <Badge text={`▲${enemy.strength}`} color="#ff7a45" />}
        {enemy.vulnerable > 0 && <Badge text={`V${enemy.vulnerable}`} color="#ffcc4d" />}
        {enemy.weak > 0 && <Badge text={`W${enemy.weak}`} color="#c47bff" />}
        {enemy.poison > 0 && <Badge text={`PSN ${enemy.poison}`} color="#5ce68a" />}
        {enemy.traitName && <Badge text={enemy.traitName} color="#ffb020" />}
        {enemy.untargetable && <Badge text="PHASED" color="#8d8dff" />}
        {enemy.enraged && <Badge text="ENRAGED" color="#ff3b3b" />}
      </div>
      <AnimatePresence>
        {floats
          .filter((f) => f.target === enemyUid)
          .slice(-4)
          .map((f) => (
            <FloatText key={f.id} text={f.text} kind={f.kind} />
          ))}
      </AnimatePresence>
    </motion.button>
  );
}


function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="text-pixel px-1 text-[7px] text-black"
      style={{ background: color, border: "2px solid #07060c" }}
    >
      {text}
    </span>
  );
}

function FloatText({ text, kind }: { text: string; kind: string }) {
  const color =
    kind === "heal"
      ? "#54d98c"
      : kind === "block"
        ? "#54a8ff"
        : kind === "buff"
          ? "#ffcc4d"
          : kind === "ult"
            ? "#c47bff"
            : "#ff5555";
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.7 }}
      animate={{ y: -44, opacity: 0, scale: 1.3 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.85 }}
      className="text-pixel pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 whitespace-nowrap text-[13px]"
      style={{ color, textShadow: "2px 2px 0 #000" }}
    >
      {text}
    </motion.div>
  );
}

function PileChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex flex-col items-center px-1 py-[1px]"
      style={{ background: "#07060c", border: `2px solid ${color}` }}
    >
      <span className="text-pixel text-[5.5px]" style={{ color }}>
        {label}
      </span>
      <span
        className="text-[13px] leading-[12px] text-foreground"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        {value}
      </span>
    </div>
  );
}
