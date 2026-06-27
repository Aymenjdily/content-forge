import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface NotifyInput {
  jobId: string;
  userId: string;
}

interface NotifyOutput {
  sent: boolean;
}

export const notifyTask = task({
  id: "notify",
  run: async ({ jobId, userId }: NotifyInput): Promise<NotifyOutput> => {
    logger.info("Starting user notification", { jobId, userId });

    const stageStart = Date.now();

    await prisma.jobStage.create({
      data: {
        jobId,
        name: "notify",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        currentStage: "notify",
        progress: 98,
      },
    });

    try {
      // TODO: integrate Resend for email notification
      await new Promise((resolve) => setTimeout(resolve, 800));

      const output: NotifyOutput = {
        sent: false,
      };

      await prisma.jobStage.updateMany({
        where: { jobId, name: "notify" },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - stageStart,
          output: output as unknown as Prisma.InputJsonValue,
        },
      });

      logger.info("User notification completed", { jobId });
      return output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "User notification failed";

      await prisma.jobStage.updateMany({
        where: { jobId, name: "notify" },
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
