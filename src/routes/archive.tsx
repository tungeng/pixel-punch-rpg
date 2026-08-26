import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useGame } from "@/game/store";
import { MenuShell, MeterBar, Readout, SectionTitle } from "@/components/game/MenuShell";
import { RelicCodexScreen } from "@/components/game/RelicCodexScreen";
import { MUTATORS } from "@/game/mutators";
import { BOSSES, ACT_BOSSES } from "@/game/enemies";
import { ALL_RELIC_IDS } from "@/game/relics";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "Archive — Overtung" },
      {
        name: "description",
        content:
          "The Overtung archive: relic codex, act bosses and every Breach Protocol that can warp a run.",
      },
      { property: "og:title", content: "Archive — Overtung" },
      {
        property: "og:description",
        content: "Relics, bosses and Breach Protocols, all in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Archive,
});

type Tab = "relics" | "bosses" | "protocols";

const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: "relics", label: "RELICS", glyph: "◈" },
  { id: "bosses", label: "BOSSES", glyph: "☠" },
  { id: "protocols", label: "PROTOCOLS", glyph: "⚠" },
];

const ACCENT = "var(--corrupt)";

function Archive() {
  const meta = useGame((s) => s.meta);
  const [tab, setTab] = useState<Tab>("relics");
  const decoded = meta.unlockedRelics?.length ?? 0;
  const total = ALL_RELIC_IDS.length;
  const pct = total > 0 ? Math.round((decoded / total) * 100) : 0;

  return (
    <MenuShell
      title="ARCHIVE"
      glyph="✦"
      accent={ACCENT}
      crumb="Everything the fracture has coughed up so far"
      aside={<Readout icon="⬢" value={meta.credits} />}
    >
      {/* --- collection progress --- */}
      <div className="panel-ticks border-2 border-accent/50 bg-card/70 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-pixel text-[8px] tracking-[0.18em] text-accent">DECODED</span>
          <span className="text-pixel text-[10px] text-foreground">
            {decoded}
            <span className="text-muted-foreground">/{total}</span>
          </span>
        </div>
        <div className="mt-2">
          <MeterBar pct={pct} color={ACCENT} height={9} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`press text-pixel relative flex flex-col items-center gap-1 border-2 px-1 py-2 text-[7px] ${
                on
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground/70 hover:border-accent/60"
              }`}
            >
              <span className="text-[12px]" aria-hidden>
                {t.glyph}
              </span>
              {t.label}
              {on && (
                <motion.span
                  layoutId="archive-tab"
                  className="absolute -bottom-1.5 h-1 w-8 bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-5"
        >
          {tab === "relics" && <RelicCodexScreen embedded />}
          {tab === "bosses" && <BossList />}
          {tab === "protocols" && <ProtocolList />}
        </motion.div>
      </AnimatePresence>
    </MenuShell>
  );
}

function BossList() {
  const meta = useGame((s) => s.meta);
  const seen = meta.bestFloor;
  return (
    <div className="flex flex-col gap-2">
      <SectionTitle>Act wardens</SectionTitle>
      <p
        className="-mt-1 text-[13px] text-muted-foreground"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        One boss guards the exit of every act. Reach them to unlock their file.
      </p>
      {ACT_BOSSES.map((id, i) => {
        const boss = BOSSES[id]!;
        const known = seen >= i * 8;
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            className="tile-lift flex items-start gap-3 border-2 border-border bg-card p-2.5"
          >
            <img
              src={boss.asset}
              alt={boss.name}
              width={64}
              height={64}
              decoding="async"
              className="pixelated h-14 w-14 shrink-0 object-contain"
              style={{ filter: known ? "none" : "grayscale(1) brightness(0.35)" }}
            />
            <div className="min-w-0">
              <div className="text-pixel text-[8px] text-destructive">
                ACT {i + 1} · {known ? boss.name.toUpperCase() : "??? UNSEEN"}
              </div>
              <div
                className="mt-1.5 space-y-1 text-[13px] leading-[15px] text-foreground/80"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                {known ? (
                  <>
                    <div>
                      {boss.hp[1]} HP · {boss.mechanicName ?? "no special mechanic"}
                    </div>
                    {boss.introLine && (
                      <div className="text-muted-foreground">“{boss.introLine}”</div>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground">Encrypted. Push deeper to decode.</div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function ProtocolList() {
  return (
    <div className="flex flex-col gap-2">
      <SectionTitle>Breach protocols</SectionTitle>
      <p
        className="-mt-1 text-[13px] text-muted-foreground"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        Every run rolls one Breach Protocol. It bends a global rule and charges you for it.
      </p>
      {Object.values(MUTATORS).map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.2 }}
          className="tile-lift border-2 p-2.5"
          style={{ borderColor: m.color, background: "#0b0a12" }}
        >
          <div className="text-pixel text-[8px]" style={{ color: m.color }}>
            {m.name}
          </div>
          <p
            className="mt-1.5 text-[13px] leading-[15px] text-foreground/80"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            {m.text}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
