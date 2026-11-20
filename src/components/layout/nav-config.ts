import {
  CalendarDays,
  ChartLine,
  House,
  ListChecks,
  ListTodo,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", labelKey: "nav.today", icon: House },
  { href: "/habits", labelKey: "nav.habits", icon: ListChecks },
  { href: "/tasks", labelKey: "nav.tasks", icon: ListTodo },
  { href: "/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/insights", labelKey: "nav.insights", icon: ChartLine },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;
