import { createFileRoute } from "@tanstack/react-router";
import { MenuShell, SectionTitle } from "@/components/game/MenuShell";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "Credits — Overtung" },
      {
        name: "description",
        content: "Who built Overtung: design, pixel art, systems and the tools behind the fracture.",
      },
      { property: "og:title", content: "Credits — Overtung" },
      { property: "og:description", content: "The people and tools behind Overtung." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Credits,
});

const LINES: { role: string; body: string }[] = [
  { role: "Design & Systems", body: "Deck combat, four acts, Breach Protocols and the meta layer." },
  { role: "Pixel Art", body: "Hero sprites, enemy roster, boss portraits and every card icon." },
  { role: "Writing", body: "Hero voices, boss taunts and run recaps." },
  { role: "Balance", body: "Tuned across 100,000+ simulated runs before release." },
  { role: "Built With", body: "React, TanStack Start, Zustand and Motion. Fonts: Press Start 2P and VT323." },
  { role: "Inspired By", body: "Overwatch heroes and the deckbuilding roguelikes that came before." },
];

function Credits() {
  return (
    <MenuShell title="CREDITS" crumb="Everyone who put the timeline back together">
      <SectionTitle>Overtung</SectionTitle>
      {LINES.map((l) => (
        <div key={l.role} className="mb-2 border-2 border-border bg-card px-3 py-2.5">
          <div className="text-pixel text-[8px] text-primary">{l.role.toUpperCase()}</div>
          <p
            className="mt-1 text-[14px] leading-[16px] text-foreground/80"
            style={{ fontFamily: "var(--font-pixel-body)" }}
          >
            {l.body}
          </p>
        </div>
      ))}
      <p
        className="mt-4 text-center text-[13px] text-muted-foreground"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        TUNG. TUNG. TUNG.
      </p>
    </MenuShell>
  );
}
