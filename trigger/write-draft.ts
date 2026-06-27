import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { OutlineOutput } from "./outline";

interface WriteDraftInput {
  jobId: string;
  topic: string;
  tone: string;
  length: string;
  outline: OutlineOutput;
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
  run: async ({ jobId, topic, tone, length, outline }: WriteDraftInput): Promise<WriteDraftOutput> => {
    logger.info("Starting draft", { jobId, topic, tone, length });

    const stageStart = Date.now();

    await prisma.jobStage.create({
      data: {
        jobId,
        name: "draft",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        currentStage: "draft",
        progress: 50,
      },
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const words = lengthWords[length] ?? lengthWords.medium;
      const sectionsMarkdown = outline.sections
        .map((section) => {
          const points = section.points.map((point) => `- ${point}`).join("\n");
          return `## ${section.heading}\n\n${points}`;
        })
        .join("\n\n");

      const draft = `# ${outline.title || topic}\n\n${outline.research.summary}\n\n${sectionsMarkdown}\n\n## Why It Matters\n\nThis ${tone} guide explores ${topic} in depth. Expect around ${words} words of actionable insight, real-world context, and clear next steps for your content strategy.\n\n${
        outline.research.sources.length > 0
          ? `## Sources\n\n${outline.research.sources.map((source) => `- ${source}`).join("\n")}`
          : ""
      }`;

      await prisma.job.update({
        where: { id: jobId },
        data: {
          draft,
          progress: 70,
        },
      });

      const output: WriteDraftOutput = { draft };

      await prisma.jobStage.updateMany({
        where: { jobId, name: "draft" },
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
        where: { jobId, name: "draft" },
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
