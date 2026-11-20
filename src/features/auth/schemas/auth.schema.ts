import { z } from "zod";
import { credentialsSchema } from "@/server/auth-schema";

export const loginFormSchema = credentialsSchema;

export const registerFormSchema = credentialsSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
