import { credentialsSchema } from "@/server/auth-schema";
import {
  hashPassword,
  setSessionCookie,
} from "@/server/auth";
import { prisma } from "@/server/db";
import { handleRouteError, jsonError, jsonOk } from "@/server/http";
import { ensureSettings, replaceUserData } from "@/server/user-data";
import { exportPayloadSchema } from "@/features/habits/schemas/habit.schema";

const registerSchema = credentialsSchema.extend({
  importPayload: exportPayloadSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const body = registerSchema.parse(await request.json());
    const username = body.username.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return jsonError("That username is already taken.", 409);
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    await ensureSettings(user.id);

    if (body.importPayload) {
      await replaceUserData(user.id, {
        habits: body.importPayload.habits,
        checkIns: body.importPayload.checkIns,
        tasks: body.importPayload.tasks ?? [],
        settings: {
          ...body.importPayload.settings,
          browserNotifications:
            body.importPayload.settings.browserNotifications ?? false,
        },
      });
    }

    await setSessionCookie({ id: user.id, username: user.username });
    return jsonOk({ user: { id: user.id, username: user.username } }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
