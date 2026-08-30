/**
 * Cloud saves for Overtung.
 *
 * Local storage stays the source of truth while you play, so a run keeps
 * working with no connection. Whenever a save changes and the device is
 * online we push it to the player's account; when the connection returns we
 * flush whatever was queued. On login the local guest save is merged into the
 * cloud save so nothing earned offline is thrown away.
 */
import { supabase } from "@/integrations/supabase/client";
import {
  arcadeFlushScore,
  arcadePostScoreFor,
  arcadeLoad,
  arcadeReportScore,
  arcadeSave,
  arcadeWhoAmI,
  type ArcadeUser,
} from "./arcade";
import { useGame, type GameState } from "./store";
import { fetchBestScoresByPlayer } from "./leaderboard";

const META_KEY = "overtung_meta_v1";
const RUN_KEY = "overtung_run_v1";

export type Meta = GameState["meta"];

/** Every run field worth restoring on another device or after a reload. */
const RUN_KEYS = [
  "inRun",
  "seed",
  "seedLabel",
  "heroId",
  "hp",
  "maxHp",
  "gold",
  "deck",
  "relics",
  "map",
  "currentNodeId",
  "act",
  "floorsCleared",
  "actFloors",
  "augments",
  "mutator",
  "startingMutators",
  "runStats",
  "augmentTiers",
  "augmentChoices",
  "contract",
  "contractsCompleted",
  "phase",
  "rewardChoices",
  "startingRelicChoices",
  "rewardGold",
  "pendingRelic",
  "shopCards",
  "shopRelics",
  "combat",
  "lastRun",
  "scoreSubmitted",
] as const;

export type RunSnapshot = Record<string, unknown>;

export function runSnapshot(state: GameState): RunSnapshot | null {
  if (!state.inRun) return null;
  const out: RunSnapshot = {};
  for (const k of RUN_KEYS) out[k] = (state as unknown as Record<string, unknown>)[k];
  return out;
}

function applyRun(snap: RunSnapshot | null) {
  if (!snap || typeof snap !== "object" || !snap["inRun"]) return;
  const patch: Record<string, unknown> = {};
  for (const k of RUN_KEYS) if (k in snap) patch[k] = snap[k];
  useGame.setState(patch as Partial<GameState>);
}

function readLocalRun(): RunSnapshot | null {
  try {
    const raw = window.localStorage.getItem(RUN_KEY);
    return raw ? (JSON.parse(raw) as RunSnapshot) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or private mode, ignore */
  }
}

// ---------------------------------------------------------------- merging

const maxNum = (a: unknown, b: unknown) => Math.max(Number(a ?? 0) || 0, Number(b ?? 0) || 0);
const union = (a: unknown, b: unknown) =>
  Array.from(new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])) as string[];

/** Fold a guest save into a cloud save. Nothing is ever lost, only kept at its best. */
export function mergeMeta(local: Meta, remote: Meta): Meta {
  const ls = local.stats;
  const rs = remote.stats;
  const heroIds = union(Object.keys(ls?.heroes ?? {}), Object.keys(rs?.heroes ?? {}));
  const heroes: Record<string, { runs: number; wins: number; bestScore: number; bestFloor: number }> = {};
  for (const id of heroIds) {
    const a = ls?.heroes?.[id];
    const b = rs?.heroes?.[id];
    heroes[id] = {
      runs: maxNum(a?.runs, b?.runs),
      wins: maxNum(a?.wins, b?.wins),
      bestScore: maxNum(a?.bestScore, b?.bestScore),
      bestFloor: maxNum(a?.bestFloor, b?.bestFloor),
    };
  }

  const upgrades: Record<string, number> = { ...(remote.upgrades ?? {}) };
  for (const [id, tier] of Object.entries(local.upgrades ?? {})) {
    upgrades[id] = maxNum(upgrades[id], tier);
  }

  const fastest = [local.stats?.fastestWinFloors, remote.stats?.fastestWinFloors].filter(
    (v): v is number => typeof v === "number",
  );

  return {
    ...remote,
    unlockedHeroes: union(local.unlockedHeroes, remote.unlockedHeroes),
    unlockedRelics: union(local.unlockedRelics, remote.unlockedRelics),
    bossHeroes: union(local.bossHeroes, remote.bossHeroes),
    credits: maxNum(local.credits, remote.credits),
    bestFloor: maxNum(local.bestFloor, remote.bestFloor),
    totalRuns: maxNum(local.totalRuns, remote.totalRuns),
    upgrades,
    playerName: remote.playerName || local.playerName || "",
    ...(remote.selectedHeroId ?? local.selectedHeroId
      ? { selectedHeroId: (remote.selectedHeroId ?? local.selectedHeroId)! }
      : {}),
    stats: {
      wins: maxNum(ls?.wins, rs?.wins),
      losses: maxNum(ls?.losses, rs?.losses),
      bossKills: maxNum(ls?.bossKills, rs?.bossKills),
      bestScore: maxNum(ls?.bestScore, rs?.bestScore),
      bestHit: maxNum(ls?.bestHit, rs?.bestHit),
      fastestWinFloors: fastest.length ? Math.min(...fastest) : null,
      heroes,
    },
  };
}

