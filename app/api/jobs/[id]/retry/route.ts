import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { contentForgeTask } from "@/trigger/content-forge";

async function authorizeJob(id: string) {
  const { userId } = await auth();

  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    return { error: NextResponse.json({ error: "Email not found" }, { status: 404 }) };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }

  if (job.userId !== dbUser.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { job, dbUser };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await authorizeJob(id);

  if (result.error) return result.error;

  const { job } = result;
  const config = (job.config as { tone?: string; length?: string }) ?? {};

  await prisma.$transaction([
    prisma.jobStage.deleteMany({ where: { jobId: id } }),
    prisma.job.update({
      where: { id },
      data: {
        status: "QUEUED",
        progress: 0,
        currentStage: null,
        triggerDevId: null,
        draft: null,
        research: Prisma.JsonNull,
        outline: Prisma.JsonNull,
        imageUrl: null,
        seoMeta: Prisma.JsonNull,
        scheduledPosts: Prisma.JsonNull,
        startedAt: null,
        completedAt: null,
      },
    }),
    prisma.jobLog.create({
      data: {
        jobId: id,
        level: "INFO",
        message: "Job retried by user",
      },
    }),
  ]);

  let triggerRun: { id: string } | undefined;
  try {
    triggerRun = await contentForgeTask.trigger({
      jobId: id,
      topic: job.topic,
      sourceUrl: job.sourceUrl || undefined,
      tone: config.tone || "professional",
      length: config.length || "medium",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retry job";

    await prisma.job.update({
      where: { id },
      data: { status: "FAILED", progress: 0 },
    });

    await prisma.jobLog.create({
      data: {
        jobId: id,
        level: "ERROR",
        message,
      },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (triggerRun?.id) {
    await prisma.job.update({
      where: { id },
      data: { triggerDevId: triggerRun.id },
    });
  }

  return NextResponse.json({ success: true });
}
