import type { Weekday } from "@/types";

export const APP_NAME = "Routina";
export const APP_TAGLINE = "Make every day count.";
export const APP_VERSION = "0.1.0";
export const DATABASE_NAME = "routina_db";
export const SETTINGS_ID = "default" as const;
export const THEME_STORAGE_KEY = "routina-theme";

export const HABIT_CATEGORIES = [
  "Health",
  "Fitness",
  "Learning",
  "Mindfulness",
  "Productivity",
  "Lifestyle",
  "Social",
  "Other",
] as const;

export type HabitCategory = (typeof HABIT_CATEGORIES)[number];

export const HABIT_COLORS = [
  "#43865A",
  "#4A90A4",
  "#5B7CFA",
  "#7C5CBF",
  "#C45C7A",
  "#E07A5F",
  "#E6A23C",
  "#2F6B45",
  "#3D6B8A",
  "#8B6B4A",
] as const;

export const HABIT_ICON_NAMES = [
  "book-open",
  "dumbbell",
  "languages",
  "droplets",
  "moon",
  "heart",
  "brain",
  "coffee",
  "leaf",
  "sun",
  "pen-line",
  "music",
  "bike",
  "apple",
  "sparkles",
  "target",
  "timer",
  "footprints",
  "smile",
  "flame",
  "salad",
  "stretch-horizontal",
  "notebook-pen",
  "glass-water",
] as const;

export type HabitIconName = (typeof HABIT_ICON_NAMES)[number];

export const WEEKDAY_LABELS: Record<Weekday, { short: string; full: string }> = {
  0: { short: "Sun", full: "Sunday" },
  1: { short: "Mon", full: "Monday" },
  2: { short: "Tue", full: "Tuesday" },
  3: { short: "Wed", full: "Wednesday" },
  4: { short: "Thu", full: "Thursday" },
  5: { short: "Fri", full: "Friday" },
  6: { short: "Sat", full: "Saturday" },
};

export const WEEKDAY_ORDER_SUNDAY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAY_ORDER_MONDAY: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_ORDER_SATURDAY: Weekday[] = [6, 0, 1, 2, 3, 4, 5];
