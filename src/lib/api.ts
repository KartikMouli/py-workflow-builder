import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export async function currentUserId() {
  const { userId } = await auth();
  return userId;
}

export const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const notFound = () =>
  NextResponse.json({ error: "Not found" }, { status: 404 });

export const invalid = (error: ZodError) =>
  NextResponse.json({ error: "Validation failed", issues: error.issues }, { status: 400 });
