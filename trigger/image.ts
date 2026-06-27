import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import Replicate from "replicate";

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
      const replicateApiToken = process.env.REPLICATE_API_TOKEN;
      let imageUrl: string | null = null;

      if (replicateApiToken) {
        const replicate = new Replicate({
          auth: replicateApiToken,
        });

        const result = await replicate.run(
          "black-forest-labs/flux-schnell",
          {
            input: {
              prompt: `Professional cover image for an article about ${topic}, clean modern editorial style, no text`,
              aspect_ratio: "16:9",
              num_outputs: 1,
            },
          }
        );

        if (typeof result === "string") {
          imageUrl = result;
        } else if (Array.isArray(result) && result.length > 0) {
          const first = result[0];
          imageUrl = typeof first === "string" ? first : null;
        }

        logger.info("Replicate image generated", { jobId, imageUrl });
      } else {
        logger.warn("REPLICATE_API_TOKEN not set, skipping image generation", { jobId });
      }

      const output: ImageOutput = {
        imageUrl,
      };

      await prisma.job.update({
        where: { id: jobId },
        data: {
          imageUrl,
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
