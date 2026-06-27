import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface ScheduleInput {
  jobId: string;
  topic: string;
  platforms: string[];
}

interface ScheduledPost {
  platform: string;
  scheduledAt: string;
  status: "scheduled" | "pending";
}

export interface ScheduleOutput {
  posts: ScheduledPost[];
}

export const scheduleTask = task({
  id: "schedule",
  run: async ({ jobId, topic, platforms }: ScheduleInput): Promise<ScheduleOutput> => {
    logger.info("Starting post scheduling", { jobId, topic, platforms });

    const stageStart = Date.now();

    await prisma.jobStage.create({
      data: {
        jobId,
        name: "schedule",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        currentStage: "schedule",
        progress: 90,
      },
    });

    try {
      // TODO: integrate with social APIs or schedule queue
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const targetPlatforms = platforms.length > 0 ? platforms : ["blog"];
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const output: ScheduleOutput = {
        posts: targetPlatforms.map((platform) => ({
          platform,
          scheduledAt,
          status: "scheduled" as const,
        })),
      };

      await prisma.job.update({
        where: { id: jobId },
        data: {
          scheduledPosts: output as unknown as Prisma.InputJsonValue,
          progress: 95,
        },
      });

      await prisma.jobStage.updateMany({
        where: { jobId, name: "schedule" },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - stageStart,
          output: output as unknown as Prisma.InputJsonValue,
        },
      });

      logger.info("Post scheduling completed", { jobId });
      return output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Post scheduling failed";

      await prisma.jobStage.updateMany({
        where: { jobId, name: "schedule" },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          durationMs: Date.now() - stageStart,
          error: message,
        },
      });

      throw error;
    }
  },
});
