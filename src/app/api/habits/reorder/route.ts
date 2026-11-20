import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";
import { reorderHabitsForUser } from "@/server/user-data";

const schema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    await reorderHabitsForUser(user.id, body.orderedIds);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
