import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface WriteDraftInput {
  jobId: string;
  topic: string;
  tone: string;
  length: string;
  research: {
    summary: string;
    keyPoints: string[];
    sources: string[];
  };
}

interface WriteDraftOutput {
  draft: string;
}

const lengthWords: Record<string, number> = {
  short: 300,
  medium: 600,
  long: 1000,
};

export const writeDraftTask = task({
  id: "write-draft",
  run: async ({ jobId, topic, tone, length, research }: WriteDraftInput): Promise<WriteDraftOutput> => {
    logger.info("Starting draft", { jobId, topic, tone, length });

    const stageStart = Date.now();

    await prisma.jobStage.create({
      data: {
        jobId,
        name: "writeDraft",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        currentStage: "writeDraft",
        progress: 60,
      },
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const words = lengthWords[length] ?? lengthWords.medium;

      const draft = `# ${topic}\n\n${research.summary}\n\n## Key Takeaways\n\n${research.keyPoints
        .map((point) => `- ${point}`)
        .join("\n")}\n\n## Why It Matters\n\nThis ${tone} guide explores ${topic} in depth. Expect around ${words} words of actionable insight, real-world context, and clear next steps for your content strategy.\n\n${
        research.sources.length > 0
          ? `## Sources\n\n${research.sources.map((source) => `- ${source}`).join("\n")}`
          : ""
      }`;

      await prisma.job.update({
        where: { id: jobId },
        data: {
          draft,
          progress: 90,
        },
      });

      const output: WriteDraftOutput = { draft };

      await prisma.jobStage.updateMany({
        where: { jobId, name: "writeDraft" },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - stageStart,
          output: output as unknown as Prisma.InputJsonValue,
        },
      });

      logger.info("Draft completed", { jobId });
      return output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Draft failed";

      await prisma.jobStage.updateMany({
        where: { jobId, name: "writeDraft" },
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
