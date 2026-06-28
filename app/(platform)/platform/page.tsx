import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { DashboardView } from "@/components/platform/dashboard-view";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  const stats = userId
    ? await prisma.job.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      })
    : [];

  const total = stats.reduce((acc, s) => acc + s._count.status, 0);
  const inProgress = stats.find((s) => s.status === "RUNNING" || s.status === "QUEUED")?._count.status ?? 0;
  const completed = stats.find((s) => s.status === "COMPLETED")?._count.status ?? 0;
  const failed = stats.find((s) => s.status === "FAILED")?._count.status ?? 0;

  const userName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "";

  return <DashboardView userName={userName} stats={{ total, inProgress, completed, failed }} />;
}
