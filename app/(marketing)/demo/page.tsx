import { readFile } from "fs/promises";
import path from "path";
import { marked } from "marked";
import Link from "next/link";

export const metadata = {
  title: "Demo Video Script | Content Forge",
  description: "Behind-the-scenes script for the Content Forge demo video.",
};

export default async function DemoPage() {
  const filePath = path.join(process.cwd(), "content", "marketing", "demo-video-script.md");
  const markdown = await readFile(filePath, "utf-8");
  const html = await marked(markdown);

  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pt-36 pb-12">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← Back home
        </Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          See Content Forge in action
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
          The full demo video is in production. Below is the script we’re recording — a 45–60 second walkthrough of the pipeline from topic to publish-ready assets.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-muted">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-primary-foreground">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">Demo video coming soon</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-28">
        <article className="demo-script">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </section>

      <style>{`
        .demo-script h1 {
          font-size: 1.875rem;
          font-weight: 600;
          color: var(--foreground);
          margin-bottom: 1rem;
        }
        .demo-script h2 {
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .demo-script h3 {
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--foreground);
        }
        .demo-script p {
          margin-top: 0.75rem;
          line-height: 1.7;
          color: var(--muted-foreground);
        }
        .demo-script strong {
          color: var(--foreground);
        }
        .demo-script ul {
          margin-top: 0.75rem;
          margin-left: 1.25rem;
          color: var(--muted-foreground);
        }
        .demo-script li {
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
