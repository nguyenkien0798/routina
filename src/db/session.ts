import { getDb } from "@/db/database";
import type { AuthSession } from "@/types";

const SESSION_ID = "current" as const;

export async function getSession(): Promise<AuthSession> {
  const existing = await getDb().session.get(SESSION_ID);
  if (existing) return existing;
  const created: AuthSession = { id: SESSION_ID, userId: null };
  await getDb().session.put(created);
  return created;
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session.userId;
}

export async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("You need to sign in first.");
  }
  return userId;
}

export async function setCurrentUserId(userId: string | null): Promise<void> {
  await getDb().session.put({ id: SESSION_ID, userId });
}
