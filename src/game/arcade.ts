/**
 * Boredom Arcade bridge.
 *
 * When Overtung runs inside the arcade hub the parent frame owns the player's
 * identity and their save blob, so we talk to it over postMessage instead of
 * asking for a login of our own. Every request carries a requestId and the
 * parent answers with the same id. If nobody answers within two seconds, or
 * the player is not signed into the arcade, we simply stay in local mode.
 */

export interface ArcadeUser {
  userId: string;
  username: string;
}

interface ArcadeReply {
  source: "boredom-arcade";
  requestId: string;
  ok: boolean;
  error?: string;
  result?: unknown;
}

const TIMEOUT = 2000;

let nextId = 1;
const pending = new Map<string, (reply: ArcadeReply) => void>();
let listening = false;

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("message", (event: MessageEvent) => {
    const data = event.data as ArcadeReply | null;
    if (!data || typeof data !== "object") return;
    if (data.source !== "boredom-arcade" || typeof data.requestId !== "string") return;
    const resolve = pending.get(data.requestId);
    if (resolve) {
      pending.delete(data.requestId);
      resolve(data);
    }
  });
}

/** One request/response round trip with the hub. Resolves null on timeout. */
function request(type: string, payload?: Record<string, unknown>): Promise<ArcadeReply | null> {
  if (typeof window === "undefined" || window.parent === window) return Promise.resolve(null);
  listen();
  const requestId = `overtung-${nextId++}-${Date.now()}`;
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      pending.delete(requestId);
      resolve(null);
    }, TIMEOUT);
    pending.set(requestId, (reply) => {
      window.clearTimeout(timer);
      resolve(reply);
    });
    window.parent.postMessage({ source: "arcade-game", type, requestId, ...payload }, "*");
  });
}

/** Ask the hub who is playing. Null means: no hub, no answer, or not signed in. */
export async function arcadeWhoAmI(): Promise<ArcadeUser | null> {
  const reply = await request("arcade:whoami");
  if (!reply || !reply.ok) return null;
  const result = reply.result as Partial<ArcadeUser> | undefined;
  if (!result?.userId) return null;
  return { userId: String(result.userId), username: String(result.username ?? "PLAYER") };
}

/** Fetch the saved progress object the hub is holding for this player. */
export async function arcadeLoad(): Promise<Record<string, unknown> | null> {
  const reply = await request("arcade:load");
  if (!reply || !reply.ok) return null;
  const result = reply.result as Record<string, unknown> | null | undefined;
  return result && typeof result === "object" ? result : null;
}

/** Hand the hub a fresh save blob. Returns false when it could not be stored. */
export async function arcadeSave(data: Record<string, unknown>): Promise<boolean> {
  const reply = await request("arcade:save", { data });
  return Boolean(reply?.ok);
}
