import { z } from "zod";
import { frequencyEntitySchema } from "@/features/habits/schemas/habit.schema";
import { requireUser } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";
import { createHabitForUser, loadUserBundle } from "@/server/user-data";
import { prisma } from "@/server/db";

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(280),
  icon: z.string().min(1),
  color: z.string().min(1),
  category: z.string().min(1),
  frequency: frequencyEntitySchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  target: z
    .object({
      value: z.number().positive(),
      unit: z.string().min(1).max(24),
    })
    .nullable(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const data = await loadUserBundle(user.id);
    return jsonOk({ habits: data.habits, checkIns: data.checkIns });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await request.json());
    const max = await prisma.habit.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    });
    const habit = await createHabitForUser(
      user.id,
      body,
      (max._max.sortOrder ?? -1) + 1,
    );
    return jsonOk({ habit }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
