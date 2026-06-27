import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { RecentJobs } from "@/components/platform/recent-jobs";

export default async function DashboardPage() {
  const { userId } = await auth();

  const stats = userId
    ? await prisma.job.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      })
    : [];

  const total = stats.reduce((acc, s) => acc + s._count.status, 0);
  const inProgress = stats.find((s) => s.status === "RUNNING" || s.status === "QUEUED")?._count.status ?? 0;
  const completed = stats.find((s) => s.status === "COMPLETED")?._count.status ?? 0;
  const failed = stats.find((s) => s.status === "FAILED")?._count.status ?? 0;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="max-w-md text-base leading-7 text-muted-foreground">Track your content jobs, review drafts, and start new pipelines from one place.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total jobs" value={total} icon="layers" />
        <StatCard label="In progress" value={inProgress} icon="running" tone="blue" />
        <StatCard label="Completed" value={completed} icon="check" tone="green" />
        <StatCard label="Failed" value={failed} icon="alert" tone="red" />
      </div>

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
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
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
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:border-foreground/10 hover:shadow-md">
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
