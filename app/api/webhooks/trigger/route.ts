import { NextResponse } from "next/server";
import { applyRunStatus } from "@/lib/jobs/sync";

interface TriggerWebhookBody {
  event?: string;
  run?: {
    id?: string;
    status?: string;
    payload?: {
      jobId?: string;
      [key: string]: unknown;
    };
    error?: {
      message?: string;
    };
  };
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-trigger-webhook-secret");
  const expected = process.env.TRIGGER_WEBHOOK_SECRET;

  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as TriggerWebhookBody;
  const triggerDevId = body?.run?.id;
  const status = body?.run?.status;
  const errorMessage = body?.run?.error?.message;

  if (!triggerDevId || !status) {
    return NextResponse.json({ error: "Missing run id or status" }, { status: 400 });
  }

  const job = await applyRunStatus(triggerDevId, status, errorMessage);

  return NextResponse.json({ success: true, synced: !!job });
}
