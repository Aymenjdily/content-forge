import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface ResearchOutput {
  summary: string;
  keyPoints: string[];
  sources: string[];
}

interface OutlineInput {
  jobId: string;
  topic: string;
  research: ResearchOutput;
}

interface OutlineSection {
  heading: string;
  points: string[];
}

export interface OutlineOutput {
  title: string;
  sections: OutlineSection[];
  research: ResearchOutput;
}

export const outlineTask = task({
  id: "outline",
  run: async ({ jobId, topic, research }: OutlineInput): Promise<OutlineOutput> => {
    logger.info("Starting outline", { jobId, topic });

    const stageStart = Date.now();

    await prisma.jobStage.create({
      data: {
        jobId,
        name: "outline",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        currentStage: "outline",
        progress: 30,
      },
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const output: OutlineOutput = {
        title: topic,
        sections: [
          {
            heading: "Introduction",
            points: ["Hook the reader with the core problem or opportunity.", "Introduce the topic and why it matters."],
          },
          {
            heading: "Key Insights",
            points: research.keyPoints,
          },
          {
            heading: "Practical Application",
            points: ["Share actionable steps or examples.", "Connect insights to real-world outcomes."],
          },
          {
            heading: "Conclusion",
            points: ["Summarize the main takeaways.", "Provide a clear next step for the reader."],
          },
        ],
        research,
      };

      await prisma.job.update({
        where: { id: jobId },
        data: {
          outline: output as unknown as Prisma.InputJsonValue,
          progress: 45,
        },
      });

      await prisma.jobStage.updateMany({
        where: { jobId, name: "outline" },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - stageStart,
          output: output as unknown as Prisma.InputJsonValue,
        },
      });

      logger.info("Outline completed", { jobId });
      return output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Outline failed";

      await prisma.jobStage.updateMany({
        where: { jobId, name: "outline" },
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
