"use client";

import { UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  Boxes,
  FolderClosed,
  Gift,
  Library,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { label: string; icon: typeof Plus; href: string | null }[] = [
  { label: "New task", icon: Plus, href: null },
  { label: "Search Task", icon: Search, href: null },
  { label: "Task", icon: MessageSquare, href: null },
  { label: "Projects", icon: FolderClosed, href: null },
  { label: "Library", icon: Library, href: null },
  { label: "Flow", icon: Workflow, href: "/dashboard" },
  { label: "Tools", icon: Boxes, href: null },
  { label: "API / MCP", icon: BookOpen, href: null },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-4 text-2xl font-bold tracking-tight text-gray-900">Py</div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = href ? pathname.startsWith(href) : false;
          const base =
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";
          const tone = active
            ? "bg-gray-100 font-medium text-gray-900"
            : "text-gray-600 hover:bg-gray-50";

          return href ? (
            <Link key={label} href={href} className={`${base} ${tone}`}>
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ) : (
            <button
              key={label}
              type="button"
              className={`${base} ${tone} w-full cursor-default text-left`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}

        <p className="px-3 pt-6 text-center text-xs text-gray-400">No tasks yet</p>
      </nav>

      <div className="space-y-2 p-3">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          <Gift className="h-4 w-4" />
          Claim Offer
        </button>
        <div className="flex items-center gap-2 px-1 pt-1">
          <UserButton showName />
        </div>
      </div>
    </aside>
  );
}
