"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Spec requirement: log `[Py] Candidate LinkedIn: <url>` once per page.
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
