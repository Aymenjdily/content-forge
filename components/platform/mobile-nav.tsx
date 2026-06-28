"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NewJobDialog } from "./new-job-dialog";

const mainNav = [
  {
    label: "Dashboard",
    href: "/platform",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Library",
    href: "/platform/library",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
];

export function PlatformMobileNav() {
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <NewJobDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <nav className="fixed bottom-6 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-2xl border border-border bg-background/95 px-2 py-2 shadow-lg backdrop-blur-sm md:hidden">
        <div className="flex items-center justify-around">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[11px] font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("transition-colors", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-foreground text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
            aria-label="New job"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </nav>
    </>
  );
}
