import { useGame } from "@/game/store";
import { HEROES } from "@/game/heroes";
import { AnimatePresence, motion } from "motion/react";
import { CardView } from "./CardView";
import { Bar } from "./Bar";
import { PixelButton } from "./PixelButton";
import { useEffect } from "react";

const INTENT_ICON: Record<string, string> = {
  attack: "🗡",
  block: "🛡",
  buff: "▲",
  debuff: "☠",
  attack_block: "🗡🛡",
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

  useEffect(() => {
    const t = setInterval(pruneFloats, 400);
    return () => clearInterval(t);
  }, [pruneFloats]);

  if (!combat) return null;
  const hero = HEROES[heroId]!;
  const targeting = !!combat.targetingCardUid;

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ backgroundImage: `url(${combat.bg})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 scanlines bg-black/45" />
      {/* enemies */}
      <div className="relative z-10 flex items-start justify-center gap-3 px-3 pt-3">
        {combat.enemies.map((e) => (
          <EnemyView key={e.uid} enemyUid={e.uid} targeting={targeting} onSelect={selectTarget} />
        ))}
      </div>

      {/* log */}
      <div className="relative z-10 mt-1 h-12 overflow-y-auto px-4 text-[13px] text-foreground/70" style={{ fontFamily: "var(--font-pixel-body)" }}>
        {combat.log.slice(-3).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>

      {/* player */}
      <div className="relative z-10 flex items-end justify-center gap-3 px-3 pt-2">
        <div className="relative">
          <img src={hero.asset} alt={hero.name} className="pixelated h-28 w-28 object-contain" />
          <AnimatePresence>
            {combat.floats
              .filter((f) => f.target === "player")
              .slice(-4)
              .map((f) => (
                <FloatText key={f.id} text={f.text} kind={f.kind} />
              ))}
          </AnimatePresence>
          <div className="absolute -left-1 top-0 flex flex-col gap-1">
            {combat.block > 0 && <Badge text={`🛡${combat.block}`} color="#38bdf8" />}
            {combat.strength > 0 && <Badge text={`▲${combat.strength}`} color="#e85d3a" />}
            {combat.vulnerable > 0 && <Badge text={`Vuln${combat.vulnerable}`} color="#f59e0b" />}
            {combat.weak > 0 && <Badge text={`Weak${combat.weak}`} color="#a78bfa" />}
          </div>
        </div>
      </div>

      {/* ult bar + end turn */}
      <div className="relative z-10 flex items-center gap-2 px-3 pt-1">
        <div className="flex-1">
          <Bar value={combat.ultCharge} max={100} color="linear-gradient(90deg,#a855f7,#ec4899)" label={`ULT ${combat.ultCharge}`} height={14} />
        </div>
        <PixelButton
          onClick={() => useUlt()}
          disabled={combat.ultCharge < 100}
          color="danger"
          className="px-3 py-2"
        >
          ULT
        </PixelButton>
        <PixelButton onClick={endTurn} color="secondary" className="px-3 py-2">
          END
        </PixelButton>
      </div>

      {/* hand */}
      <div className="relative z-10 mt-2 flex min-h-[150px] items-end justify-center gap-1.5 overflow-x-auto px-2 pb-2">
        <AnimatePresence mode="popLayout">
          {combat.hand.map((card) => {
            const dimmed = card.cost > combat!.energy;
            return (
              <CardView
                key={card.uid}
                card={card}
                dimmed={dimmed}
                onClick={() => playCard(card.uid)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {targeting && (
        <div className="absolute inset-x-0 bottom-40 z-20 flex justify-center">
          <PixelButton onClick={cancelTarget} color="ghost">Cancel target</PixelButton>
        </div>
      )}
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
  if (!enemy) return null;
  return (
    <motion.button
      layout
      onClick={targeting ? () => onSelect(enemyUid) : undefined}
      animate={enemy.isDead ? { opacity: 0, scale: 0.4, rotate: 20 } : { opacity: 1, scale: 1 }}
      className={`relative flex flex-col items-center ${targeting ? "cursor-crosshair" : ""}`}
      style={{ filter: enemy.isDead ? "grayscale(1)" : "none" }}
    >
      {/* intent */}
      {!enemy.isDead && (
        <div className="mb-1 flex flex-col items-center">
          <div
            className="text-pixel rounded-[3px] px-1.5 py-0.5 text-[9px] text-black"
            style={{ background: intentColor(enemy.intent.type) }}
          >
            {INTENT_ICON[enemy.intent.type]}
          </div>
          <div className="text-[12px] text-foreground/80" style={{ fontFamily: "var(--font-pixel-body)" }}>
            {enemy.intent.text}
          </div>
        </div>
      )}
      <img src={enemy.asset} alt={enemy.name} className="pixelated h-24 w-24 object-contain" />
      <div className="mt-1 w-24">
        <Bar value={enemy.hp} max={enemy.maxHp} color="#e85d3a" height={10} />
      </div>
      <div className="text-pixel text-[7px] text-foreground/70">
        {enemy.hp}/{enemy.maxHp}
      </div>
      <div className="absolute -left-1 top-6 flex flex-col gap-1">
        {enemy.block > 0 && <Badge text={`🛡${enemy.block}`} color="#38bdf8" />}
        {enemy.strength > 0 && <Badge text={`▲${enemy.strength}`} color="#e85d3a" />}
        {enemy.vulnerable > 0 && <Badge text={`V${enemy.vulnerable}`} color="#f59e0b" />}
        {enemy.weak > 0 && <Badge text={`W${enemy.weak}`} color="#a78bfa" />}
      </div>
      <AnimatePresence>
        {useGame.getState().combat?.floats.filter((f) => f.target === enemyUid).slice(-4).map((f) => (
          <FloatText key={f.id} text={f.text} kind={f.kind} />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}

function intentColor(type: string) {
  return type === "attack" ? "#ef4444" : type === "block" ? "#38bdf8" : type === "buff" ? "#22c55e" : type === "debuff" ? "#a855f7" : "#f59e0b";
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="text-pixel rounded-[2px] px-1 text-[7px] text-black" style={{ background: color }}>
      {text}
    </span>
  );
}

function FloatText({ text, kind }: { text: string; kind: string }) {
  const color = kind === "heal" ? "#22c55e" : kind === "block" ? "#38bdf8" : kind === "buff" ? "#fcd34d" : kind === "ult" ? "#a855f7" : "#ef4444";
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.8 }}
      animate={{ y: -34, opacity: 0, scale: 1.1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="text-pixel absolute left-1/2 top-2 -translate-x-1/2 text-[11px]"
      style={{ color, textShadow: "1px 1px 0 #000" }}
    >
      {text}
    </motion.div>
  );
}
