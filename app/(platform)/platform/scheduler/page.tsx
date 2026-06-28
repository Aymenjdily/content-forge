"use client";

import { useEffect, useState } from "react";
import { deleteCronJob, getCronJobs, toggleCronJob, type CronJob } from "@/lib/actions/cron-jobs";
import { NewScheduleDialog } from "@/components/platform/new-schedule-dialog";
import { Button } from "@/components/platform/button";
import { useToast } from "@/components/notifications";
import { cn } from "@/lib/utils";

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleString();
}

function CronExpressionBadge({ expression, timezone }: { expression: string; timezone: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-mono text-muted-foreground">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{expression}</span>
      <span className="text-muted-foreground/60">·</span>
      <span>{timezone}</span>
    </div>
  );
}

function PlatformBadge({ value }: { value: string }) {
  const labels: Record<string, string> = {
    blog: "Blog",
    linkedin: "LinkedIn",
    twitter: "Twitter / X",
  };
  return (
    <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {labels[value] || value}
    </span>
  );
}

export default function SchedulerPage() {
  const { toast } = useToast();
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const data = await getCronJobs();
      if (!cancelled) {
        setCronJobs(data);
        setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleCreated(cronJob: CronJob) {
    setCronJobs((prev) => [cronJob, ...prev]);
  }

  async function handleDelete(id: string) {
    setProcessingId(id);
    const result = await deleteCronJob(id);
    setProcessingId(null);
    if (result.success) {
      setCronJobs((prev) => prev.filter((job) => job.id !== id));
      toast({ title: "Deleted", message: "Schedule removed." });
    } else {
      toast({ title: "Error", message: result.error || "Failed to delete schedule.", type: "error" });
    }
  }

  async function handleToggle(job: CronJob) {
    setProcessingId(job.id);
    const next = !job.isActive;
    const result = await toggleCronJob(job.id, next);
    setProcessingId(null);
    if (result.success) {
      setCronJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, isActive: next } : j)));
      toast({ title: next ? "Activated" : "Paused", message: `Schedule ${next ? "activated" : "paused"}.` });
    } else {
      toast({ title: "Error", message: result.error || "Failed to update schedule.", type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <NewScheduleDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={handleCreated} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scheduler</h1>
          <p className="text-sm text-muted-foreground">Automate recurring content generation with CRON schedules.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New schedule</Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      ) : cronJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-base font-medium">No recurring jobs yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create a schedule to generate content automatically on a recurring basis.
          </p>
          <Button className="mt-5" onClick={() => setDialogOpen(true)}>
            Create your first schedule
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {cronJobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-medium">{job.topic}</h3>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      job.isActive ? "bg-status-green-bg text-status-green-text" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {job.isActive ? "Active" : "Paused"}
                  </span>
                </div>

                <CronExpressionBadge expression={job.cronExpression} timezone={job.timezone} />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="capitalize">Tone: {job.config.tone}</span>
                  <span className="capitalize">Length: {job.config.length}</span>
                  {job.sourceUrl && (
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline"
                    >
                      Source
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {job.config.platforms.map((platform) => (
                    <PlatformBadge key={platform} value={platform} />
                  ))}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground/80">
                  <span>Last run: {formatDate(job.lastRunAt)}</span>
                  <span>Created: {formatDate(job.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={processingId === job.id}
                  onClick={() => handleToggle(job)}
                >
                  {job.isActive ? "Pause" : "Activate"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={processingId === job.id}
                  onClick={() => handleDelete(job.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
