import { requireUser } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";
import { clearUserData, loadUserBundle, replaceUserData } from "@/server/user-data";
import { exportPayloadSchema } from "@/features/habits/schemas/habit.schema";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await loadUserBundle(user.id);
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = exportPayloadSchema.parse(await request.json());
    const data = await replaceUserData(user.id, {
      habits: body.habits,
      checkIns: body.checkIns,
      tasks: body.tasks ?? [],
      settings: {
        ...body.settings,
        browserNotifications: body.settings.browserNotifications ?? false,
      },
    });
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    const data = await clearUserData(user.id);
    return jsonOk(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
