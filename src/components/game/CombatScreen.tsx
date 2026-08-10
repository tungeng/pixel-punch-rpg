import { useGame } from "@/game/store";
import { HEROES } from "@/game/heroes";
import { AnimatePresence, motion } from "motion/react";
import { CardView } from "./CardView";
import { Bar } from "./Bar";
import { PixelButton } from "./PixelButton";
import { useEffect, useRef, useState } from "react";

const INTENT_ICON: Record<string, string> = {
  attack: "⚔",
  block: "🛡",
  buff: "▲",
  debuff: "☠",
  attack_block: "⚔🛡",
};

export function CombatScreen() {
  const combat = useGame((s) => s.combat);
  const heroId = useGame((s) => s.heroId);
  const playCard = useGame((s) => s.playCard);
  const selectTarget = useGame((s) => s.selectTarget);
  const cancelTarget = useGame((s) => s.cancelTarget);
  const endTurn = useGame((s) => s.endTurn);
  const useUlt = useGame((s) => s.useUltimate);
  const pruneFloats = useGame((s) => s.pruneFloats);

  const [shake, setShake] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const prevHp = useRef<number | null>(null);
  const prevTurn = useRef<number>(0);

  useEffect(() => {
    const t = setInterval(pruneFloats, 400);
    return () => clearInterval(t);
  }, [pruneFloats]);

  const hp = combat?.hp ?? null;
  useEffect(() => {
    if (hp == null) return;
    if (prevHp.current != null && hp < prevHp.current) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 300);
      prevHp.current = hp;
      return () => clearTimeout(t);
    }
    prevHp.current = hp;
    return;
  }, [hp]);

  const turn = combat?.turn ?? 0;
  useEffect(() => {
    if (turn === 0 || turn === prevTurn.current) return;
    prevTurn.current = turn;
    setBanner(`TURN ${turn}`);
    const t = setTimeout(() => setBanner(null), 900);
    return () => clearTimeout(t);
  }, [turn]);

  if (!combat) return null;
  const hero = HEROES[heroId]!;
  const targeting = !!combat.targetingCardUid;
  const hand = combat.hand;
  const mid = (hand.length - 1) / 2;

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

      {/* arena — enemies centered in the remaining space */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center gap-3 px-3 pt-3">
          {combat.enemies.map((e) => (
            <EnemyView key={e.uid} enemyUid={e.uid} targeting={targeting} onSelect={selectTarget} />
          ))}
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
          <motion.img
            src={hero.asset}
            alt={hero.name}
            className="pixelated idle-bob h-24 w-24 object-contain"
            animate={shake ? { x: [0, -5, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.6))" }}
          />
          <AnimatePresence>
            {combat.floats
              .filter((f) => f.target === "player")
              .slice(-4)
              .map((f) => (
                <FloatText key={f.id} text={f.text} kind={f.kind} />
              ))}
          </AnimatePresence>
          <div className="absolute -right-1 top-0 flex flex-col items-end gap-1">
            {combat.block > 0 && <Badge text={`🛡 ${combat.block}`} color="#54a8ff" />}
            {combat.strength > 0 && <Badge text={`▲ ${combat.strength}`} color="#ff7a45" />}
            {combat.vulnerable > 0 && <Badge text={`VULN ${combat.vulnerable}`} color="#ffcc4d" />}
            {combat.weak > 0 && <Badge text={`WEAK ${combat.weak}`} color="#c47bff" />}
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
          <div
            className="flex gap-2 text-[12px] text-foreground/75"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            <span>🂠 {combat.drawPile.length}</span>
            <span>♻ {combat.discardPile.length}</span>
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
          animate={combat.ultCharge >= 100 ? { scale: [1, 1.07, 1] } : { scale: 1 }}
          transition={{ repeat: combat.ultCharge >= 100 ? Infinity : 0, duration: 1 }}
        >
          <PixelButton
            onClick={() => useUlt()}
            disabled={combat.ultCharge < 100}
            color="danger"
            className="px-3 py-2"
          >
            ULT
          </PixelButton>
        </motion.div>
        <PixelButton onClick={endTurn} color="secondary" className="px-3 py-2">
          END
        </PixelButton>
      </div>

      {/* hand — fanned */}
      <div className="relative z-10 flex shrink-0 items-end justify-center px-2 pb-6 pt-3">
        <AnimatePresence mode="popLayout">
          {hand.map((card, i) => {
            const dimmed = card.cost > combat.energy;
            const offset = i - mid;
            return (
              <motion.div
                key={card.uid}
                layout
                initial={{ y: 90, opacity: 0, rotate: 0 }}
                animate={{
                  y: Math.abs(offset) * 3 - 12,
                  opacity: 1,
                  rotate: offset * 3,
                }}
                exit={{ y: -140, opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                style={{
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: 10 + i,
                  transformOrigin: "bottom center",
                }}
              >
                <CardView card={card} dimmed={dimmed} onClick={() => playCard(card.uid)} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

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

      {/* turn banner */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="text-pixel pointer-events-none absolute left-0 right-0 top-1/3 z-30 bg-primary/85 py-2 text-center text-[14px] text-black"
          >
            {banner}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EnemyView({
  enemyUid,
  targeting,
  onSelect,
}: {
  enemyUid: string;
  targeting: boolean;
  onSelect: (uid: string) => void;
}) {
  const enemy = useGame((s) => s.combat?.enemies.find((e) => e.uid === enemyUid));
  const floats = useGame((s) => s.combat?.floats ?? []);
  const [hit, setHit] = useState(false);
  const prev = useRef<number | null>(null);

  const hp = enemy?.hp ?? null;
  useEffect(() => {
    if (hp == null) return;
    if (prev.current != null && hp < prev.current) {
      setHit(true);
      const t = setTimeout(() => setHit(false), 320);
      prev.current = hp;
      return () => clearTimeout(t);
    }
    prev.current = hp;
    return;
  }, [hp]);

  if (!enemy) return null;

  return (
    <motion.button
      layout
      onClick={targeting ? () => onSelect(enemyUid) : undefined}
      animate={
        enemy.isDead
          ? { opacity: 0, scale: 0.3, rotate: 25, y: 20 }
          : { opacity: 1, scale: targeting ? 1.05 : 1 }
      }
      transition={{ duration: 0.35 }}
      className={`relative flex flex-col items-center ${targeting ? "cursor-crosshair" : ""}`}
    >
      {!enemy.isDead && (
        <motion.div
          key={enemy.intent.text}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-1 flex flex-col items-center"
        >
          <div
            className="text-pixel px-1.5 py-0.5 text-[9px] text-black"
            style={{
              background: intentColor(enemy.intent.type),
              border: "2px solid #07060c",
            }}
          >
            {INTENT_ICON[enemy.intent.type] ?? "?"}
          </div>
          <div
            className="text-[12px] text-foreground/85"
            style={{ fontFamily: "var(--font-pixel-body)", textShadow: "1px 1px 0 #000" }}
          >
            {enemy.intent.text}
          </div>
        </motion.div>
      )}

      <div className={hit ? "hit-shake" : "idle-bob-slow"}>
        <img
          src={enemy.asset}
          alt={enemy.name}
          className="pixelated h-24 w-24 object-contain"
          style={{
            filter: hit
              ? "drop-shadow(0 0 0 #fff) brightness(3)"
              : "drop-shadow(0 5px 0 rgba(0,0,0,0.55))",
            transition: "filter 0.1s",
          }}
        />
      </div>

      {targeting && !enemy.isDead && (
        <div className="text-pixel absolute -top-1 text-[10px] text-destructive">✖</div>
      )}

      <div className="mt-1 w-24">
        <Bar
          value={enemy.hp}
          max={enemy.maxHp}
          color="linear-gradient(90deg,#ff3b3b,#ff7a45)"
          height={10}
          label={`${enemy.hp}/${enemy.maxHp}`}
        />
      </div>
      <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
        {enemy.block > 0 && <Badge text={`🛡${enemy.block}`} color="#54a8ff" />}
        {enemy.strength > 0 && <Badge text={`▲${enemy.strength}`} color="#ff7a45" />}
        {enemy.vulnerable > 0 && <Badge text={`V${enemy.vulnerable}`} color="#ffcc4d" />}
        {enemy.weak > 0 && <Badge text={`W${enemy.weak}`} color="#c47bff" />}
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

function intentColor(type: string) {
  return type === "attack"
    ? "#ff3b3b"
    : type === "block"
      ? "#54a8ff"
      : type === "buff"
        ? "#54d98c"
        : type === "debuff"
          ? "#c47bff"
          : "#ffcc4d";
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
