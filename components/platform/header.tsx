import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { NotificationBell, Toasts } from "@/components/notifications";

interface PlatformHeaderProps {
  onMenuToggle: () => void;
  collapsed: boolean;
}

export function PlatformHeader({ onMenuToggle, collapsed }: PlatformHeaderProps) {
  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
        <div className="flex items-center gap-4">
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

          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden">
            Content Forge
          </Link>
        </div>

        <div className="flex items-center gap-3">
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
