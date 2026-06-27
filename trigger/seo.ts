import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { openai, isOpenAIEnabled } from "@/lib/ai/openai";

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

function generateFallbackSeo(topic: string): SeoOutput {
  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    title: `${topic}: A Complete Guide`,
    metaDescription: `Learn everything about ${topic}. Actionable insights, practical examples, and clear next steps.`,
    keywords: [topic, "guide", "content strategy", "best practices"],
    slug,
  };
}

async function generateSeoWithAI(topic: string, draft: string): Promise<SeoOutput> {
  if (!openai) {
    throw new Error("OpenAI client is not configured");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an SEO expert. Generate search-optimized metadata for a piece of content. Return only valid JSON with keys: title (string, max 60 chars), metaDescription (string, max 160 chars), keywords (array of 5-8 strings), slug (URL-safe string, lowercase, hyphenated, no special chars).",
      },
      {
        role: "user",
        content: `Topic: ${topic}\n\nDraft:\n${draft.slice(0, 4000)}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned empty SEO response");
  }

  const parsed = JSON.parse(raw) as Partial<SeoOutput>;

  if (!parsed.title || !parsed.metaDescription || !Array.isArray(parsed.keywords) || !parsed.slug) {
    throw new Error("OpenAI SEO response missing required fields");
  }

  return {
    title: parsed.title.slice(0, 60),
    metaDescription: parsed.metaDescription.slice(0, 160),
    keywords: parsed.keywords.filter((k) => typeof k === "string").slice(0, 8),
    slug: parsed.slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  };
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
      let output: SeoOutput;

      if (isOpenAIEnabled()) {
        try {
          output = await generateSeoWithAI(topic, draft);
          logger.info("SEO optimized with OpenAI", { jobId });
        } catch (aiError) {
          const message = aiError instanceof Error ? aiError.message : "OpenAI SEO failed";
          logger.warn(`Falling back to static SEO metadata: ${message}`, { jobId });
          output = generateFallbackSeo(topic);
        }
      } else {
        logger.warn("OPENAI_API_KEY not set, using fallback SEO metadata", { jobId });
        output = generateFallbackSeo(topic);
      }

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
