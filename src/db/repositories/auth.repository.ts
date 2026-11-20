import bcrypt from "bcryptjs";
import { getDb } from "@/db/database";
import { setCurrentUserId } from "@/db/session";
import { settingsRepository } from "@/db/repositories/settings.repository";
import { workspaceRepository } from "@/db/repositories/workspace.repository";
import { createId } from "@/lib/id";
import type { AuthUser, ExportPayload, LocalUser } from "@/types";

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

function toAuthUser(user: LocalUser): AuthUser {
  return { id: user.id, username: user.username };
}

export const authRepository = {
  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await getDb().session.get("current");
    if (!session?.userId) return null;
    const user = await getDb().users.get(session.userId);
    return user ? toAuthUser(user) : null;
  },

  async login(username: string, password: string): Promise<AuthUser> {
    const normalized = normalizeUsername(username);
    const user = await getDb()
      .users.where("username")
      .equals(normalized)
      .first();
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new Error("Invalid username or password.");
    }
    await setCurrentUserId(user.id);
    return toAuthUser(user);
  },

  async register(
    username: string,
    password: string,
    importPayload?: ExportPayload,
  ): Promise<AuthUser> {
    const normalized = normalizeUsername(username);
    const existing = await getDb()
      .users.where("username")
      .equals(normalized)
      .first();
    if (existing) {
      throw new Error("That username is already taken on this device.");
    }

    const now = new Date().toISOString();
    const user: LocalUser = {
      id: createId(),
      username: normalized,
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    };

    await getDb().users.add(user);
    await setCurrentUserId(user.id);
    await settingsRepository.ensure(user.id);

    if (importPayload) {
      await workspaceRepository.replace(user.id, importPayload);
    }

    return toAuthUser(user);
  },

  async logout(): Promise<void> {
    await setCurrentUserId(null);
  },
};