/** Deeper run wins: the one that got further is the one worth keeping. */
function betterRun(a: RunSnapshot | null, b: RunSnapshot | null): RunSnapshot | null {
  if (!a?.["inRun"]) return b?.["inRun"] ? b : null;
  if (!b?.["inRun"]) return a;
  const depth = (r: RunSnapshot) => Number(r["act"] ?? 0) * 100 + Number(r["floorsCleared"] ?? 0);
  return depth(b) > depth(a) ? b : a;
}

// ------------------------------------------------------------ sync engine

type Status = "guest" | "syncing" | "synced" | "offline" | "error";

let userId: string | null = null;
let dirty = false;
let timer: number | undefined;
let started = false;
let statusValue: Status = "guest";
const listeners = new Set<() => void>();

/** Set when the game is running inside the Boredom Arcade hub and signed in. */
let arcadeUser: ArcadeUser | null = null;

export function arcadeAccount() {
  return arcadeUser;
}

export function cloudStatus() {
  return statusValue;
}
export function subscribeCloudStatus(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((l) => l());
}
function setStatus(s: Status) {
  if (s === statusValue) return;
  statusValue = s;
  notify();
}

async function push() {
  if (!userId && !arcadeUser) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    setStatus("offline");
    return;
  }
  const state = useGame.getState();
  const meta = state.meta;
  setStatus("syncing");

  if (arcadeUser) {
    const ok = await arcadeSave({
      meta: meta as unknown as Record<string, unknown>,
      run_state: runSnapshot(state) ?? null,
      settings: { playerName: meta.playerName, selectedHeroId: meta.selectedHeroId },
      updated_at: new Date().toISOString(),
    });
    dirty = !ok;
    setStatus(ok ? "synced" : "error");
    return;
  }

  const { error } = await supabase.from("player_saves").upsert(
    {
      user_id: userId!,
      meta: meta as never,
      run_state: (runSnapshot(state) ?? null) as never,
      settings: { playerName: meta.playerName, selectedHeroId: meta.selectedHeroId } as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    dirty = true;
    setStatus("error");
    return;
  }
  dirty = false;
  setStatus("synced");
}

function queuePush() {
  dirty = true;
  if (!userId && !arcadeUser) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void push(), 1200);
}

/**
 * Handshake with the arcade hub. If it answers with a signed in player we take
 * its save as the cloud save and merge the local one into it, exactly like a
 * normal login. Silence or "not-signed-in" leaves the game in local mode.
 */
