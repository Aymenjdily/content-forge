import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncRunStatus } from "@/lib/jobs/sync";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await authorizeJob(id);

  if (result.error) return result.error;
  if (!result.job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (result.job.triggerDevId) {
    await syncRunStatus(result.job.triggerDevId);
  }

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      stages: { orderBy: { id: "asc" } },
      logs: { orderBy: { id: "asc" } },
    },
  });

  return NextResponse.json(job);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await authorizeJob(id);

  if (result.error) return result.error;

  await prisma.$transaction([
    prisma.jobLog.deleteMany({ where: { jobId: id } }),
    prisma.jobStage.deleteMany({ where: { jobId: id } }),
    prisma.job.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
