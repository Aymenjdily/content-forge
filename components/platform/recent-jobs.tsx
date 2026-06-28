"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/notifications";
import { useCallback, useEffect, useState } from "react";

interface Job {
  id: string;
  topic: string;
  status: string;
  progress: number;
  createdAt: string;
  startedAt: string | null;
  currentStage: string | null;
}

const TOTAL_PROCESS_MS = 10 * 60 * 1000;

const statusFilters = [
  { value: "ALL", label: "All" },
  { value: "QUEUED", label: "Queued" },
  { value: "RUNNING", label: "Running" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function RecentJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const limit = 8;

  const loadJobs = useCallback(async (currentPage: number, currentStatus: string, currentSearch: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(limit));
      if (currentStatus !== "ALL") params.set("status", currentStatus);
      if (currentSearch.trim()) params.set("search", currentSearch.trim());

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(data.jobs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (status !== "ALL") params.set("status", status);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/jobs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        if (!cancelled) {
          setJobs(data.jobs);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [page, status, search]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadJobs(page, status, search, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadJobs, page, status, search]);

  const setStatusFilter = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const setSearchQuery = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDelete = async (job: Job) => {
    if (!confirm(`Delete "${job.topic}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast({ title: "Job deleted", message: `"${job.topic}" has been removed.`, type: "success" });
    } catch {
      toast({ title: "Delete failed", message: "Could not delete the job. Try again.", type: "error" });
    }
  };

  const handleRetry = async (job: Job) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}/retry`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to retry job");
      toast({ title: "Job retried", message: `"${job.topic}" is queued again.`, type: "success" });
      loadJobs(page, status, search, false);
    } catch {
      toast({ title: "Retry failed", message: "Could not retry the job. Try again.", type: "error" });
    }
  };

  const handleCancel = async (job: Job) => {
    if (!confirm(`Cancel "${job.topic}"?`)) return;

    try {
      const res = await fetch(`/api/jobs/${job.id}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to cancel job");
      toast({ title: "Job cancelled", message: `"${job.topic}" has been cancelled.`, type: "warning" });
      loadJobs(page, status, search, false);
    } catch {
      toast({ title: "Cancel failed", message: "Could not cancel the job. Try again.", type: "error" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent jobs</h3>
          <Link
            href="/platform/library"
            className="text-xs font-medium text-accent transition-colors hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setStatusFilter(filter.value);
                }}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  status === filter.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search jobs..."
            className="w-full rounded-lg border border-border bg-background px-4 py-1.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
          />
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">No jobs found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || status !== "ALL" ? "Try adjusting your filters." : "Create your first job to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDelete={handleDelete}
                onRetry={handleRetry}
                onCancel={handleCancel}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface JobCardProps {
  job: Job;
  onDelete: (job: Job) => void;
  onRetry: (job: Job) => void;
  onCancel: (job: Job) => void;
}

function JobCard({ job, onDelete, onRetry, onCancel }: JobCardProps) {
  const status = getStatusMeta(job.status);
  const isActive = job.status === "QUEUED" || job.status === "RUNNING";
  const isRetryable = job.status === "FAILED" || job.status === "CANCELLED";

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 shadow-sm transition-all hover:border-foreground/10 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <Link href={`/platform/jobs/${job.id}`} className="flex flex-1 items-start gap-4 min-w-0">
        <div className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl", status.bg)}>
          {status.icon}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[15px] font-medium leading-6">{job.topic}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", status.badge)}>
              {status.label}
            </span>
            {job.currentStage && job.status === "RUNNING" && (
              <span className="text-muted-foreground capitalize">{job.currentStage.replace(/([A-Z])/g, " $1").trim()}</span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-4 sm:ml-4">
        <div className="flex flex-1 flex-col gap-1.5 sm:w-52 sm:flex-none">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{job.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", status.bar)}
              style={{ width: `${job.progress}%` }}
            />
          </div>
          {isActive && (
            <p className="text-[10px] text-muted-foreground">
              <EstimatedTime job={job} />
            </p>
          )}
        </div>

        <JobActions job={job} onDelete={onDelete} onRetry={onRetry} onCancel={onCancel} isActive={isActive} isRetryable={isRetryable} />
      </div>
    </div>
  );
}

function JobActions({
  job,
  onDelete,
  onRetry,
  onCancel,
  isActive,
  isRetryable,
}: JobCardProps & { isActive: boolean; isRetryable: boolean }) {
  const [open, setOpen] = useState(false);

  const handleAction = (callback: () => void) => {
    callback();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        aria-label="Job actions"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-background p-1 shadow-lg">
            <Link
              href={`/platform/jobs/${job.id}`}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              View details
            </Link>
            {isRetryable && (
              <ActionButton
                onClick={() => handleAction(() => onRetry(job))}
                label="Retry"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                  </svg>
                }
              />
            )}
            {isActive && (
              <ActionButton
                onClick={() => handleAction(() => onCancel(job))}
                label="Cancel"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                }
              />
            )}
            <div className="my-1 border-t border-border" />
            <ActionButton
              onClick={() => handleAction(() => onDelete(job))}
              label="Delete"
              danger
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              }
            />
          </div>
        </>
      )}
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  icon,
  danger,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        danger
          ? "text-status-red-text hover:bg-status-red-bg"
          : "text-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function getStatusMeta(status: string) {
  switch (status) {
    case "RUNNING":
      return {
        label: "Running",
        bg: "bg-status-blue-bg",
        badge: "border-status-blue-border bg-status-blue-bg text-status-blue-text",
        bar: "bg-status-blue-text",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-status-blue-text"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ),
      };
    case "COMPLETED":
      return {
        label: "Completed",
        bg: "bg-green-50",
        badge: "border-status-green-border bg-status-green-bg text-status-green-text",
        bar: "bg-green-600",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-status-green-text"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
      };
    case "FAILED":
      return {
        label: "Failed",
        bg: "bg-status-red-bg",
        badge: "border-status-red-border bg-status-red-bg text-status-red-text",
        bar: "bg-red-600",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-status-red-text"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ),
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        bg: "bg-status-slate-bg",
        badge: "border-status-slate-border bg-status-slate-bg text-status-slate-text",
        bar: "bg-slate-500",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        ),
      };
    case "QUEUED":
      return {
        label: "Queued",
        bg: "bg-status-amber-bg",
        badge: "border-status-amber-border bg-status-amber-bg text-status-amber-text",
        bar: "bg-amber-600",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-status-amber-text"
          >
            <path d="M5 22h14" />
            <path d="M5 2h14" />
            <path d="M17 22v-4.172a2 2 0 00-.586-1.414L5 4" />
            <path d="M7 2v4.172a2 2 0 00.586 1.414L19 20" />
          </svg>
        ),
      };
    default:
      return {
        label: status,
        bg: "bg-muted",
        badge: "border-border bg-muted text-muted-foreground",
        bar: "bg-foreground",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      };
  }
}

function EstimatedTime({ job }: { job: Job }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (job.status === "QUEUED") {
    return <>Estimated start: ~1 min · Full pipeline: ~{formatDuration(TOTAL_PROCESS_MS)}</>;
  }

  const elapsed = job.startedAt ? now - new Date(job.startedAt).getTime() : 0;
  const estimatedRemaining = Math.max(0, TOTAL_PROCESS_MS - elapsed);
  const formatted = formatDuration(estimatedRemaining);

  if (estimatedRemaining === 0) {
    return <>Finishing up...</>;
  }

  return <>Estimated remaining: ~{formatted}</>;
}

function formatDuration(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
}
