"use client";

import { notFound } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/platform/button";
import { useNotifications, useToast } from "@/components/notifications";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  topic: string;
  status: string;
  progress: number;
  currentStage: string | null;
  config: Record<string, unknown>;
  draft: string | null;
  imageUrl: string | null;
  seoMeta: Record<string, unknown> | null;
  scheduledPosts: Record<string, unknown> | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  stages: Stage[];
  logs: Log[];
}

interface Stage {
  id: string;
  name: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

interface Log {
  id: string;
  level: string;
  message: string;
  createdAt: string;
}

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notifiedStatuses = useRef<Set<string>>(new Set());
  const { addNotification } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function fetchJob() {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            notFound();
          }
          throw new Error("Failed to fetch job");
        }
        const data = (await res.json()) as Job;
        if (!cancelled) {
          setJob(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setLoading(false);
        }
      }
    }

    fetchJob();

    const interval = setInterval(() => {
      fetchJob();
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (!job) return;

    if (!notifiedStatuses.current.has(job.status)) {
      notifiedStatuses.current.add(job.status);

      if (job.status === "COMPLETED") {
        addNotification({
          title: "Job completed",
          message: `"${job.topic}" is ready for review.`,
          type: "success",
          href: `/platform/jobs/${job.id}`,
        });
        toast({ title: "Job completed", message: `"${job.topic}" is ready.`, type: "success" });
      } else if (job.status === "FAILED") {
        addNotification({
          title: "Job failed",
          message: `"${job.topic}" encountered an error.`,
          type: "error",
          href: `/platform/jobs/${job.id}`,
        });
        toast({ title: "Job failed", message: `"${job.topic}" encountered an error.`, type: "error" });
      }
    }
  }, [job]);

  if (loading || !job) {
    return <JobDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const config = job.config as { tone?: string; length?: string; platforms?: string[] } | null;
  const status = getStatusMeta(job.status);
  const isFinished = job.status === "COMPLETED" || job.status === "FAILED";

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/platform" className="hover:text-foreground">Dashboard</Link>
        <span>/</span>
        <span className="text-foreground">Job details</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Content Job</p>
          <h2 className="text-3xl font-semibold tracking-tight">{job.topic}</h2>
          <p className="text-sm text-muted-foreground">
            Created {new Date(job.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide", status.badge)}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">{job.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-700", status.bar)}
            style={{ width: `${job.progress}%` }}
          />
        </div>
        {!isFinished && (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            {job.status === "QUEUED" ? (
              <span>Waiting for worker... Estimated start: <span className="font-medium text-foreground">&lt; 1 minute</span></span>
            ) : (
              <span>Currently running{" "}
                <span className="font-medium text-foreground capitalize">{job.currentStage?.replace(/([A-Z])/g, " $1").trim()}</span>
                . Estimated remaining: <span className="font-medium text-foreground">~30 seconds</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ConfigCard label="Tone" value={config?.tone} />
        <ConfigCard label="Length" value={config?.length} />
        <ConfigCard label="Platforms" value={config?.platforms?.join(", ")} />
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pipeline</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {job.stages.map((stage) => {
            const stageStatus = getStatusMeta(stage.status);
            return (
              <div
                key={stage.id}
                className={cn(
                  "relative rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
                  stage.status === "RUNNING"
                    ? "border-blue-200"
                    : stage.status === "COMPLETED"
                      ? "border-green-200"
                      : stage.status === "FAILED"
                        ? "border-red-200"
                        : "border-border"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", stageStatus.bg)}>
                      {stageStatus.icon}
                    </div>
                    <div>
                      <p className="text-[15px] font-medium leading-6 capitalize">{stage.name.replace(/([A-Z])/g, " $1").trim()}</p>
                      <p className="text-xs text-muted-foreground">
                        {stage.startedAt
                          ? new Date(stage.startedAt).toLocaleTimeString()
                          : "Waiting"}
                      </p>
                    </div>
                  </div>
                  <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", stageStatus.badge)}>
                    {stage.status}
                  </span>
                </div>

                {stage.error && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{stage.error}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {job.draft && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Draft</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Generated by Content Forge</span>
              <ExportButton jobId={job.id} topic={job.topic} />
            </div>
          </div>
          <article className="rounded-2xl border border-border bg-white p-8 shadow-sm">
            <div className="prose prose-sm max-w-none">
              {job.draft.split("\n").map((line, index) => {
                if (line.startsWith("# ")) {
                  return <h1 key={index} className="text-2xl font-semibold tracking-tight">{line.replace("# ", "")}</h1>;
                }
                if (line.startsWith("## ")) {
                  return <h2 key={index} className="mt-6 text-lg font-semibold tracking-tight">{line.replace("## ", "")}</h2>;
                }
                if (line.startsWith("- ")) {
                  return (
                    <ul key={index} className="my-2 list-disc pl-5">
                      <li>{line.replace("- ", "")}</li>
                    </ul>
                  );
                }
                if (line.trim() === "") {
                  return <br key={index} />;
                }
                return <p key={index} className="leading-7 text-foreground">{line}</p>;
              })}
            </div>
          </article>
        </div>
      )}

      {job.seoMeta && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">SEO Metadata</h3>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-3">
            <SeoRow label="Title" value={(job.seoMeta as { title?: string }).title} />
            <SeoRow label="Slug" value={(job.seoMeta as { slug?: string }).slug} />
            <SeoRow label="Meta description" value={(job.seoMeta as { metaDescription?: string }).metaDescription} />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Keywords</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {((job.seoMeta as { keywords?: string[] }).keywords || []).map((keyword) => (
                  <span key={keyword} className="rounded-lg bg-muted px-2 py-1 text-xs">{keyword}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {job.imageUrl && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cover Image</h3>
          <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
            <img src={job.imageUrl} alt="Generated cover" className="rounded-xl" />
          </div>
        </div>
      )}

      {job.scheduledPosts && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Scheduled Posts</h3>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <ul className="space-y-2">
              {((job.scheduledPosts as { posts?: { platform: string; scheduledAt: string; status: string }[] }).posts || []).map((post, index) => (
                <li key={index} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{post.platform}</span>
                  <span className="text-muted-foreground">{new Date(post.scheduledAt).toLocaleString()}</span>
                  <span className="rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase">{post.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {job.logs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Logs</h3>
            <span className="text-xs text-muted-foreground">{job.logs.length} entries</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-black text-sm font-mono">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-white/50">Trigger.dev logs</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-4">
              {job.logs.map((log, index) => (
                <div key={log.id} className="flex gap-3 py-1">
                  <span className="flex-shrink-0 text-white/30">{String(index + 1).padStart(3, "0")}</span>
                  <span className={cn("flex-shrink-0 text-[10px] font-bold uppercase", logLevelColor(log.level))}>{log.level.padEnd(5)}</span>
                  <span className="text-white/70">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value || "—"}</p>
    </div>
  );
}

function ExportButton({ jobId, topic }: { jobId: string; topic: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    setOpen(false);
    try {
      const res = await fetch(`/api/library/${jobId}/export?format=${format}`);
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

      toast({ title: "Exported", message: `Downloaded ${format} for "${topic}".`, type: "success" });
    } catch {
      toast({ title: "Export failed", message: "Could not export content. Try again.", type: "error" });
    }
  };

  return (
    <div className="relative">
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((prev) => !prev)}>
        Export
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-lg">
            {[
              { value: "markdown", label: "Markdown" },
              { value: "html", label: "HTML" },
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

function ConfigCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-foreground/10">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-[15px] font-medium capitalize leading-6">{value || "—"}</p>
    </div>
  );
}

function logLevelColor(level: string) {
  switch (level) {
    case "ERROR":
      return "text-red-400";
    case "WARN":
      return "text-amber-400";
    case "DEBUG":
      return "text-slate-400";
    default:
      return "text-blue-400";
  }
}

function getStatusMeta(status: string) {
  switch (status) {
    case "RUNNING":
      return {
        label: "Running",
        bg: "bg-blue-50",
        badge: "border-blue-200 bg-blue-50 text-blue-700",
        bar: "bg-blue-600",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-blue-600"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        ),
      };
    case "COMPLETED":
      return {
        label: "Completed",
        bg: "bg-green-50",
        badge: "border-green-200 bg-green-50 text-green-700",
        bar: "bg-green-600",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
      };
    case "FAILED":
      return {
        label: "Failed",
        bg: "bg-red-50",
        badge: "border-red-200 bg-red-50 text-red-700",
        bar: "bg-red-600",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ),
      };
    case "QUEUED":
      return {
        label: "Queued",
        bg: "bg-amber-50",
        badge: "border-amber-200 bg-amber-50 text-amber-700",
        bar: "bg-amber-600",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      };
  }
}

function JobDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />

      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-10 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-6 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
