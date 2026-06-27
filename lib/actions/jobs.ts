"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { contentForgeTask } from "@/trigger/content-forge";
import { prisma } from "@/lib/prisma";

export interface CreateJobState {
  error?: string;
  success?: boolean;
  jobId?: string;
}

export async function createJob(_prevState: CreateJobState, formData: FormData): Promise<CreateJobState> {
  const { userId } = await auth();

  if (!userId) {
    return { error: "You must be signed in to create a job." };
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { error: "Unable to load user." };
  }

  const topic = formData.get("topic")?.toString().trim();
  const sourceUrl = formData.get("sourceUrl")?.toString().trim();
  const tone = formData.get("tone")?.toString() || "professional";
  const length = formData.get("length")?.toString() || "medium";
  const platformsRaw = formData.getAll("platforms");
  const platforms = platformsRaw.map((p) => p.toString()).filter(Boolean);

  if (!topic || topic.length < 3) {
    return { error: "Topic is required and must be at least 3 characters." };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const image = clerkUser.imageUrl || null;

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      image,
    },
    update: {
      name,
      image,
    },
  });

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      topic,
      sourceUrl: sourceUrl || null,
      config: {
        tone,
        length,
        platforms,
      },
      status: "QUEUED",
      progress: 0,
    },
  });

  let triggerRun: { id: string } | undefined;
  try {
    triggerRun = await contentForgeTask.trigger({
      jobId: job.id,
      topic,
      sourceUrl: sourceUrl || undefined,
      tone,
      length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start pipeline";

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        progress: 0,
      },
    });

    await prisma.jobLog.create({
      data: {
        jobId: job.id,
        level: "ERROR",
        message,
      },
    });

    return { error: message, jobId: job.id };
  }

  if (triggerRun?.id) {
    await prisma.job.update({
      where: { id: job.id },
      data: { triggerDevId: triggerRun.id },
    });
  }

  return { success: true, jobId: job.id };
}
