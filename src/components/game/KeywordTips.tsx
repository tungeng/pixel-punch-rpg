import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/game/store";

/**
 * Light tutorial pass: the first time a deckbuilder keyword actually shows up
 * in a fight, explain it once. Stored in localStorage so it never repeats.
 */
const STORE_KEY = "overtung.seenTips.v1";

interface Tip {
  id: string;
  title: string;
  color: string;
  text: string;
}

const TIPS: Tip[] = [
  {
    id: "block",
    title: "BLOCK",
    color: "#54a8ff",
    text: "Block soaks incoming damage before your HP. It wipes at the start of your next turn — spend it, don't hoard it.",
  },
  {
    id: "strength",
    title: "STRENGTH",
    color: "#ff7a45",
    text: "Strength adds its value to EVERY hit of an attack. Multi-hit cards scale hardest with it.",
  },
  {
    id: "vulnerable",
    title: "VULNERABLE",
    color: "#ffcc4d",
    text: "A Vulnerable target takes 50% more damage. Apply it first, then swing with your biggest card.",
  },
  {
    id: "weak",
    title: "WEAK",
    color: "#c47bff",
    text: "A Weak target deals 25% less damage. Great defensive tempo against heavy hitters.",
  },
  {
    id: "poison",
    title: "POISON",
    color: "#54d98c",
    text: "Poison deals its value in damage at end of turn, then drops by 1. It ignores Block entirely.",
  },
  {
    id: "armor",
    title: "ARMOR",
    color: "#38bdf8",
    text: "Armor soaks damage after Block — but it never expires. Reinhardt builds it up all fight long.",
  },
  {
    id: "ult",
    title: "ULTIMATE",
    color: "#ffd54d",
    text: "Your Ultimate charges as you deal and take damage. At 100% you can fire it once per fight.",
  },
  {
    id: "guardian",
    title: "FORMATION: COVER ALLY",
    color: "#ffb020",
    text: "This unit shields its most wounded ally every turn. Kill it, or your damage keeps hitting Block.",
  },
  {
    id: "mender",
    title: "FORMATION: REPAIR FIELD",
    color: "#7cf5c4",
    text: "This unit heals every other enemy each turn. Focus it down first or the fight never ends.",
  },
  {
    id: "conduit",
    title: "FORMATION: DAMPEN FIELD",
    color: "#e879f9",
    text: "While this unit lives, all OTHER enemies take 35% less damage. Break the conduit, then clean up.",
  },
];

function loadSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function KeywordTips() {
  const combat = useGame((s) => s.combat);
  const [seen, setSeen] = useState<string[]>([]);
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    setSeen(loadSeen());
  }, []);

  const markSeen = (id: string) => {
    setSeen((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — in-memory seen still prevents repeats this session */
      }
      return next;
    });
  };

  useEffect(() => {
    if (!combat?.active) return;
    const live = combat.enemies.filter((e) => !e.isDead);
    const hits: string[] = [];
    if (combat.block > 0) hits.push("block");
    if (combat.strength > 0 || live.some((e) => e.strength > 0)) hits.push("strength");
    if (combat.vulnerable > 0 || live.some((e) => e.vulnerable > 0)) hits.push("vulnerable");
    if (combat.weak > 0 || live.some((e) => e.weak > 0)) hits.push("weak");
    if (combat.poison > 0 || live.some((e) => e.poison > 0)) hits.push("poison");
    if (combat.armor > 0) hits.push("armor");
    if (combat.ultCharge >= 100) hits.push("ult");
    for (const e of live) {
      if (e.trait === "guardian" || e.trait === "mender" || e.trait === "conduit") hits.push(e.trait);
    }
    const fresh = hits.filter((h) => !seen.includes(h) && !queue.includes(h));
    if (fresh.length > 0) setQueue((q) => [...q, ...fresh]);
  }, [combat, seen, queue]);

  const currentId = queue[0];
  const tip = TIPS.find((t) => t.id === currentId);

  // A tip is marked seen the moment it renders, and auto-dismisses — so it can
  // only ever appear once, even if the player never interacts with it.
  useEffect(() => {
    if (!tip || !combat?.active) return;
    markSeen(tip.id);
    const timer = window.setTimeout(() => {
      setQueue((q) => (q[0] === tip.id ? q.slice(1) : q));
    }, 4200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, combat?.active]);

  if (!tip || !combat?.active) return null;

  const dismiss = () => {
    setQueue((q) => (q[0] === tip.id ? q.slice(1) : q));
  };

  return (
    <AnimatePresence>
      <motion.button
        key={tip.id}
        type="button"
        onClick={dismiss}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.18 }}
        className="pointer-events-auto absolute bottom-16 left-2 z-[260] max-w-[70%] text-left"
        aria-label={`${tip.title}: ${tip.text}`}
      >
        <div
          className="pix-border bg-card/90 px-2.5 py-1.5"
          style={{ boxShadow: `0 0 0 1px ${tip.color}44, 3px 3px 0 0 #000` }}
        >
          <div
            className="text-[7px] tracking-widest"
            style={{ fontFamily: "var(--font-pixel)", color: tip.color }}
          >
            {tip.title}
          </div>
          <p className="mt-0.5 text-[10px] leading-snug text-foreground/75">{tip.text}</p>
        </div>
      </motion.button>
    </AnimatePresence>
  );
}
