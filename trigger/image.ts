import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

interface ImageInput {
  jobId: string;
  topic: string;
}

interface ImageOutput {
  imageUrl: string | null;
}

export const imageTask = task({
  id: "image",
  run: async ({ jobId, topic }: ImageInput): Promise<ImageOutput> => {
    logger.info("Starting image generation", { jobId, topic });

    const stageStart = Date.now();

    await prisma.jobStage.create({
      data: {
        jobId,
        name: "image",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        currentStage: "image",
        progress: 55,
      },
    });

    try {
      // TODO: integrate Replicate or DALL-E here
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const output: ImageOutput = {
        imageUrl: null,
      };

      await prisma.job.update({
        where: { id: jobId },
        data: {
          imageUrl: output.imageUrl,
          progress: 65,
        },
      });

      await prisma.jobStage.updateMany({
        where: { jobId, name: "image" },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: Date.now() - stageStart,
          output: output as unknown as Prisma.InputJsonValue,
        },
      });

      logger.info("Image generation completed", { jobId });
      return output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Image generation failed";

      await prisma.jobStage.updateMany({
        where: { jobId, name: "image" },
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
