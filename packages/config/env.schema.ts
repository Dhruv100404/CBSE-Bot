import { z } from "zod";

export const webEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url()
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function getWebEnv(env: Record<string, string | undefined>): WebEnv {
  return webEnvSchema.parse(env);
}
