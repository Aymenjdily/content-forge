"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { NotificationBell, Toasts } from "@/components/notifications";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { NewJobDialog } from "./new-job-dialog";

interface PlatformHeaderProps {
  onMenuToggle: () => void;
  collapsed: boolean;
}

export function PlatformHeader({ onMenuToggle, collapsed }: PlatformHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);

  return (
    <>
      <NewJobDialog open={newJobOpen} onOpenChange={setNewJobOpen} />
      <MobileNavDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onNewJob={() => setNewJobOpen(true)} />

      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link href="/" className="text-sm font-medium text-foreground transition-colors hover:text-foreground md:hidden">
            Content Forge
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <NotificationBell />
          <Link
            href="/pricing"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Pricing
          </Link>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </header>
      <Toasts />
    </>
  );
}
