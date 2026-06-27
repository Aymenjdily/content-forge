import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  if (job.status !== "QUEUED" && job.status !== "RUNNING" && job.status !== "PENDING") {
    return NextResponse.json({ error: "Job cannot be cancelled" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.jobStage.updateMany({
      where: { jobId: id, status: { in: ["PENDING", "RUNNING"] } },
      data: { status: "FAILED", error: "Cancelled by user" },
    }),
    prisma.job.update({
      where: { id },
      data: { status: "CANCELLED", progress: 0, currentStage: null, completedAt: new Date() },
    }),
    prisma.jobLog.create({
      data: {
        jobId: id,
        level: "WARN",
        message: "Job cancelled by user",
      },
    }),
  ]);

  if (job.triggerDevId) {
    try {
      const apiUrl = process.env.TRIGGER_API_URL || "https://api.trigger.dev";
      await fetch(`${apiUrl}/api/v1/runs/${job.triggerDevId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.TRIGGER_SECRET_KEY}` },
      });
    } catch {
      // Best-effort: ignore API cancel errors
    }
  }

  return NextResponse.json({ success: true });
}
