"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { createTemplate, deleteTemplate, getTemplates, type Template } from "@/lib/actions/templates";
import { Button } from "@/components/platform/button";
import { Modal } from "@/components/platform/modal";
import { useToast } from "@/components/notifications";
import { cn } from "@/lib/utils";

const tones = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "witty", label: "Witty" },
  { value: "educational", label: "Educational" },
];

const lengths = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

const platforms = [
  { value: "blog", label: "Blog post" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      const data = await getTemplates();
      if (!cancelled) {
        setTemplates(data);
        setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      const result = await createTemplate({}, formData);
      if (result.success && result.template) {
        setTemplates((prev) => [result.template!, ...prev]);
        setShowCreate(false);
        toast({ title: "Template created", message: `"${result.template.name}" has been saved.`, type: "success" });
      } else if (result.error) {
        toast({ title: "Error", message: result.error, type: "error" });
      }
    });
  };

  const handleDelete = async (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;
    if (!confirm(`Delete template "${template.name}"?`)) return;

    const result = await deleteTemplate(id);
    if (result.success) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Template deleted", message: `"${template.name}" has been removed.`, type: "success" });
    } else {
      toast({ title: "Error", message: result.error || "Could not delete template.", type: "error" });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
          <h2 className="text-2xl font-semibold tracking-tight">Templates</h2>
          <p className="max-w-md text-base leading-7 text-muted-foreground">
            Save reusable configurations for your content jobs. Apply them with one click when creating a new job.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Template
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <p className="text-sm font-medium">No templates yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Create your first template to speed up future jobs.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTemplateDialog
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          isPending={isPending}
        />
      )}
    </div>
  );
}

function TemplateCard({ template, onDelete }: { template: Template; onDelete: (id: string) => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-background p-5 shadow-sm transition-all hover:border-foreground/10 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold tracking-tight">{template.name}</h3>
      {template.description ? (
        <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
      ) : (
        <p className="mt-1 text-sm italic text-muted-foreground">No description</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge label={template.config.tone} />
        <Badge label={template.config.length} />
        {template.config.platforms.map((platform) => (
          <Badge key={platform} label={platform} />
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <span className="text-xs text-muted-foreground">
          Created {new Date(template.createdAt).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/platform"
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Use
          </Link>
          <Button variant="danger" size="sm" onClick={() => onDelete(template.id)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-lg bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}

function CreateTemplateDialog({
  onClose,
  onCreate,
  isPending,
}: {
  onClose: () => void;
  onCreate: (formData: FormData) => void;
  isPending: boolean;
}) {
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["blog"]);

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("tone", tone);
    formData.set("length", length);
    selectedPlatforms.forEach((p) => formData.append("platforms", p));
    onCreate(formData);
  };

  return (
    <Modal open onClose={onClose} className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Create template</h3>
          <p className="text-sm text-muted-foreground">Save a reusable configuration for future jobs.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              placeholder="e.g. Viral LinkedIn Post"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="Short description"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Tone</label>
            <div className="flex flex-wrap gap-2">
              {tones.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTone(option.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    tone === option.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Length</label>
            <div className="flex flex-wrap gap-2">
              {lengths.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLength(option.value)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    length === option.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {platforms.map((option) => {
                const selected = selectedPlatforms.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => togglePlatform(option.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                      selected
                        ? "border-accent bg-accent/10 text-amber-800"
                        : "border-border bg-background text-muted-foreground hover:border-accent/30 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        selected
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-background"
                      )}
                    >
                      {selected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
