import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"] });

import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID ?? "",
  dirs: ["./src/trigger"],
  maxDuration: 300,
});
