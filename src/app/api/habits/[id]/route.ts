import { z } from "zod";
import { frequencyEntitySchema } from "@/features/habits/schemas/habit.schema";
import { requireUser } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";
import { deleteHabitForUser, updateHabitForUser } from "@/server/user-data";

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().max(280).optional(),
    icon: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    frequency: frequencyEntitySchema.optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    target: z
      .object({
        value: z.number().positive(),
        unit: z.string().min(1).max(24),
      })
      .nullable()
      .optional(),
    archived: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
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
    const habit = await updateHabitForUser(user.id, id, body);
    return jsonOk({ habit });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteHabitForUser(user.id, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
