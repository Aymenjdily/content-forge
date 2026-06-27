"use client";

import { useEffect, useState, useTransition } from "react";
import { createTemplate, deleteTemplate, getTemplates, type Template } from "@/lib/actions/templates";
import { useToast } from "@/components/notifications";

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

export default function SettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
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
        toast({ title: "Template created", message: `"${result.template.name}" has been saved.`, type: "success" });

        const form = document.getElementById("create-template-form") as HTMLFormElement | null;
        form?.reset();
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
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="max-w-md text-base leading-7 text-muted-foreground">Configure your workspace and manage reusable templates.</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Templates</h3>

        <form
          id="create-template-form"
          action={handleCreate}
          className="mb-8 space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tone</label>
              <select
                name="tone"
                defaultValue="professional"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              >
                {tones.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Length</label>
              <select
                name="length"
                defaultValue="medium"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              >
                {lengths.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Platforms</label>
              <select
                name="platforms"
                multiple
                defaultValue={["blog"]}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              >
                {platforms.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
            >
              {isPending ? "Creating..." : "Create Template"}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">No templates yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Create one above or save a config from the New Job dialog.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{template.name}</p>
                  {template.description && (
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.config.tone} · {template.config.length} · {template.config.platforms.join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(template.id)}
                  className="self-start rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 sm:self-center"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
