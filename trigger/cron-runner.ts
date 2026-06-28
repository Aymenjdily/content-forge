import { logger, task } from "@trigger.dev/sdk/v3";
import type { ScheduledTaskPayload } from "@trigger.dev/core/v3";
import { prisma } from "@/lib/prisma";
import { contentForgeTask } from "./content-forge";

function normalizeConfig(config: unknown): { tone: string; length: string; platforms: string[] } {
  const raw = (config ?? {}) as Record<string, unknown>;
  const tone = typeof raw.tone === "string" ? raw.tone : "professional";
  const length = typeof raw.length === "string" ? raw.length : "medium";
  const platforms = Array.isArray(raw.platforms)
    ? raw.platforms.filter((p): p is string => typeof p === "string")
    : ["blog"];
  return { tone, length, platforms: platforms.length > 0 ? platforms : ["blog"] };
}

export const cronRunnerTask = task({
  id: "cron-runner",
  run: async (payload: ScheduledTaskPayload) => {
    const cronJobId = payload.externalId;

    if (!cronJobId) {
      logger.warn("No externalId in scheduled payload, skipping");
      return { skipped: true, reason: "missing_external_id" };
    }

    logger.info("Running scheduled content job", { cronJobId });

    const cronJob = await prisma.cronJob.findUnique({
      where: { id: cronJobId },
    });

    if (!cronJob) {
      logger.warn("Cron job not found, skipping", { cronJobId });
      return { skipped: true, reason: "cron_job_not_found" };
    }

    if (!cronJob.isActive) {
      logger.info("Cron job is inactive, skipping", { cronJobId });
      return { skipped: true, reason: "inactive" };
    }

    const { tone, length, platforms } = normalizeConfig(cronJob.config);
    const userId = cronJob.userId;
    const topic = cronJob.topic;
    const sourceUrl = cronJob.sourceUrl;

    const job = await prisma.job.create({
      data: {
        userId,
        topic,
        sourceUrl: sourceUrl || null,
        config: {
          tone,
          length,
          platforms,
        },
        status: "QUEUED",
        progress: 0,
      },
    });

    let triggerRun: { id: string } | undefined;
    try {
      triggerRun = await contentForgeTask.trigger({
        jobId: job.id,
        userId,
        topic,
        sourceUrl: sourceUrl || undefined,
        tone,
        length,
        platforms,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start pipeline";

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          progress: 0,
        },
      });

      await prisma.jobLog.create({
        data: {
          jobId: job.id,
          level: "ERROR",
          message,
        },
      });

      throw error;
    }

    if (triggerRun?.id) {
      await prisma.job.update({
        where: { id: job.id },
        data: { triggerDevId: triggerRun.id },
      });
    }

    const now = new Date();
    await prisma.cronJob.update({
      where: { id: cronJobId },
      data: {
        lastRunAt: now,
        // nextRunAt is managed by Trigger.dev, but we can approximate it later if needed.
      },
    });

    logger.info("Scheduled content job started", { cronJobId, jobId: job.id });

    return { success: true, jobId: job.id };
  },
});
