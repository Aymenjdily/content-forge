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

    const replicateApiToken = process.env.REPLICATE_API_TOKEN;
    let imageUrl: string | null = null;
    let imageError: string | null = null;

    try {
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
        imageError = "REPLICATE_API_TOKEN not set";
        logger.warn(imageError, { jobId });
      }
    } catch (error) {
      imageError = error instanceof Error ? error.message : "Image generation failed";
      logger.error(imageError, { jobId });
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
        status: imageError ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
        durationMs: Date.now() - stageStart,
        output: output as unknown as Prisma.InputJsonValue,
        error: imageError,
      },
    });

    await prisma.jobLog.create({
      data: {
        jobId,
        level: imageError ? "ERROR" : "INFO",
        message: imageError || "Image generation completed",
      },
    });

    logger.info("Image stage finished", { jobId, success: !imageError });
    return output;
  },
});
