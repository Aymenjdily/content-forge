import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import PptxGenJS from "pptxgenjs";

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

async function generatePdf(job: NonNullable<Awaited<ReturnType<typeof getJob>>>): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const seo = (job.seoMeta ?? {}) as { title?: string; metaDescription?: string; keywords?: string[] };
  const title = seo.title || job.topic;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 60;
  const margin = 60;
  const maxWidth = width - margin * 2;
  const lineHeight = 16;

  function drawText(text: string, options: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}) {
    const size = options.size || 12;
    const f = options.bold ? boldFont : font;
    const color = options.color || rgb(0.1, 0.1, 0.1);

    const words = text.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = f.widthOfTextAtSize(testLine, size);

      if (testWidth > maxWidth && line) {
        if (y < margin + lineHeight) {
          const newPage = pdfDoc.addPage([612, 792]);
          y = newPage.getSize().height - 60;
          newPage.drawText(line, { x: margin, y, size, font: f, color });
        } else {
          page.drawText(line, { x: margin, y, size, font: f, color });
        }
        y -= lineHeight * (size / 12) * 1.2;
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      if (y < margin + lineHeight) {
        const newPage = pdfDoc.addPage([612, 792]);
        y = newPage.getSize().height - 60;
        newPage.drawText(line, { x: margin, y, size, font: f, color });
      } else {
        page.drawText(line, { x: margin, y, size, font: f, color });
      }
      y -= lineHeight * (size / 12) * 1.2;
    }

    y -= 4;
  }

  drawText(title, { size: 22, bold: true });

  if (seo.metaDescription) {
    drawText(seo.metaDescription, { size: 11, color: rgb(0.4, 0.4, 0.4) });
  }

  if (seo.keywords?.length) {
    drawText(`Keywords: ${seo.keywords.join(", ")}`, { size: 10, color: rgb(0.5, 0.5, 0.5) });
  }

  y -= 10;

  const draftLines = (job.draft || "").split("\n");
  for (const rawLine of draftLines) {
    const line = rawLine.trim();
    if (!line) {
      y -= lineHeight;
      continue;
    }

    if (line.startsWith("# ")) {
      y -= 8;
      drawText(line.slice(2), { size: 18, bold: true });
      y -= 4;
    } else if (line.startsWith("## ")) {
      y -= 4;
      drawText(line.slice(3), { size: 14, bold: true });
      y -= 2;
    } else if (line.startsWith("- ")) {
      drawText(`• ${line.slice(2)}`, { size: 11 });
    } else {
      drawText(line, { size: 11 });
    }
  }

  return pdfDoc.save();
}

async function generatePptx(job: NonNullable<Awaited<ReturnType<typeof getJob>>>): Promise<Buffer> {
  const pres = new PptxGenJS();
  const seo = (job.seoMeta ?? {}) as { title?: string; metaDescription?: string; keywords?: string[] };
  const title = seo.title || job.topic;

  pres.layout = "LAYOUT_16x9";
  pres.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: "FFFFFF" },
  });

  const titleSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
  titleSlide.addText(title, { x: 0.5, y: 1.5, w: "90%", h: 1, fontSize: 32, bold: true, color: "111827" });
  if (seo.metaDescription) {
    titleSlide.addText(seo.metaDescription, { x: 0.5, y: 2.8, w: "90%", h: 1, fontSize: 14, color: "6B7280" });
  }
  if (seo.keywords?.length) {
    titleSlide.addText(seo.keywords.join(" • "), { x: 0.5, y: 4, w: "90%", h: 0.5, fontSize: 12, color: "9CA3AF" });
  }

  const draftLines = (job.draft || "").split("\n");
  let currentSlide: PptxGenJS.Slide | null = null;
  let currentBody: string[] = [];

  function flushBody() {
    if (currentSlide && currentBody.length > 0) {
      currentSlide.addText(currentBody.join("\n"), {
        x: 0.5,
        y: 1.2,
        w: "90%",
        h: 4.5,
        fontSize: 14,
        color: "374151",
        bullet: true,
      });
    }
    currentBody = [];
  }

  for (const rawLine of draftLines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("# ")) {
      flushBody();
      currentSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
      currentSlide.addText(line.slice(2), { x: 0.5, y: 0.5, w: "90%", h: 0.8, fontSize: 24, bold: true, color: "111827" });
    } else if (line.startsWith("## ")) {
      if (currentSlide) {
        currentBody.push(`• ${line.slice(3)}`);
      } else {
        currentSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
        currentSlide.addText(line.slice(3), { x: 0.5, y: 0.5, w: "90%", h: 0.8, fontSize: 20, bold: true, color: "111827" });
      }
    } else if (line.startsWith("- ")) {
      if (!currentSlide) {
        currentSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
      }
      currentBody.push(line.slice(2));
    } else {
      if (!currentSlide) {
        currentSlide = pres.addSlide({ masterName: "MASTER_SLIDE" });
      }
      currentBody.push(line);
    }
  }

  flushBody();

  const buffer = await pres.write({ outputType: "nodebuffer" });
  return buffer as Buffer;
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

  let content: string | Uint8Array | Buffer;
  let contentType: string;
  let extension: string;

  switch (format) {
    case "html":
      content = generateHtml(job);
      contentType = "text/html; charset=utf-8";
      extension = "html";
      break;
    case "pdf":
      content = Buffer.from(await generatePdf(job));
      contentType = "application/pdf";
      extension = "pdf";
      break;
    case "pptx":
      content = await generatePptx(job);
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      extension = "pptx";
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
  const body = typeof content === "string" ? content : new Blob([content as BlobPart]);

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
