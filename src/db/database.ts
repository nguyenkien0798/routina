import Dexie, { type Table } from "dexie";
import { DATABASE_NAME } from "@/lib/constants";
import type {
  AppSettings,
  AuthSession,
  CheckIn,
  Habit,
  LocalUser,
  NotificationDayState,
  Task,
} from "@/types";

export type StoredHabit = Habit & { userId: string };
export type StoredCheckIn = CheckIn & { userId: string };
export type StoredTask = Task & { userId: string };
export type StoredSettings = Omit<AppSettings, "id"> & { id: string };

export class RoutinaDB extends Dexie {
  users!: Table<LocalUser, string>;
  session!: Table<AuthSession, string>;
  habits!: Table<StoredHabit, string>;
  checkIns!: Table<StoredCheckIn, string>;
  tasks!: Table<StoredTask, string>;
  settings!: Table<StoredSettings, string>;
  notificationDays!: Table<NotificationDayState, string>;

  constructor() {
    super(DATABASE_NAME);
    this.version(1).stores({
      habits: "id, name, category, archived, createdAt, sortOrder",
      checkIns: "id, habitId, date, [habitId+date]",
      settings: "id",
    });
    this.version(2).stores({
      habits: "id, name, category, archived, createdAt, sortOrder",
      checkIns: "id, habitId, date, [habitId+date]",
      tasks: "id, status, dueDate, startDate, createdAt",
      settings: "id",
    });
    this.version(3).stores({
      users: "id, username",
      session: "id",
      habits: "id, userId, name, category, archived, createdAt, sortOrder",
      checkIns: "id, userId, habitId, date, [habitId+date], [userId+habitId+date]",
      tasks: "id, userId, status, dueDate, startDate, createdAt",
      settings: "id",
    });
    this.version(4).stores({
      users: "id, username",
      session: "id",
      habits: "id, userId, name, category, archived, createdAt, sortOrder",
      checkIns: "id, userId, habitId, date, [habitId+date], [userId+habitId+date]",
      tasks: "id, userId, status, dueDate, startDate, createdAt",
      settings: "id",
      notificationDays: "id, userId, date, [userId+date]",
    });
  }
}

let dbInstance: RoutinaDB | null = null;

export function getDb(): RoutinaDB {
  if (typeof window === "undefined") {
    throw new Error("Routina database is only available in the browser.");
  }
  if (!dbInstance) {
    dbInstance = new RoutinaDB();
  }
  return dbInstance;
}
