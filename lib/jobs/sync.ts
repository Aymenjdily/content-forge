import { runs } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";

type TriggerRunStatus = "COMPLETED" | "FAILED" | "CANCELLED" | "EXPIRED" | string;

export async function syncRunStatus(triggerDevId: string) {
  if (!triggerDevId) return null;

  try {
    const run = await runs.retrieve(triggerDevId);
    return applyRunStatus(triggerDevId, run.status, run.error?.message);
  } catch {
    return null;
  }
}

export async function applyRunStatus(triggerDevId: string, runStatus: TriggerRunStatus, errorMessage?: string) {
  if (!triggerDevId) return null;

  try {
    const job = await prisma.job.findUnique({ where: { triggerDevId } });
    if (!job) return null;
    if (job.status !== "QUEUED" && job.status !== "RUNNING" && job.status !== "PENDING") return job;

    if (runStatus === "COMPLETED") {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "COMPLETED", progress: 100, completedAt: new Date(), currentStage: null },
      });
      await prisma.jobLog.create({
        data: { jobId: job.id, level: "INFO", message: "Run completed (synced from Trigger.dev)" },
      });
    } else if (runStatus === "FAILED") {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "FAILED", currentStage: null, progress: 0 },
      });
      await prisma.jobLog.create({
        data: {
          jobId: job.id,
          level: "ERROR",
          message: `Run failed: ${errorMessage || "Unknown error"}`,
        },
      });
    } else if (runStatus === "CANCELLED") {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "CANCELLED", currentStage: null, completedAt: new Date() },
      });
      await prisma.jobLog.create({
        data: { jobId: job.id, level: "WARN", message: "Run cancelled (synced from Trigger.dev)" },
      });
    } else if (runStatus === "EXPIRED") {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "FAILED", currentStage: null, progress: 0 },
      });
      await prisma.jobLog.create({
        data: { jobId: job.id, level: "ERROR", message: "Run expired in Trigger.dev queue" },
      });
    }

    return prisma.job.findUnique({ where: { id: job.id } });
  } catch {
    return null;
  }
}

export async function syncAllActiveJobs() {
  const activeJobs = await prisma.job.findMany({
    where: {
      status: { in: ["QUEUED", "RUNNING", "PENDING"] },
      triggerDevId: { not: null },
    },
    select: { id: true, triggerDevId: true },
  });

  const results = [];
  for (const job of activeJobs) {
    if (job.triggerDevId) {
      const updated = await syncRunStatus(job.triggerDevId);
      results.push({ id: job.id, triggerDevId: job.triggerDevId, synced: !!updated });
    }
  }
  return results;
}

export async function syncUserActiveJobs(userId: string) {
  const activeJobs = await prisma.job.findMany({
    where: {
      userId,
      status: { in: ["QUEUED", "RUNNING", "PENDING"] },
      triggerDevId: { not: null },
    },
    select: { id: true, triggerDevId: true },
  });

  const results = [];
  for (const job of activeJobs) {
    if (job.triggerDevId) {
      const updated = await syncRunStatus(job.triggerDevId);
      results.push({ id: job.id, triggerDevId: job.triggerDevId, synced: !!updated });
    }
  }
  return results;
}
