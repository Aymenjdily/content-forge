import { logger, task } from "@trigger.dev/sdk/v3";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { resend, fromEmail, isResendEnabled } from "@/lib/email/resend";
import type { SeoOutput } from "./seo";

interface NotifyInput {
  jobId: string;
  userId: string;
  topic: string;
  draft: string;
  imageUrl?: string | null;
  seoMeta?: SeoOutput | null;
}

interface NotifyOutput {
  sent: boolean;
  reason?: string;
}

function buildEmailHtml(topic: string, draft: string, imageUrl?: string | null, seoMeta?: SeoOutput | null): string {
  const title = seoMeta?.title || topic;
  const keywords = seoMeta?.keywords?.join(", ") || "content strategy";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Content Forge job is ready</title>
</head>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Your content is ready 🎉</h1>
  <p style="font-size: 16px; color: #4b5563; margin-bottom: 24px;">
    Your Content Forge job <strong>${title}</strong> has completed. Here is a preview of what was generated.
  </p>

  ${imageUrl ? `<img src="${imageUrl}" alt="Cover image" style="width: 100%; border-radius: 12px; margin-bottom: 24px;" />` : ""}

  <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <h2 style="font-size: 18px; margin-top: 0;">SEO Metadata</h2>
    <p><strong>Title:</strong> ${seoMeta?.title || "—"}</p>
    <p><strong>Slug:</strong> ${seoMeta?.slug || "—"}</p>
    <p><strong>Meta description:</strong> ${seoMeta?.metaDescription || "—"}</p>
    <p><strong>Keywords:</strong> ${keywords}</p>
  </div>

  <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
    <h2 style="font-size: 18px; margin-top: 0;">Draft preview</h2>
    <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
      ${draft.slice(0, 1200).replace(/</g, "&lt;").replace(/>/g, "&gt;")}${draft.length > 1200 ? "…" : ""}
    </div>
  </div>

  <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
    Sent by Content Forge. Open your dashboard to view the full result.
  </p>
</body>
</html>
  `.trim();
}

export const notifyTask = task({
  id: "notify",
  run: async ({ jobId, userId, topic, draft, imageUrl, seoMeta }: NotifyInput): Promise<NotifyOutput> => {
    logger.info("Starting user notification", { jobId, userId });

    const stageStart = Date.now();

    await prisma.jobStage.create({
      data: {
        jobId,
        name: "notify",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: {
        currentStage: "notify",
        progress: 98,
      },
    });

    let sent = false;
    let reason: string | undefined;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.email) {
        reason = "User email not found";
        logger.warn(reason, { jobId, userId });
      } else if (!isResendEnabled()) {
        reason = "Resend not configured (RESEND_API_KEY or FROM_EMAIL missing)";
        logger.warn(reason, { jobId });
      } else {
        const html = buildEmailHtml(topic, draft, imageUrl, seoMeta ?? undefined);

        const result = await resend!.emails.send({
          from: fromEmail!,
          to: user.email,
          subject: `Your Content Forge job "${topic}" is ready`,
          html,
        });

        if (result.error) {
          reason = `Resend error: ${result.error.message}`;
          logger.error(reason, { jobId });
        } else {
          sent = true;
          logger.info("Email notification sent", { jobId, emailId: result.data?.id });
        }
      }
    } catch (error) {
      reason = error instanceof Error ? error.message : "Notification failed";
      logger.error(`Notification error: ${reason}`, { jobId });
    }

    const output: NotifyOutput = { sent, reason };

    await prisma.jobStage.updateMany({
      where: { jobId, name: "notify" },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        durationMs: Date.now() - stageStart,
        output: output as unknown as Prisma.InputJsonValue,
        error: reason ?? null,
      },
    });

    await prisma.jobLog.create({
      data: {
        jobId,
        level: sent ? "INFO" : "WARN",
        message: sent ? "Email notification sent" : `Email notification skipped: ${reason}`,
      },
    });

    logger.info("User notification stage completed", { jobId, sent });
    return output;
  },
});
