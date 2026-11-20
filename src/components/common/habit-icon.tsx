import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Bike,
  BookOpen,
  Brain,
  Coffee,
  Droplets,
  Dumbbell,
  FaceSlightlySmiling,
  Flame,
  Footprints,
  GlassWater,
  Headphones,
  Heart,
  Languages,
  Leaf,
  Moon,
  NotebookPen,
  PenLine,
  Salad,
  Sparkles,
  StretchHorizontal,
  Sun,
  Target,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { HabitIconName } from "@/lib/constants";

export const HABIT_ICONS: Record<HabitIconName, LucideIcon> = {
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  languages: Languages,
  droplets: Droplets,
  moon: Moon,
  heart: Heart,
  brain: Brain,
  coffee: Coffee,
  leaf: Leaf,
  sun: Sun,
  "pen-line": PenLine,
  music: Headphones,
  bike: Bike,
  apple: Apple,
  sparkles: Sparkles,
  target: Target,
  timer: Timer,
  footprints: Footprints,
  smile: FaceSlightlySmiling,
  flame: Flame,
  salad: Salad,
  "stretch-horizontal": StretchHorizontal,
  "notebook-pen": NotebookPen,
  "glass-water": GlassWater,
};

export function HabitIcon({
  name,
  className,
  size = 18,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Icon = HABIT_ICONS[name as HabitIconName] ?? Sparkles;
  return <Icon className={cn("shrink-0", className)} size={size} />;
}

export function HabitGlyph({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "sm"
      ? "h-9 w-9 rounded-[12px]"
      : size === "lg"
        ? "h-12 w-12 rounded-2xl"
        : "h-11 w-11 rounded-[14px]";
  const iconSize = size === "sm" ? 15 : size === "lg" ? 20 : 17;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden ring-1 ring-inset ring-black/5 dark:ring-white/10",
        box,
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
        color,
        boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 30% 20%, color-mix(in srgb, ${color} 28%, transparent), transparent 60%)`,
        }}
      />
      <HabitIcon name={name} size={iconSize} className="relative" />
    </span>
  );
}
