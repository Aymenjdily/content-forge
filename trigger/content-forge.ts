import { logger, task } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { researchTask } from "./research";
import { outlineTask } from "./outline";
import { writeDraftTask } from "./write-draft";
import { imageTask } from "./image";
import { seoTask } from "./seo";
import { scheduleTask } from "./schedule";
import { notifyTask } from "./notify";

interface ContentForgeInput {
  jobId: string;
  userId: string;
  topic: string;
  sourceUrl?: string;
  tone: string;
  length: string;
  platforms: string[];
}

export const contentForgeTask = task({
  id: "content-forge",
  run: async ({ jobId, userId, topic, sourceUrl, tone, length, platforms }: ContentForgeInput) => {
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

      const outlineResult = await outlineTask.triggerAndWait({
        jobId,
        topic,
        research: researchResult.output,
      });
      if (!outlineResult.ok) {
        throw new Error("Outline failed");
      }

      const draftResult = await writeDraftTask.triggerAndWait({
        jobId,
        topic,
        tone,
        length,
        outline: outlineResult.output,
      });

      if (!draftResult.ok) {
        throw new Error("Draft failed");
      }

      const imageResult = await imageTask.triggerAndWait({ jobId, topic });

      if (!imageResult.ok) {
        logger.warn("Image generation failed, continuing without cover image", { jobId });
      }

      const seoResult = await seoTask.triggerAndWait({
        jobId,
        topic,
        draft: draftResult.output.draft,
      });
      if (!seoResult.ok) {
        throw new Error("SEO optimization failed");
      }

      const scheduleResult = await scheduleTask.triggerAndWait({
        jobId,
        topic,
        platforms,
      });
      if (!scheduleResult.ok) {
        throw new Error("Scheduling failed");
      }

      const notifyResult = await notifyTask.triggerAndWait({ jobId, userId });
      if (!notifyResult.ok) {
        throw new Error("Notification failed");
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

      await prisma.jobLog.create({
        data: {
          jobId,
          level: "INFO",
          message: "Pipeline completed successfully",
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
