import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { signOutAccount, useAccount } from "@/game/account";
import { cloudStatus, subscribeCloudStatus } from "@/game/cloud";
import { useGame } from "@/game/store";
import { MenuShell, SectionTitle } from "@/components/game/MenuShell";
import { PixelButton } from "@/components/game/PixelButton";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Overtung" },
      {
        name: "description",
        content:
          "Set your leaderboard display name, check for updates and manage your Overtung save data.",
      },
      { property: "og:title", content: "Settings — Overtung" },
      { property: "og:description", content: "Display name, updates and save data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const meta = useGame((s) => s.meta);
  const setPlayerName = useGame((s) => s.setPlayerName);
  const [name, setName] = useState(meta.playerName ?? "");
  const [saved, setSaved] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  function save() {
    const clean = name.trim().slice(0, 16);
    if (!clean) return;
    setPlayerName(clean);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  function wipe() {
    try {
      window.localStorage.removeItem("overtung_meta_v1");
      window.localStorage.removeItem("chronobreak_meta_v1");
    } catch {
      /* ignore */
    }
    window.location.href = "/";
  }

  return (
    <MenuShell
      title="SETTINGS"
      glyph="⚙"
      accent="var(--muted-foreground)"
      crumb="Identity, updates and save data"
    >
      <AccountPanel />

      <SectionTitle>Display name</SectionTitle>
      <p
        className="mb-2 text-[13px] text-muted-foreground"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      >
        Shown on the global leaderboard. Up to 16 characters.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={16}
        placeholder="Agent-0000"
        className="w-full border-2 border-border bg-card px-2 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
        style={{ fontFamily: "var(--font-pixel-body)" }}
      />
      <PixelButton onClick={save} color="secondary" className="press mt-2 w-full">
        {saved ? "✓ SAVED" : "SAVE NAME"}
      </PixelButton>

      <SectionTitle>Updates</SectionTitle>
      <PixelButton
        onClick={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
        color="secondary"
        className="press w-full"
      >
        ⟳ CHECK FOR UPDATES
      </PixelButton>

      <SectionTitle>Save data</SectionTitle>
      <div className="panel-ticks border-2 border-destructive/60 bg-destructive/10 p-3">
        <p
          className="text-[13px] leading-[15px] text-foreground/85"
          style={{ fontFamily: "var(--font-pixel-body)" }}
        >
          Wiping erases Chrono Cores, unlocked heroes, relic decodes, upgrades and every statistic.
          This cannot be undone.
        </p>
        <PixelButton
          onClick={() => (confirmWipe ? wipe() : setConfirmWipe(true))}
          color="danger"
          className="press mt-3 w-full"
        >
          {confirmWipe ? "TAP AGAIN TO WIPE EVERYTHING" : "WIPE SAVE DATA"}
        </PixelButton>
      </div>
    </MenuShell>
  );
}
