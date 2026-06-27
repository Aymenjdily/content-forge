import { NextResponse } from "next/server";
import { syncAllActiveJobs } from "@/lib/jobs/sync";

export async function GET() {
  const results = await syncAllActiveJobs();
  return NextResponse.json({ synced: results.filter((r) => r.synced).length, results });
}
