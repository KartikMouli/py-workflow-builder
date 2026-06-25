import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUserId, unauthorized } from "@/lib/api";
import { serverEnv } from "@/lib/env";

export async function POST() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const env = serverEnv();
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const params = JSON.stringify({
    auth: { key: env.TRANSLOADIT_KEY, expires },
    steps: { uploaded: { robot: "/image/optimize", use: ":original", result: true } },
  });
  const signature = `sha384:${createHmac("sha384", env.TRANSLOADIT_SECRET).update(params).digest("hex")}`;

  return NextResponse.json({ params, signature });
}
