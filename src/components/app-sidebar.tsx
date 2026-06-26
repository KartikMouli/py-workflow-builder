"use client";

import { UserButton } from "@clerk/nextjs";
import {
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronUp,
  FolderClosed,
  Gift,
  Library,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

function RailTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="group relative flex">
      {children}
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white shadow-lg group-hover:block">
        {label}
      </span>
    </div>
  );
}

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
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);

  if (collapsed) {
    return (
      <aside className="flex h-full w-16 shrink-0 flex-col items-center border-r border-gray-200 bg-sidebar py-4">
        <button
          type="button"
          aria-label="Expand sidebar"
          onClick={() => setCollapsed(false)}
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-[#e6e6e6]"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
        <nav className="flex flex-1 flex-col items-center gap-1">
          {NAV.map(({ label, icon: Icon, href }) => {
            const active = href ? pathname.startsWith(href) : false;
            const cls = `flex h-9 w-9 items-center justify-center rounded-lg ${
              active ? "bg-[#dadada] text-gray-900" : "text-gray-600 hover:bg-[#e6e6e6]"
            }`;
            return (
              <RailTip key={label} label={label}>
                {href ? (
                  <Link href={href} className={cls}>
                    <Icon className="h-4 w-4" />
                  </Link>
                ) : (
                  <button type="button" className={`${cls} cursor-default`}>
                    <Icon className="h-4 w-4" />
                  </button>
                )}
              </RailTip>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-2">
          <RailTip label="Settings">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-[#e6e6e6]"
            >
              <Settings className="h-4 w-4" />
            </button>
          </RailTip>
          <RailTip label="Claim Offer">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-hover"
            >
              <Gift className="h-4 w-4" />
            </button>
          </RailTip>
          <UserButton />
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-74 shrink-0 flex-col border-r border-gray-200 bg-sidebar">
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-2xl font-bold tracking-tight text-gray-900">Py</span>
        <button
          type="button"
          aria-label="Collapse sidebar"
          onClick={() => setCollapsed(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-[#e6e6e6]"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = href ? pathname.startsWith(href) : false;
          const base =
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";
          const tone = active
            ? "bg-[#dadada] font-medium text-gray-900"
            : "text-gray-600 hover:bg-[#e6e6e6]";

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

      <div className="border-t border-gray-200 p-3">
        <button
          type="button"
          aria-label={menuOpen ? "Hide menu" : "Show menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center justify-center rounded-lg py-1 text-gray-400 hover:bg-[#e6e6e6] hover:text-gray-600"
        >
          {menuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        {menuOpen && (
          <div className="mt-2 space-y-2">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
          </div>
        )}

        <div className="flex items-center gap-2 px-1 pt-3">
          <UserButton
            showName
            appearance={{ elements: { userButtonBox: { flexDirection: "row-reverse" } } }}
          />
        </div>
      </div>
    </aside>
  );
}
