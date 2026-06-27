import { logger, task } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { researchTask } from "./research";
import { writeDraftTask } from "./write-draft";

interface ContentForgeInput {
  jobId: string;
  topic: string;
  sourceUrl?: string;
  tone: string;
  length: string;
}

export const contentForgeTask = task({
  id: "content-forge",
  run: async ({ jobId, topic, sourceUrl, tone, length }: ContentForgeInput) => {
    logger.info("Starting content forge pipeline", { jobId, topic });

    try {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "RUNNING",
          currentStage: "research",
          progress: 10,
          startedAt: new Date(),
        },
      });

      await prisma.jobLog.create({
        data: {
          jobId,
          level: "INFO",
          message: "Pipeline started",
        },
      });

      const researchResult = await researchTask.triggerAndWait({ jobId, topic, sourceUrl });

      if (!researchResult.ok) {
        throw new Error("Research failed");
      }

      const draftResult = await writeDraftTask.triggerAndWait({
        jobId,
        topic,
        tone,
        length,
        research: researchResult.output,
      });

      if (!draftResult.ok) {
        throw new Error("Draft failed");
      }

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          currentStage: null,
          progress: 100,
          completedAt: new Date(),
        },
      });

      logger.info("Content forge pipeline completed", { jobId });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pipeline failed";

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          currentStage: null,
          progress: 0,
        },
      });

      await prisma.jobLog.create({
        data: {
          jobId,
          level: "ERROR",
          message,
        },
      });

      throw error;
    }
  },
});
