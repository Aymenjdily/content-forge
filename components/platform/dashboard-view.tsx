"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { RecentJobs } from "./recent-jobs";
import { NewJobDialog } from "./new-job-dialog";

interface DashboardViewProps {
  userName: string;
  stats: {
    total: number;
    inProgress: number;
    completed: number;
    failed: number;
  };
}

const quickActions = [
  {
    label: "Create content",
    description: "Start a new AI-powered pipeline.",
    href: "#",
    action: "new-job" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    label: "Browse library",
    description: "View and export finished content.",
    href: "/platform/library",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    label: "Templates",
    description: "Reuse your best job configurations.",
    href: "/platform/templates",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    label: "Schedule",
    description: "Set up recurring content jobs.",
    href: "/platform/scheduler",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
];

export function DashboardView({ userName, stats }: DashboardViewProps) {
  const [newJobOpen, setNewJobOpen] = useState(false);

  return (
    <div className="space-y-10">
      <NewJobDialog open={newJobOpen} onOpenChange={setNewJobOpen} />

      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {getGreeting()}, {userName || "there"}
          </h1>
          <p className="max-w-md text-base leading-7 text-muted-foreground">
            Track your content jobs, review drafts, and start new pipelines from one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setNewJobOpen(true)}
            className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-md bg-foreground px-5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-lg"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New job
            </span>
            <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
          </button>
          <Link
            href="/platform/scheduler"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Schedule
          </Link>
          <Link
            href="/platform/library"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Library
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total jobs" value={stats.total} icon="layers" />
        <StatCard label="In progress" value={stats.inProgress} icon="running" tone="blue" />
        <StatCard label="Completed" value={stats.completed} icon="check" tone="green" />
        <StatCard label="Failed" value={stats.failed} icon="alert" tone="red" />
      </div>

      {/* Quick actions */}
      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const isNewJob = action.action === "new-job";
            const content = (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-foreground group-hover:text-primary-foreground">
                  {action.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{action.label}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </div>
              </>
            );

            if (isNewJob) {
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => setNewJobOpen(true)}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-background p-5 text-left shadow-sm transition-all hover:border-foreground/10 hover:shadow-md"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm transition-all hover:border-foreground/10 hover:shadow-md"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent jobs */}
      <RecentJobs />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: "layers" | "running" | "check" | "alert";
  tone?: "blue" | "green" | "red";
}) {
  const tones = {
    blue: "bg-status-blue-bg text-status-blue-text",
    green: "bg-status-green-bg text-status-green-text",
    red: "bg-status-red-bg text-status-red-text",
  };

  const icons = {
    layers: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    running: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
    ),
    check: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    alert: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-background p-5 shadow-sm transition-all hover:border-foreground/10 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", tone ? tones[tone] : "bg-muted text-foreground")}>
          {icons[icon]}
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-muted/50 transition-transform group-hover:scale-110" />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
