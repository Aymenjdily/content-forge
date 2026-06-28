"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/platform/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/notifications";

interface LibraryJob {
  id: string;
  topic: string;
  status: string;
  progress: number;
  currentStage: string | null;
  imageUrl: string | null;
  draft: string | null;
  seoMeta: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusFilters = [
  { value: "ALL", label: "All" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ACTIVE", label: "In progress" },
  { value: "FAILED", label: "Failed" },
];

export function ContentLibrary() {
  const [jobs, setJobs] = useState<LibraryJob[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchJobs = async (currentPage: number, currentStatus: string, currentSearch: string, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(pagination.limit));
      if (currentStatus !== "ALL") params.set("status", currentStatus);
      if (currentSearch.trim()) params.set("search", currentSearch.trim());

      const res = await fetch(`/api/library?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch library");
      const data = await res.json();
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch {
      toast({ title: "Error", message: "Could not load content library.", type: "error" });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(1));
        params.set("limit", String(pagination.limit));
        if (status !== "ALL") params.set("status", status);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/library?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch library");
        const data = await res.json();
        if (!cancelled) {
          setJobs(data.jobs);
          setPagination(data.pagination);
        }
      } catch {
        if (!cancelled) {
          toast({ title: "Error", message: "Could not load content library.", type: "error" });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [status, search, pagination.limit, toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs(pagination.page, status, search, false);
    }, 10000);
    return () => clearInterval(interval);
  }, [pagination.page, status, search]);

  const handleExport = async (job: LibraryJob, format: string) => {
    try {
      const res = await fetch(`/api/library/${job.id}/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      a.download = match?.[1] || `content.${format === "markdown" ? "md" : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Exported", message: `Downloaded ${format} for "${job.topic}".`, type: "success" });
    } catch {
      toast({ title: "Export failed", message: "Could not export content. Try again.", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search content..."
          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
        />
      </div>

      {loading && jobs.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">No content found.</p>
          <p className="text-xs text-muted-foreground mt-1">Create a job to start building your library.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <LibraryCard key={job.id} job={job} onExport={handleExport} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchJobs(pagination.page - 1, status, search, true)}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => fetchJobs(pagination.page + 1, status, search, true)}
                  disabled={pagination.page >= pagination.totalPages}
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

interface LibraryCardProps {
  job: LibraryJob;
  onExport: (job: LibraryCardProps["job"], format: string) => void;
}

function LibraryCard({ job, onExport }: LibraryCardProps) {
  const meta = job.seoMeta as { title?: string; metaDescription?: string } | null;
  const title = meta?.title || job.topic;
  const isFinished = job.status === "COMPLETED" || job.status === "FAILED";
  const status = getStatusMeta(job.status);

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-background p-5 shadow-sm transition-all hover:border-foreground/10 hover:shadow-md">
      {job.imageUrl ? (
        <div className="mb-4 overflow-hidden rounded-xl">
          <img src={job.imageUrl} alt="Cover" className="aspect-video w-full object-cover" />
        </div>
      ) : (
        <div className="mb-4 flex aspect-video items-center justify-center rounded-xl bg-muted">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug" title={title}>
          {title}
        </h3>
        <span className={cn("flex-shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", status.badge)}>
          {status.label}
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-xs text-muted-foreground">
        {meta?.metaDescription || (job.draft ? job.draft.slice(0, 120) + "..." : "No description available.")}
      </p>

      <div className="mt-auto space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{job.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-all", status.bar)} style={{ width: `${job.progress}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground">
            {new Date(job.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`/platform/jobs/${job.id}`}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              View
            </Link>
            {isFinished && (
              <ExportMenu job={job} onExport={onExport} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportMenu({ job, onExport }: LibraryCardProps) {
  const [open, setOpen] = useState(false);

  const handleExport = (format: string) => {
    onExport(job, format);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Button type="button" size="sm" onClick={() => setOpen((prev) => !prev)}>
        Export
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-background p-1 shadow-lg">
            {[
              { value: "markdown", label: "Markdown" },
              { value: "html", label: "HTML" },
              { value: "pdf", label: "PDF" },
              { value: "pptx", label: "PowerPoint" },
              { value: "json", label: "JSON" },
            ].map((format) => (
              <button
                key={format.value}
                type="button"
                onClick={() => handleExport(format.value)}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                {format.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function getStatusMeta(status: string) {
  switch (status) {
    case "RUNNING":
    case "QUEUED":
    case "PENDING":
      return {
        label: "In progress",
        badge: "border-status-blue-border bg-status-blue-bg text-status-blue-text",
        bar: "bg-blue-600",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        badge: "border-status-green-border bg-status-green-bg text-status-green-text",
        bar: "bg-green-600",
      };
    case "FAILED":
      return {
        label: "Failed",
        badge: "border-status-red-border bg-status-red-bg text-status-red-text",
        bar: "bg-red-600",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        badge: "border-status-slate-border bg-status-slate-bg text-status-slate-text",
        bar: "bg-slate-500",
      };
    default:
      return {
        label: status,
        badge: "border-border bg-muted text-muted-foreground",
        bar: "bg-foreground",
      };
  }
}
