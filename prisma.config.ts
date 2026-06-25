// Prisma 7 moves the datasource connection URL out of schema.prisma into this file.
// Load .env.local first (Next.js convention), then .env as a fallback, before reading vars.
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"] });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // process.env (not the throwing env() helper) so `prisma generate` works before keys exist.
    url: process.env.DATABASE_URL ?? "",
  },
});