async function startArcadeSync() {
  const user = await arcadeWhoAmI();
  if (!user) return false;
  arcadeUser = user;
  notify();
  setStatus("syncing");

  const saved = await arcadeLoad();
  const local = useGame.getState().meta;
  const localRun = runSnapshot(useGame.getState()) ?? readLocalRun();
  const remoteMeta = (saved?.["meta"] ?? null) as Meta | null;
  const merged = remoteMeta ? mergeMeta(local, remoteMeta) : local;
  const run = betterRun(localRun, (saved?.["run_state"] ?? null) as RunSnapshot | null);

  writeLocal(META_KEY, merged);
  useGame.setState({ meta: merged });
  if (run) {
    writeLocal(RUN_KEY, run);
    applyRun(run);
  }
  await push();
  void backfillArcadeScores();

  // hub saves are cheap, so keep a steady heartbeat plus a flush on the way out
  window.setInterval(() => {
    if (dirty) void push();
  }, 10_000);
  const flush = () => {
    if (dirty) void push();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
  return true;
}

const BACKFILL_KEY = "overtung_arcade_score_backfill_v1";

/**
 * One time push of every score already logged in our own leaderboard, matched
 * to arcade players by the name they play under, tagged with the version the
 * run was set on. Runs once per device.
 */
async function backfillArcadeScores() {
  try {
    if (window.localStorage.getItem(BACKFILL_KEY)) return;
  } catch {
    return;
  }
  const rows = await fetchBestScoresByPlayer();
  for (const row of rows) {
    arcadePostScoreFor(row.player_name, row.score, row.game_version);
  }
  writeLocal(BACKFILL_KEY, Date.now());
}

/** Pull the cloud save, merge the local guest save into it, then write both back. */
export async function syncOnLogin(uid: string) {
  userId = uid;
  setStatus("syncing");
  const local = useGame.getState().meta;
  const localRun = runSnapshot(useGame.getState()) ?? readLocalRun();

  const { data, error } = await supabase
    .from("player_saves")
    .select("meta, run_state")
    .eq("user_id", uid)
    .maybeSingle();

  if (error) {
    setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
    dirty = true;
    return;
  }

  const remoteMeta = (data?.meta ?? null) as Meta | null;
  const merged = remoteMeta ? mergeMeta(local, remoteMeta) : local;
  const run = betterRun(localRun, (data?.run_state ?? null) as RunSnapshot | null);

  writeLocal(META_KEY, merged);
  useGame.setState({ meta: merged });
  if (run) {
    writeLocal(RUN_KEY, run);
    applyRun(run);
  }
  await push();
}

export function signOutSync() {
  userId = null;
  dirty = false;
  setStatus("guest");
}

/** Wire local persistence + cloud pushes. Safe to call once per app boot. */
export function startCloudSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  // resume an interrupted run from this device, online or not
  const saved = readLocalRun();
  if (saved && !useGame.getState().inRun) applyRun(saved);

  // if the arcade hub owns the player's identity, it owns the save too
  void startArcadeSync();


  let lastMeta = useGame.getState().meta;
  let lastRunKey = JSON.stringify(runSnapshot(useGame.getState()));
  let lastBestScore = Number(useGame.getState().meta?.stats?.bestScore ?? 0) || 0;
  // seed the throttle baseline so a stored best is reported on boot too
  if (lastBestScore > 0) arcadeReportScore(lastBestScore);

  useGame.subscribe((state) => {
    let changed = false;
    if (state.meta !== lastMeta) {
      lastMeta = state.meta;
      changed = true;
      const best = Number(state.meta?.stats?.bestScore ?? 0) || 0;
      if (best > lastBestScore) {
        lastBestScore = best;
        arcadeReportScore(best);
      }
    }
    const snap = runSnapshot(state);
    const key = JSON.stringify(snap);
    if (key !== lastRunKey) {
      lastRunKey = key;
      writeLocal(RUN_KEY, snap);
      changed = true;
    }
    if (changed) queuePush();
  });

  // the hub wants the best score delivered even if the player leaves mid-throttle
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") arcadeFlushScore();
  });
  window.addEventListener("pagehide", arcadeFlushScore);

  window.addEventListener("online", () => {
    if ((userId || arcadeUser) && dirty) void push();
    else if (userId || arcadeUser) setStatus("synced");
  });
  window.addEventListener("offline", () => {
    if (userId || arcadeUser) setStatus("offline");
  });
  window.addEventListener("beforeunload", () => {
    if ((userId || arcadeUser) && dirty) void push();
  });
}
