export type WeekStartsOn = 0 | 1 | 6;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ThemePreference = "light" | "dark" | "system";

export type AppLocale = "en" | "vi";

export type Frequency =
  | { type: "daily" }
  | { type: "weekly_days"; days: Weekday[] }
  | { type: "weekly_target"; timesPerWeek: number };

export interface HabitTarget {
  value: number;
  unit: string;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  frequency: Frequency;
  startDate: string;
  target: HabitTarget | null;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = "open" | "done";
export type TaskPriority = "none" | "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  notes: string;
  startDate: string;
  startTime: string;
  dueDate: string;
  dueTime: string;
  status: TaskStatus;
  priority: TaskPriority;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  notes: string;
  startDate: string;
  startTime: string;
  dueDate: string;
  dueTime: string;
  priority: TaskPriority;
}

export type UpdateTaskInput = Partial<
  Omit<Task, "id" | "createdAt" | "updatedAt">
>;

export interface AppSettings {
  id: "default";
  theme: ThemePreference;
  weekStartsOn: WeekStartsOn;
  browserNotifications: boolean;
  locale: AppLocale;
  createdAt: string;
  updatedAt: string;
}

export interface LocalUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthSession {
  id: "current";
  userId: string | null;
}

/** Per-user, per-day notification UI marks (read + browser-shown). */
export interface NotificationDayState {
  id: string;
  userId: string;
  date: string;
  readIds: string[];
  browserShownIds: string[];
  updatedAt: string;
}

export interface CreateHabitInput {
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  frequency: Frequency;
  startDate: string;
  target: HabitTarget | null;
}

export type UpdateHabitInput = Partial<
  Omit<Habit, "id" | "createdAt" | "updatedAt">
>;

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  habits: Habit[];
  checkIns: CheckIn[];
  tasks: Task[];
  settings: AppSettings;
}

export type LoadStatus = "idle" | "loading" | "ready" | "error";
