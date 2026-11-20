import { requireUser } from "@/server/auth";
import { handleRouteError, jsonError, jsonOk } from "@/server/http";
import { createHabitForUser, loadUserBundle } from "@/server/user-data";
import { prisma } from "@/server/db";
import { createId } from "@/lib/id";
import { todayString } from "@/lib/dates";
import { buildDemoCheckIns, DEMO_HABITS, demoStartDate } from "@/db/seed";

export async function POST() {
  try {
    const user = await requireUser();
    const count = await prisma.habit.count({ where: { userId: user.id } });
    if (count > 0) {
      return jsonError("Demo data is only available on an empty workspace.", 400);
    }

    const today = todayString();
    const startDate = demoStartDate(today);

    for (const [index, seed] of DEMO_HABITS.entries()) {
      const habit = await createHabitForUser(
        user.id,
        { ...seed, startDate },
        index,
      );
      const records = buildDemoCheckIns(habit.id, seed, today).map((record) => ({
        ...record,
        id: createId(),
        userId: user.id,
      }));
      if (records.length > 0) {
        await prisma.checkIn.createMany({ data: records });
      }
    }

    const data = await loadUserBundle(user.id);
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
