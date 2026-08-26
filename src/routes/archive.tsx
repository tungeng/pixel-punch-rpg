import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { useGame } from "@/game/store";
import { MenuShell } from "@/components/game/MenuShell";
import { RelicCodexScreen } from "@/components/game/RelicCodexScreen";
import { MUTATORS } from "@/game/mutators";
import { BOSSES, ACT_BOSSES } from "@/game/enemies";

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

const TABS: { id: Tab; label: string }[] = [
  { id: "relics", label: "RELICS" },
  { id: "bosses", label: "BOSSES" },
  { id: "protocols", label: "PROTOCOLS" },
];

function Archive() {
  const meta = useGame((s) => s.meta);
  const [tab, setTab] = useState<Tab>("relics");

  return (
    <MenuShell
      title="ARCHIVE"
      crumb="Everything the fracture has coughed up so far"
      aside={
        <span
          className="text-[13px] text-muted-foreground"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          ⬢ {meta.credits}
        </span>
      }
    >
      <div className="grid grid-cols-3 gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-pixel border-2 px-1 py-2 text-[7px] transition-colors ${
              tab === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground/70 hover:border-primary/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-4"
      >
        {tab === "relics" && <RelicCodexScreen embedded />}
        {tab === "bosses" && <BossList />}
        {tab === "protocols" && <ProtocolList />}
      </motion.div>
    </MenuShell>
  );
}

function BossList() {
  const meta = useGame((s) => s.meta);
  const seen = meta.bestFloor;
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-[13px] text-muted-foreground"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        One boss guards the exit of every act. Reach them to unlock their file.
      </p>
      {ACT_BOSSES.map((id, i) => {
        const boss = BOSSES[id]!;
        const known = seen >= i * 8;
        return (
          <div key={id} className="flex items-start gap-3 border-2 border-border bg-card p-2">
            <img
              src={boss.asset}
              alt={boss.name}
              width={64}
              height={64}
              decoding="async"
              className="pixelated h-12 w-12 shrink-0 object-contain"
              style={{ filter: known ? "none" : "grayscale(1) brightness(0.35)" }}
            />
            <div className="min-w-0">
              <div className="text-pixel text-[8px] text-destructive">
                ACT {i + 1} · {known ? boss.name.toUpperCase() : "??? UNSEEN"}
              </div>
              <div
                className="mt-1 space-y-0.5 text-[13px] leading-[15px] text-foreground/80"
                style={{ fontFamily: "var(--font-pixel-body)" }}
              >
                {known ? (
                  <>
                    <div>{boss.hp[1]} HP · {boss.mechanicName ?? "no special mechanic"}</div>
                    {boss.introLine && <div className="text-muted-foreground">“{boss.introLine}”</div>}
                  </>
                ) : (
                  <div className="text-muted-foreground">Encrypted. Push deeper to decode.</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProtocolList() {
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-[13px] text-muted-foreground"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        Every run rolls one Breach Protocol. It bends a global rule and charges you for it.
      </p>
      {Object.values(MUTATORS).map((m) => (
        <div key={m.id} className="border-2 p-2" style={{ borderColor: m.color, background: "#0b0a12" }}>
          <div className="text-pixel text-[8px]" style={{ color: m.color }}>
            {m.name}
          </div>
          <p
            className="mt-1 text-[13px] leading-[15px] text-foreground/80"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            {m.text}
          </p>
        </div>
      ))}
    </div>
  );
}
