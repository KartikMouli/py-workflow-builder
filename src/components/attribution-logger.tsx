"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Spec requirement: on the initial client render of every page, emit exactly one
 * `console.log` of `[Py] Candidate LinkedIn: <url>`. Keyed on pathname so each page logs
 * once; the ref guards against React StrictMode's double-invoked effect in dev.
 */
export function AttributionLogger() {
  const pathname = usePathname();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    if (lastLogged.current === pathname) return;
    lastLogged.current = pathname;
    const url = process.env.NEXT_PUBLIC_CANDIDATE_LINKEDIN_URL ?? "";
    console.log(`[Py] Candidate LinkedIn: ${url}`);
  }, [pathname]);

  return null;
}
