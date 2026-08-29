/**
 * Username + password accounts.
 *
 * Players never give an email. Each username is folded into a deterministic
 * internal address so the auth backend has something to key on, and the real
 * handle lives in the profiles table. Because that address cannot receive
 * mail, there is no email based password recovery: keep your password.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { syncOnLogin, signOutSync } from "./cloud";

const DOMAIN = "overtung.local";

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (u.length < 3) return "Username needs at least 3 characters.";
  if (u.length > 16) return "Username can be at most 16 characters.";
  if (!/^[a-z0-9_]+$/.test(u)) return "Letters, numbers and underscores only.";
  return null;
}

function emailFor(username: string) {
  return `${normalizeUsername(username)}@${DOMAIN}`;
}

export async function signUpWithUsername(username: string, password: string) {
  const bad = validateUsername(username);
  if (bad) throw new Error(bad);
  if (password.length < 6) throw new Error("Password needs at least 6 characters.");

  const norm = normalizeUsername(username);
  const { data, error } = await supabase.auth.signUp({
    email: emailFor(norm),
    password,
  });
  if (error) {
    throw new Error(
      /already registered|exists/i.test(error.message) ? "That username is taken." : error.message,
    );
  }
  const uid = data.user?.id;
  if (uid) {
    const { error: pErr } = await supabase
      .from("profiles")
      .upsert({ id: uid, username: username.trim().slice(0, 16), username_norm: norm });
    if (pErr && /duplicate|unique/i.test(pErr.message)) throw new Error("That username is taken.");
  }
  return data;
}

export async function signInWithUsername(username: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailFor(username),
    password,
  });
  if (error) throw new Error("Wrong username or password.");
}

export async function signOutAccount() {
  await supabase.auth.signOut();
  signOutSync();
}

export interface Account {
  userId: string | null;
  username: string | null;
  loading: boolean;
}

/** Session-aware account state. Kicks off the cloud merge the first time a user appears. */
export function useAccount(): Account {
  const [account, setAccount] = useState<Account>({ userId: null, username: null, loading: true });

  useEffect(() => {
    let alive = true;
    let syncedFor: string | null = null;

    async function hydrate(uid: string | null) {
      if (!alive) return;
      if (!uid) {
        setAccount({ userId: null, username: null, loading: false });
        return;
      }
      setAccount((a) => ({ ...a, userId: uid, loading: false }));
      if (syncedFor !== uid) {
        syncedFor = uid;
        void syncOnLogin(uid);
      }
      const { data } = await supabase.from("profiles").select("username").eq("id", uid).maybeSingle();
      if (alive) setAccount({ userId: uid, username: data?.username ?? null, loading: false });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrate(session?.user?.id ?? null);
    });
    void supabase.auth.getSession().then(({ data }) => hydrate(data.session?.user?.id ?? null));

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return account;
}
