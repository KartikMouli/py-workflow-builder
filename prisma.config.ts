import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"] });

import { defineConfig } from "prisma/config";

// Migrations need a direct (non-pooled) Neon connection; derive it from DATABASE_URL when
// DIRECT_URL isn't a real URL. The runtime app uses the pooled DATABASE_URL via the pg adapter.
function migrationUrl(): string {
  const direct = process.env.DIRECT_URL;
  if (direct && /^postgres(ql)?:\/\//.test(direct) && !direct.includes("USER:PASSWORD")) {
    return direct;
  }
  return (process.env.DATABASE_URL ?? "").replace("-pooler", "");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl(),
  },
});
