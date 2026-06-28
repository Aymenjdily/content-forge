"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { schedules } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export interface CronJobConfig {
  tone: string;
  length: string;
  platforms: string[];
}

export interface CronJob {
  id: string;
  userId: string;
  topic: string;
  sourceUrl: string | null;
  config: CronJobConfig;
  cronExpression: string;
  timezone: string;
  triggerScheduleId: string | null;
  isActive: boolean;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  createdAt: Date;
}

const validTones = ["professional", "casual", "witty", "educational"];
const validLengths = ["short", "medium", "long"];
const validPlatforms = ["blog", "linkedin", "twitter"];

async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const image = clerkUser.imageUrl || null;

  return prisma.user.upsert({
    where: { email },
    create: { email, name, image },
    update: { name, image },
  });
}

function normalizeConfig(config: unknown): CronJobConfig {
  const raw = (config ?? {}) as Partial<CronJobConfig>;

  const tone = validTones.includes(raw.tone || "") ? raw.tone! : "professional";
  const length = validLengths.includes(raw.length || "") ? raw.length! : "medium";
  const platforms = Array.isArray(raw.platforms)
    ? raw.platforms.filter((p) => validPlatforms.includes(p))
    : ["blog"];

  return {
    tone,
    length,
    platforms: platforms.length > 0 ? platforms : ["blog"],
  };
}

export async function getCronJobs(): Promise<CronJob[]> {
  const user = await getDbUser();
  if (!user) return [];

  const jobs = await prisma.cronJob.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return jobs.map((job) => ({
    ...job,
    config: normalizeConfig(job.config),
  }));
}

export interface CreateCronJobState {
  error?: string;
  success?: boolean;
  cronJob?: CronJob;
}

function isValidCronExpression(expression: string): boolean {
  // Lightweight sanity check: 5 space-separated fields.
  // Trigger.dev validates the actual expression server-side.
  const parts = expression.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 6;
}

export async function createCronJob(_prevState: CreateCronJobState, formData: FormData): Promise<CreateCronJobState> {
  const user = await getDbUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const topic = formData.get("topic")?.toString().trim();
  const sourceUrl = formData.get("sourceUrl")?.toString().trim() || null;
  const cronExpression = formData.get("cronExpression")?.toString().trim();
  const timezone = formData.get("timezone")?.toString().trim() || "UTC";
  const tone = formData.get("tone")?.toString() || "professional";
  const length = formData.get("length")?.toString() || "medium";
  const platformsRaw = formData.getAll("platforms");

  if (!topic || topic.length < 3) {
    return { error: "Topic is required and must be at least 3 characters." };
  }

  if (!cronExpression || !isValidCronExpression(cronExpression)) {
    return { error: "A valid CRON expression with 5 fields is required." };
  }

  const config = normalizeConfig({ tone, length, platforms: platformsRaw.map((p) => p.toString()) });

  const cronJob = await prisma.cronJob.create({
    data: {
      userId: user.id,
      topic,
      sourceUrl,
      config: config as unknown as Prisma.InputJsonValue,
      cronExpression,
      timezone,
    },
  });

  try {
    const schedule = await schedules.create({
      task: "cron-runner",
      cron: cronExpression,
      timezone,
      deduplicationKey: cronJob.id,
      externalId: cronJob.id,
    });

    await prisma.cronJob.update({
      where: { id: cronJob.id },
      data: { triggerScheduleId: schedule.id },
    });

    const updated = await prisma.cronJob.findUniqueOrThrow({
      where: { id: cronJob.id },
    });

    return {
      success: true,
      cronJob: {
        ...updated,
        config: normalizeConfig(updated.config),
      },
    };
  } catch (error) {
    // Roll back the DB row if schedule creation fails.
    await prisma.cronJob.delete({ where: { id: cronJob.id } }).catch(() => {});

    const message = error instanceof Error ? error.message : "Failed to create schedule";
    return { error: message };
  }
}

export async function deleteCronJob(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getDbUser();
  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const cronJob = await prisma.cronJob.findUnique({
    where: { id },
  });

  if (!cronJob || cronJob.userId !== user.id) {
    return { success: false, error: "Cron job not found." };
  }

  if (cronJob.triggerScheduleId) {
    try {
      await schedules.del(cronJob.triggerScheduleId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete schedule";
      return { success: false, error: message };
    }
  }

  await prisma.cronJob.delete({
    where: { id },
  });

  return { success: true };
}

export async function toggleCronJob(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const user = await getDbUser();
  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  const cronJob = await prisma.cronJob.findUnique({
    where: { id },
  });

  if (!cronJob || cronJob.userId !== user.id) {
    return { success: false, error: "Cron job not found." };
  }

  if (cronJob.triggerScheduleId) {
    try {
      if (isActive) {
        await schedules.activate(cronJob.triggerScheduleId);
      } else {
        await schedules.deactivate(cronJob.triggerScheduleId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update schedule";
      return { success: false, error: message };
    }
  }

  await prisma.cronJob.update({
    where: { id },
    data: { isActive },
  });

  return { success: true };
}
