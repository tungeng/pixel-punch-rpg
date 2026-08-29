import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MenuShell, SectionTitle } from "@/components/game/MenuShell";
import { PixelButton } from "@/components/game/PixelButton";
import {
  signInWithUsername,
  signUpWithUsername,
  useAccount,
  validateUsername,
} from "@/game/account";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Account — Overtung" },
      {
        name: "description",
        content:
          "Create an Overtung account with just a username and password to carry your heroes, cores and runs across devices.",
      },
      { property: "og:title", content: "Account — Overtung" },
      {
        property: "og:description",
        content: "Username and password only. Cloud saves for heroes, cores and runs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthScreen,
});

function AuthScreen() {
  const navigate = useNavigate();
  const account = useAccount();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account.userId) void navigate({ to: "/", replace: true });
  }, [account.userId, navigate]);

  async function submit() {
    setError(null);
    const bad = validateUsername(username);
    if (bad) {
      setError(bad);
      return;
    }
    setBusy(true);
    try {
      if (mode === "up") await signUpWithUsername(username, password);
      else await signInWithUsername(username, password);
      void navigate({ to: "/", replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const body = { fontFamily: "var(--font-pixel-body)" } as const;

  return (
    <MenuShell
      title="ACCOUNT"
      glyph="◈"
      accent="var(--stable)"
      crumb="Cloud saves across every device"
    >
      <div className="mb-3 grid grid-cols-2 gap-2">
        {(
          [
            ["up", "CREATE"],
            ["in", "SIGN IN"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`press text-pixel border-2 px-2 py-2.5 text-[8px] ${
              mode === m
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <SectionTitle>Username</SectionTitle>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        maxLength={16}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="agent_0451"
        className="w-full border-2 border-border bg-card px-2 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
        style={body}
      />

      <SectionTitle>Password</SectionTitle>
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit();
        }}
        placeholder="at least 6 characters"
        className="w-full border-2 border-border bg-card px-2 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary"
        style={body}
      />

      {error && (
        <p className="mt-2 border-2 border-destructive/60 bg-destructive/10 px-2 py-1.5 text-[13px] text-foreground/90" style={body}>
          {error}
        </p>
      )}

      <PixelButton onClick={() => void submit()} color="primary" className="press mt-3 w-full">
        {busy ? "WORKING..." : mode === "up" ? "CREATE ACCOUNT" : "SIGN IN"}
      </PixelButton>

      <p className="mt-3 text-[13px] leading-[16px] text-muted-foreground" style={body}>
        No email needed. Your progress on this device merges into the account the first time you
        sign in, and runs keep working offline. There is no email recovery, so pick a password you
        will remember.
      </p>
    </MenuShell>
  );
}
