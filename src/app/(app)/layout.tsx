import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-hidden bg-canvas">{children}</main>
    </div>
  );
}
