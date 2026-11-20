import { z } from "zod";
import { requireUser } from "@/server/auth";
import { handleRouteError, jsonOk } from "@/server/http";
import { ensureSettings, updateSettingsForUser } from "@/server/user-data";

const patchSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    weekStartsOn: z.union([z.literal(0), z.literal(1), z.literal(6)]).optional(),
    browserNotifications: z.boolean().optional(),
    locale: z.enum(["en", "vi"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No changes provided.",
  });

export async function GET() {
  try {
    const user = await requireUser();
    const settings = await ensureSettings(user.id);
    return jsonOk({ settings });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = patchSchema.parse(await request.json());
    const settings = await updateSettingsForUser(user.id, body);
    return jsonOk({ settings });
  } catch (error) {
    return handleRouteError(error);
  }
}
