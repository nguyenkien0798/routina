import { createId } from "@/lib/id";
import { prisma } from "@/server/db";
import {
  defaultSettingsRow,
  fromHabit,
  fromTask,
  toCheckIn,
  toHabit,
  toSettings,
  toTask,
} from "@/server/mappers";
import type {
  AppSettings,
  CheckIn,
  CreateHabitInput,
  CreateTaskInput,
  ExportPayload,
  Habit,
  Task,
  UpdateHabitInput,
  UpdateTaskInput,
} from "@/types";

export async function ensureSettings(userId: string): Promise<AppSettings> {
  const existing = await prisma.settings.findUnique({ where: { userId } });
  if (existing) return toSettings(existing);
  const created = await prisma.settings.create({
    data: defaultSettingsRow(userId),
  });
  return toSettings(created);
}

export async function loadUserBundle(userId: string) {
  const [habits, checkIns, tasks, settings] = await Promise.all([
    prisma.habit.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.checkIn.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId } }),
    ensureSettings(userId),
  ]);

  return {
    habits: habits.map(toHabit),
    checkIns: checkIns.map(toCheckIn),
    tasks: tasks.map(toTask).sort((a, b) => {
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      const aDue = `${a.dueDate}T${a.dueTime}`;
      const bDue = `${b.dueDate}T${b.dueTime}`;
      if (aDue !== bDue) return aDue.localeCompare(bDue);
      return b.createdAt.localeCompare(a.createdAt);
    }),
    settings,
  };
}

export async function createHabitForUser(
  userId: string,
  input: CreateHabitInput,
  sortOrder: number,
): Promise<Habit> {
  const now = new Date().toISOString();
  const habit: Habit = {
    id: createId(),
    name: input.name.trim(),
    description: input.description.trim(),
    icon: input.icon,
    color: input.color,
    category: input.category,
    frequency: input.frequency,
    startDate: input.startDate,
    target: input.target,
    archived: false,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
  const row = await prisma.habit.create({
    data: { ...fromHabit(habit), userId },
  });
  return toHabit(row);
}

export async function updateHabitForUser(
  userId: string,
  id: string,
  patch: UpdateHabitInput,
): Promise<Habit> {
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Habit not found.");
  const current = toHabit(existing);
  const next: Habit = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const row = await prisma.habit.update({
    where: { id },
    data: fromHabit(next),
  });
  return toHabit(row);
}

export async function deleteHabitForUser(userId: string, id: string) {
  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Habit not found.");
  await prisma.habit.delete({ where: { id } });
}

export async function reorderHabitsForUser(
  userId: string,
  orderedIds: string[],
) {
  const now = new Date().toISOString();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.habit.updateMany({
        where: { id, userId },
        data: { sortOrder: index, updatedAt: now },
      }),
    ),
  );
}

export async function toggleCheckInForUser(
  userId: string,
  habitId: string,
  date: string,
): Promise<{ checkIns: CheckIn[] }> {
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) throw new Error("Habit not found.");

  const existing = await prisma.checkIn.findUnique({
    where: {
      userId_habitId_date: { userId, habitId, date },
    },
  });

  if (existing?.completed) {
    await prisma.checkIn.delete({ where: { id: existing.id } });
  } else {
    const now = new Date().toISOString();
    await prisma.checkIn.upsert({
      where: {
        userId_habitId_date: { userId, habitId, date },
      },
      create: {
        id: createId(),
        userId,
        habitId,
        date,
        completed: true,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        completed: true,
        updatedAt: now,
      },
    });
  }

  const checkIns = await prisma.checkIn.findMany({ where: { userId } });
  return { checkIns: checkIns.map(toCheckIn) };
}

export async function createTaskForUser(
  userId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = {
    id: createId(),
    title: input.title.trim(),
    notes: input.notes.trim(),
    startDate: input.startDate,
    startTime: input.startTime,
    dueDate: input.dueDate,
    dueTime: input.dueTime,
    status: "open",
    priority: input.priority,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const row = await prisma.task.create({
    data: { ...fromTask(task), userId },
  });
  return toTask(row);
}

export async function updateTaskForUser(
  userId: string,
  id: string,
  patch: UpdateTaskInput,
): Promise<Task> {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Task not found.");
  const current = toTask(existing);
  const next: Task = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const row = await prisma.task.update({
    where: { id },
    data: fromTask(next),
  });
  return toTask(row);
}

export async function deleteTaskForUser(userId: string, id: string) {
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Task not found.");
  await prisma.task.delete({ where: { id } });
}

export async function updateSettingsForUser(
  userId: string,
  patch: Partial<
    Pick<
      AppSettings,
      "theme" | "weekStartsOn" | "browserNotifications" | "locale"
    >
  >,
): Promise<AppSettings> {
  await ensureSettings(userId);
  const row = await prisma.settings.update({
    where: { userId },
    data: {
      ...patch,
      updatedAt: new Date().toISOString(),
    },
  });
  return toSettings(row);
}

export async function replaceUserData(
  userId: string,
  payload: Pick<ExportPayload, "habits" | "checkIns" | "tasks" | "settings">,
) {
  await prisma.$transaction(async (tx) => {
    await tx.checkIn.deleteMany({ where: { userId } });
    await tx.habit.deleteMany({ where: { userId } });
    await tx.task.deleteMany({ where: { userId } });
    await tx.settings.deleteMany({ where: { userId } });

    if (payload.habits.length > 0) {
      await tx.habit.createMany({
        data: payload.habits.map((habit) => ({
          ...fromHabit(habit),
          userId,
        })),
      });
    }
    if (payload.checkIns.length > 0) {
      await tx.checkIn.createMany({
        data: payload.checkIns.map((checkIn) => ({
          id: checkIn.id,
          userId,
          habitId: checkIn.habitId,
          date: checkIn.date,
          completed: checkIn.completed,
          createdAt: checkIn.createdAt,
          updatedAt: checkIn.updatedAt,
        })),
      });
    }
    if (payload.tasks.length > 0) {
      await tx.task.createMany({
        data: payload.tasks.map((task) => ({
          ...fromTask(task),
          userId,
        })),
      });
    }

    const settings = payload.settings;
    await tx.settings.create({
      data: {
        userId,
        theme: settings.theme,
        weekStartsOn: settings.weekStartsOn,
        browserNotifications: settings.browserNotifications ?? false,
        locale: settings.locale ?? "en",
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
    });
  });

  return loadUserBundle(userId);
}

export async function clearUserData(userId: string) {
  await prisma.$transaction([
    prisma.checkIn.deleteMany({ where: { userId } }),
    prisma.habit.deleteMany({ where: { userId } }),
    prisma.task.deleteMany({ where: { userId } }),
  ]);
  await ensureSettings(userId);
  return loadUserBundle(userId);
}
