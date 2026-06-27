"use client";

import { useState } from "react";
import { NotificationsProvider } from "@/components/notifications";
import { PlatformHeader } from "./header";
import { PlatformMobileNav } from "./mobile-nav";
import { PlatformSidebar } from "./sidebar";

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <NotificationsProvider>
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <PlatformSidebar collapsed={collapsed} />
        </div>
        <div className="flex flex-1 flex-col">
          <PlatformHeader collapsed={collapsed} onMenuToggle={() => setCollapsed((v) => !v)} />
          <main className="flex-1 p-6 pb-24 md:pb-6">{children}</main>
          <PlatformMobileNav />
        </div>
      </div>
    </NotificationsProvider>
  );
}
