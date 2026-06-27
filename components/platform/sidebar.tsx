"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { NewJobDialog } from "./new-job-dialog";

const nav = [
  {
    label: "Dashboard",
    href: "/platform",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "New Job",
    href: "#",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    action: "new-job" as const,
  },
  {
    label: "Library",
    href: "/platform/library",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/platform/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.09a2 2 0 01-1-1.74v-.47a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.39a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
      </svg>
    ),
  },
];

interface PlatformSidebarProps {
  collapsed: boolean;
}

export function PlatformSidebar({ collapsed }: PlatformSidebarProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  const imageUrl = user?.imageUrl;
  const name = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User";
  const email = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <>
      <NewJobDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <aside
        className={cn(
          "sticky top-0 hidden h-screen flex-col border-r border-border bg-background transition-all duration-300 md:flex",
          collapsed ? "w-20 items-center px-3" : "w-64 px-4"
        )}
      >
        <div
          className={cn(
            "flex h-16 flex-shrink-0 items-center border-b border-border",
            collapsed ? "justify-center" : "px-1"
          )}
        >
          <Link href="/" className={cn("flex items-center gap-2.5", collapsed && "hidden")}>
            <Logo size={24} />
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-semibold tracking-tight">Content Forge</span>
              <span className="rounded border border-accent/20 bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                Beta
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-4">
          {!collapsed && (
            <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </div>
          )}
          {nav.map((item) => {
            const isActive = pathname === item.href;
            const isAction = item.action === "new-job";

            const content = (
              <>
                <span className={cn("transition-colors", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {isActive && <span className="h-2 w-2 rounded-full bg-accent" />}
                  </>
                )}
              </>
            );

            if (isAction) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setDialogOpen(true)}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg text-sm font-medium transition-all text-left",
                    collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
                    "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg text-sm font-medium transition-all",
                  collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <div className={cn("flex-shrink-0 border-t border-border py-4", collapsed && "flex flex-col items-center gap-3")}>
          {!collapsed && (
            <Link
              href="/"
              className="group mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12l9-9 9 9" />
                <path d="M9 21V9h6v12" />
              </svg>
              Back to site
            </Link>
          )}

          {isLoaded && user && (
            <div className={cn("flex items-center gap-3", collapsed && "flex-col")}>
              <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                {imageUrl ? (
                  <Image src={imageUrl} alt={name} fill sizes="36px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase">
                    {name[0]}
                  </div>
                )}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
              )}
              <SignOutButton redirectUrl="/">
                <button
                  type="button"
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Sign out"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </SignOutButton>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
