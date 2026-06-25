import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  TRIGGER_SECRET_KEY: z.string().min(1),
  TRIGGER_PROJECT_ID: z.string().min(1),
  TRANSLOADIT_KEY: z.string().min(1),
  TRANSLOADIT_SECRET: z.string().min(1),
  TRANSLOADIT_TEMPLATE_ID: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid/missing server environment variables:\n${z.prettifyError(parsed.error)}`,
    );
  }
  cached = parsed.data;
  return cached;
}
