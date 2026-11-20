import { clearSessionCookie } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";

export async function POST() {
  try {
    await clearSessionCookie();
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
