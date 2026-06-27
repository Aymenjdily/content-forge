import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface SeoInput {
  jobId: string;
  topic: string;
  draft: string;
}

export interface SeoOutput {
  title: string;
  metaDescription: string;
  keywords: string[];
  slug: string;
}

export const seoTask = task({
  id: "seo",
  run: async ({ jobId, topic, draft }: SeoInput): Promise<SeoOutput> => {
    logger.info("Starting SEO optimization", { jobId, topic });

    const stageStart = Date.now();

    await prisma.jobStage.create({
      data: {
        jobId,
        name: "seo",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        currentStage: "seo",
        progress: 75,
      },
    });

    try {
      // TODO: integrate AI for real SEO optimization
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const slug = topic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const output: SeoOutput = {
        title: `${topic}: A Complete Guide`,
        metaDescription: `Learn everything about ${topic}. Actionable insights, practical examples, and clear next steps.`,
        keywords: [topic, "guide", "content strategy", "best practices"],
        slug,
      };

      await prisma.job.update({
        where: { id: jobId },
        data: {
          seoMeta: output as unknown as Prisma.InputJsonValue,
          progress: 80,
        },
      });

      await prisma.jobStage.updateMany({
        where: { jobId, name: "seo" },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - stageStart,
          output: output as unknown as Prisma.InputJsonValue,
        },
      });

      logger.info("SEO optimization completed", { jobId });
      return output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "SEO optimization failed";

      await prisma.jobStage.updateMany({
        where: { jobId, name: "seo" },
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
