import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";
import { createTaskForUser, loadUserBundle } from "@/server/user-data";

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  notes: z.string().max(500),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/),
  priority: z.enum(["none", "low", "medium", "high"]),
});

export async function GET() {
  try {
    const user = await requireUser();
    const data = await loadUserBundle(user.id);
    return jsonOk({ tasks: data.tasks });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await request.json());
    const task = await createTaskForUser(user.id, body);
    return jsonOk({ task }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
