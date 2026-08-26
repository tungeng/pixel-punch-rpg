import { createFileRoute } from "@tanstack/react-router";
import { useGame } from "@/game/store";
import { MenuShell } from "@/components/game/MenuShell";
import { ArchiveScreen } from "@/components/game/ArchiveScreen";

export const Route = createFileRoute("/progression")({
  head: () => ({
    meta: [
      { title: "Progression — Overtung" },
      {
        name: "description",
        content:
          "Spend Chrono Cores on permanent upgrades that carry into every future Overtung run.",
      },
      { property: "og:title", content: "Progression — Overtung" },
      {
        property: "og:description",
        content: "Permanent upgrades bought with Chrono Cores earned from dead runs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Progression,
});

function Progression() {
  const meta = useGame((s) => s.meta);
  return (
    <MenuShell
      title="PROGRESSION"
      crumb="Permanent upgrades. Bought once, kept forever."
      aside={
        <span
          className="text-[13px] text-muted-foreground"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          ⬢ {meta.credits}
        </span>
      }
    >
      <ArchiveScreen embedded />
    </MenuShell>
  );
}
