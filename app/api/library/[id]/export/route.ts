import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface ExportParams {
  params: Promise<{ id: string }>;
}

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function draftToHtml(draft: string): string {
  return draft
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
      }
      if (trimmed.startsWith("## ")) {
        return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      }
      if (trimmed.startsWith("- ")) {
        return `<li>${escapeHtml(trimmed.slice(2))}</li>`;
      }
      if (trimmed === "") {
        return "<br />";
      }
      return `<p>${escapeHtml(trimmed)}</p>`;
    })
    .join("\n");
}

function generateMarkdown(job: NonNullable<Awaited<ReturnType<typeof getJob>>>): string {
  const seo = (job.seoMeta ?? {}) as { title?: string; slug?: string; metaDescription?: string; keywords?: string[] };
  const title = seo.title || job.topic;
  const keywords = seo.keywords?.join(", ") || "";

  const frontmatter = [
    "---",
    `title: "${title.replace(/"/g, '\\"')}"`,
    `slug: ${seo.slug || ""}`,
    `description: "${(seo.metaDescription || "").replace(/"/g, '\\"')}"`,
    `keywords: "${keywords}"`,
    `createdAt: ${job.createdAt.toISOString()}`,
    `status: ${job.status}`,
    "---",
    "",
  ].join("\n");

  return frontmatter + (job.draft || "");
}

function generateHtml(job: NonNullable<Awaited<ReturnType<typeof getJob>>>): string {
  const seo = (job.seoMeta ?? {}) as { title?: string; slug?: string; metaDescription?: string; keywords?: string[] };
  const title = seo.title || job.topic;
  const keywords = seo.keywords?.join(", ") || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(seo.metaDescription || "")}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; color: #1f2937; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 0.75rem; }
    p { margin: 1rem 0; }
    li { margin: 0.25rem 0; }
    img { max-width: 100%; border-radius: 12px; margin: 1.5rem 0; }
  </style>
</head>
<body>
  ${job.imageUrl ? `<img src="${escapeHtml(job.imageUrl)}" alt="Cover image" />` : ""}
  ${draftToHtml(job.draft || "")}
</body>
</html>`;
}

async function getJob(id: string, userId: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      stages: { orderBy: { id: "asc" } },
      logs: { orderBy: { id: "asc" } },
    },
  });

  if (!job || job.userId !== userId) {
    return null;
  }

  return job;
}

export async function GET(request: Request, { params }: ExportParams) {
  const { id } = await params;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const job = await getJob(id, dbUser.id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "markdown";

  const seo = (job.seoMeta ?? {}) as { title?: string; slug?: string };
  const filenameBase = (seo.slug || job.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")).slice(0, 60);

  let content: string;
  let contentType: string;
  let extension: string;

  switch (format) {
    case "html":
      content = generateHtml(job);
      contentType = "text/html; charset=utf-8";
      extension = "html";
      break;
    case "json":
      content = JSON.stringify(
        {
          id: job.id,
          topic: job.topic,
          sourceUrl: job.sourceUrl,
          config: job.config,
          status: job.status,
          progress: job.progress,
          research: job.research,
          outline: job.outline,
          draft: job.draft,
          imageUrl: job.imageUrl,
          seoMeta: job.seoMeta,
          scheduledPosts: job.scheduledPosts,
          stages: job.stages,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
        },
        null,
        2
      );
      contentType = "application/json; charset=utf-8";
      extension = "json";
      break;
    case "markdown":
    default:
      content = generateMarkdown(job);
      contentType = "text/markdown; charset=utf-8";
      extension = "md";
      break;
  }

  const filename = `${filenameBase || "content"}.${extension}`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
