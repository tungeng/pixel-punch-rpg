import { Link } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { useAccount } from "@/game/account";
import { arcadeAccount, cloudStatus, subscribeCloudStatus } from "@/game/cloud";

const LABEL: Record<string, string> = {
  guest: "GUEST",
  syncing: "SYNCING",
  synced: "SYNCED",
  offline: "OFFLINE",
  error: "RETRYING",
};

const DOT: Record<string, string> = {
  guest: "var(--muted-foreground)",
  syncing: "var(--gold)",
  synced: "var(--stable)",
  offline: "var(--muted-foreground)",
  error: "var(--destructive)",
};

/** Small identity readout: who you are and whether the cloud has your save. */
export function AccountBadge() {
  const account = useAccount();
  const status = useSyncExternalStore(
    subscribeCloudStatus,
    cloudStatus,
    () => "guest" as ReturnType<typeof cloudStatus>,
  );
  const arcade = useSyncExternalStore(
    subscribeCloudStatus,
    arcadeAccount,
    () => null as ReturnType<typeof arcadeAccount>,
  );
  const signedIn = Boolean(arcade) || Boolean(account.userId);
  const state = signedIn ? status : "guest";
  const name = arcade?.username ?? account.username ?? "AGENT";

  const body = (
    <>
      <span
        aria-hidden
        className="inline-block h-[6px] w-[6px]"
        style={{ background: DOT[state] }}
      />
      <span className="max-w-[74px] truncate">
        {signedIn ? name.toUpperCase() : "SIGN IN"}
      </span>
      {signedIn && <span className="text-foreground/50">{LABEL[state]}</span>}
    </>
  );

  const className =
    "press text-pixel flex min-h-[36px] items-center gap-1.5 border-2 border-border bg-card px-2 text-[7px] text-muted-foreground hover:border-primary/60 hover:text-foreground";

  // inside the arcade the hub owns the account, so there is nothing to link to
  if (arcade) {
    return (
      <span aria-label={`Signed in as ${name} via the arcade`} className={className}>
        {body}
      </span>
    );
  }

  return (
    <Link
      to={signedIn ? "/settings" : "/auth"}
      aria-label={signedIn ? "Account and cloud save" : "Sign in for cloud saves"}
      className={className}
    >
      {body}
    </Link>
  );
}
