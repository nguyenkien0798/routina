import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";
import { deleteTaskForUser, updateTaskForUser } from "@/server/user-data";

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    notes: z.string().max(500).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dueTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    status: z.enum(["open", "done"]).optional(),
    priority: z.enum(["none", "low", "medium", "high"]).optional(),
    completedAt: z.string().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No changes provided.",
  });

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    const task = await updateTaskForUser(user.id, id, body);
    return jsonOk({ task });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteTaskForUser(user.id, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
