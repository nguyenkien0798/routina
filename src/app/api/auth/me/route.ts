import { getSessionUser } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    return jsonOk({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
