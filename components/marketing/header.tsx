"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

function UserNav() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="hidden h-9 w-9 animate-pulse rounded-full bg-muted md:block" />
    );
  }

  if (!user) {
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/login"
          className="group relative px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Log in
          <span className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-foreground transition-transform duration-200 group-hover:scale-x-100" />
        </Link>
        <Link
          href="/platform"
          className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-md bg-foreground px-5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-lg"
        >
          <span className="relative z-10">Start creating</span>
          <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
        </Link>
      </div>
    );
  }

  const name = user.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User";

  return (
    <div className="hidden items-center gap-3 md:flex">
      <Link
        href="/platform"
        className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-md bg-foreground px-5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-lg"
      >
        <span className="relative z-10">Dashboard</span>
        <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
      </Link>
      <Link
        href="/platform"
        className="group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-muted">
          {user.imageUrl ? (
            <Image src={user.imageUrl} alt={name} fill sizes="32px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase">
              {name[0]}
            </div>
          )}
        </div>
        <span className="max-w-[120px] truncate">{name}</span>
      </Link>
    </div>
  );
}

function MobileUserNav({ onClick }: { onClick: () => void }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (!user) {
    return (
      <>
        <Link
          href="/login"
          onClick={onClick}
          className="rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
        >
          Log in
        </Link>
        <Link
          href="/platform"
          onClick={onClick}
          className="mt-1 rounded-md bg-foreground px-3 py-3 text-center text-base font-semibold text-primary-foreground"
        >
          Start creating
        </Link>
      </>
    );
  }

  const name = user.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "User";

  return (
    <>
      <Link
        href="/platform"
        onClick={onClick}
        className="mt-1 rounded-md bg-foreground px-3 py-3 text-center text-base font-semibold text-primary-foreground"
      >
        Dashboard
      </Link>
      <Link
        href="/platform"
        onClick={onClick}
        className="flex items-center gap-3 rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
      >
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-muted">
          {user.imageUrl ? (
            <Image src={user.imageUrl} alt={name} fill sizes="32px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase">
              {name[0]}
            </div>
          )}
        </div>
        <span className="truncate">{name}</span>
      </Link>
    </>
  );
}

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2">
          <Logo size={22} className="text-foreground" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold tracking-tight">Content Forge</span>
            <span className="rounded border border-accent/20 bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              Beta
            </span>
          </div>
        </Link>

        <nav className="hidden items-center md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
              <span className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-foreground transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <UserNav />

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white hover:text-foreground md:hidden"
          aria-label="Toggle menu"
        >
          <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
          <div className="relative h-3.5 w-4">
            <span
              className={cn(
                "absolute left-0 block h-0.5 w-4 rounded-full bg-current transition-all duration-300",
                mobileOpen ? "top-1.5 rotate-45" : "top-0"
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-1.5 block h-0.5 rounded-full bg-current transition-all duration-300",
                mobileOpen ? "w-0 opacity-0" : "w-4 opacity-100"
              )}
            />
            <span
              className={cn(
                "absolute left-0 block h-0.5 w-4 rounded-full bg-current transition-all duration-300",
                mobileOpen ? "top-1.5 -rotate-45" : "top-3"
              )}
            />
          </div>
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-b border-border bg-background transition-all duration-300 md:hidden",
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-white hover:text-foreground"
            >
              <span>{item.label}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-border">
                <path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
          <hr className="my-3 border-border" />
          <MobileUserNav onClick={() => setMobileOpen(false)} />
        </nav>
      </div>
    </header>
  );
}
