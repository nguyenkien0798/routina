import { z } from "zod";

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be under 32 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only use letters, numbers, and underscores",
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be under 72 characters"),
});
