import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface ResearchInput {
  jobId: string;
  topic: string;
  sourceUrl?: string;
}

interface ResearchOutput {
  summary: string;
  keyPoints: string[];
  sources: string[];
}

export const researchTask = task({
  id: "research",
  run: async ({ jobId, topic, sourceUrl }: ResearchInput): Promise<ResearchOutput> => {
    logger.info("Starting research", { jobId, topic, sourceUrl });

    const stageStart = Date.now();

    await prisma.jobStage.create({
      data: {
        jobId,
        name: "research",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "RUNNING",
        currentStage: "research",
        progress: 20,
        startedAt: new Date(),
      },
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const output: ResearchOutput = {
        summary: `Research summary for "${topic}".`,
        keyPoints: [
          `${topic} is a rapidly evolving area.`,
          "Audiences value practical examples and clear takeaways.",
          "Competitors focus on listicles and shallow guides.",
        ],
        sources: sourceUrl ? [sourceUrl] : [],
      };

      await prisma.job.update({
        where: { id: jobId },
        data: {
          research: output as unknown as Prisma.InputJsonValue,
          progress: 40,
        },
      });

      await prisma.jobStage.updateMany({
        where: { jobId, name: "research" },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - stageStart,
          output: output as unknown as Prisma.InputJsonValue,
        },
      });

      logger.info("Research completed", { jobId });
      return output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Research failed";

      await prisma.jobStage.updateMany({
        where: { jobId, name: "research" },
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
