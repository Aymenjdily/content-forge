import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { JobStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { syncUserActiveJobs } from "@/lib/jobs/sync";

async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
  });
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await syncUserActiveJobs(dbUser.id);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  const where: {
    userId: string;
    status?: { in: JobStatus[] } | JobStatus;
    topic?: { contains: string; mode: "insensitive" };
  } = {
    userId: dbUser.id,
  };

  if (status && status !== "ALL") {
    if (status === "ACTIVE") {
      where.status = { in: [JobStatus.PENDING, JobStatus.QUEUED, JobStatus.RUNNING] };
    } else {
      where.status = status as JobStatus;
    }
  }

  if (search) {
    where.topic = { contains: search, mode: "insensitive" };
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        stages: { orderBy: { id: "asc" } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
