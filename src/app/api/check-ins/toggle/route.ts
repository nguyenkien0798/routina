import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";
import { toggleCheckInForUser } from "@/server/user-data";

const schema = z.object({
  habitId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    const result = await toggleCheckInForUser(user.id, body.habitId, body.date);
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
