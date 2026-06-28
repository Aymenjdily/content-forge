import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";
import { marked } from "marked";
import Link from "next/link";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [{ slug: "building-ai-content-pipeline" }];
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  if (slug !== "building-ai-content-pipeline") {
    return { title: "Not Found" };
  }
  return {
    title: "Building an AI Content Pipeline with Next.js and Trigger.dev | Content Forge",
    description:
      "How I automated topic research, outlining, drafting, SEO, image generation, and publishing into a single durable workflow.",
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  if (slug !== "building-ai-content-pipeline") {
    notFound();
  }

  const filePath = path.join(process.cwd(), "content", "blog", `${slug}.md`);
  let markdown: string;
  try {
    markdown = await readFile(filePath, "utf-8");
  } catch {
    notFound();
  }

  const html = await marked(markdown);

  return (
    <div className="min-h-screen">
      <article className="blog-post mx-auto max-w-3xl px-6 py-28">
        <Link
          href="/#from-the-build-log"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to the build log
        </Link>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>

      <style>{`
        .blog-post h1 {
          margin-top: 2rem;
          font-size: 2.25rem;
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: -0.025em;
          color: var(--foreground);
        }
        .blog-post h2 {
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.3;
          letter-spacing: -0.025em;
          color: var(--foreground);
        }
        .blog-post h3 {
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .blog-post p {
          margin-top: 1rem;
          line-height: 1.75;
          color: var(--muted-foreground);
        }
        .blog-post a {
          color: var(--accent);
          text-decoration: none;
        }
        .blog-post a:hover {
          text-decoration: underline;
        }
        .blog-post ul,
        .blog-post ol {
          margin-top: 1rem;
          margin-left: 1.25rem;
          color: var(--muted-foreground);
        }
        .blog-post li {
          margin-top: 0.5rem;
        }
        .blog-post pre {
          margin-top: 1.25rem;
          margin-bottom: 1.25rem;
          overflow-x: auto;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background-color: var(--muted);
          padding: 1rem;
          font-size: 0.875rem;
          color: var(--foreground);
        }
        .blog-post code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .blog-post p code {
          border-radius: 0.25rem;
          background-color: var(--muted);
          padding: 0.125rem 0.375rem;
          font-size: 0.875em;
          color: var(--foreground);
        }
        .blog-post blockquote {
          margin-top: 1.5rem;
          border-left: 3px solid var(--accent);
          padding-left: 1rem;
          font-style: italic;
          color: var(--muted-foreground);
        }
        .blog-post hr {
          margin-top: 2.5rem;
          margin-bottom: 2.5rem;
          border: 0;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
