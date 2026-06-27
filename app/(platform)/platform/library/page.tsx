import { ContentLibrary } from "@/components/platform/content-library";

export default function LibraryPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
        <h2 className="text-2xl font-semibold tracking-tight">Content Library</h2>
        <p className="max-w-md text-base leading-7 text-muted-foreground">
          Browse everything you&apos;ve generated. Export drafts as Markdown, HTML, or JSON.
        </p>
      </div>

      <ContentLibrary />
    </div>
  );
}
