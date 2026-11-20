import { credentialsSchema } from "@/server/auth-schema";
import {
  setSessionCookie,
  verifyPassword,
} from "@/server/auth";
import { prisma } from "@/server/db";
import { handleRouteError, jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = credentialsSchema.parse(await request.json());
    const username = body.username.toLowerCase();
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return jsonError("Invalid username or password.", 401);
    }
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return jsonError("Invalid username or password.", 401);
    }
    await setSessionCookie({ id: user.id, username: user.username });
    return jsonOk({ user: { id: user.id, username: user.username } });
  } catch (error) {
    return handleRouteError(error);
  }
}
