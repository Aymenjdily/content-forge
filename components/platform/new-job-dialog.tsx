"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/actions/jobs";
import { createTemplate, getTemplates, type Template } from "@/lib/actions/templates";
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

interface NewJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SelectButton({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
            value === option.value
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function TemplateSelector({
  templates,
  selectedId,
  onSelect,
}: {
  templates: Template[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = templates.find((t) => t.id === selectedId);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Template</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors hover:border-foreground/30"
        >
          <span className={selected ? "text-foreground" : "text-muted-foreground"}>
            {selected ? selected.name : "No template"}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("text-muted-foreground transition-transform", open && "rotate-180")}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-background p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  onSelect("");
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  selectedId === "" && "bg-muted font-medium"
                )}
              >
                No template
              </button>
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    onSelect(template.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                    selectedId === template.id && "bg-muted font-medium"
                  )}
                >
                  <span>{template.name}</span>
                  {template.description && (
                    <span className="text-xs text-muted-foreground">{template.description}</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CheckboxButton({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
              selected
                ? "border-accent bg-accent/10 text-accent"
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
  );
}

export function NewJobDialog({ open, onOpenChange }: NewJobDialogProps) {
  const [state, formAction, pending] = useActionState(createJob, {});
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["blog"]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [isSavingTemplate, startSaveTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();
  const [submissionCount, setSubmissionCount] = useState(0);
  const processedCountRef = useRef(0);

  useEffect(() => {
    if (state.success && state.jobId && submissionCount > processedCountRef.current) {
      processedCountRef.current = submissionCount;
      toast({
        title: "Job created",
        message: "Your content pipeline has started. We'll notify you when it's ready.",
        type: "info",
      });
      onOpenChange(false);
      router.push(`/platform/jobs/${state.jobId}`);
    }
  }, [state.success, state.jobId, submissionCount, toast, onOpenChange, router]);

  useEffect(() => {
    if (open) {
      getTemplates().then((data) => setTemplates(data));
    }
  }, [open]);

  const handleSaveTemplate = (name: string, description: string) => {
    startSaveTransition(async () => {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("description", description);
      formData.set("tone", tone);
      formData.set("length", length);
      selectedPlatforms.forEach((p) => formData.append("platforms", p));

      const result = await createTemplate({}, formData);
      if (result.success && result.template) {
        setTemplates((prev) => [result.template!, ...prev]);
        setShowSaveTemplate(false);
        toast({ title: "Template saved", message: `"${result.template.name}" has been saved.`, type: "success" });
      } else if (result.error) {
        toast({ title: "Error", message: result.error, type: "error" });
      }
    });
  };

  const handleSubmit = () => {
    setSubmissionCount((count) => count + 1);
  };

  const resetForm = () => {
    setTone("professional");
    setLength("medium");
    setSelectedPlatforms(["blog"]);
    setSelectedTemplateId("");
    setShowSaveTemplate(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setTone(template.config.tone);
      setLength(template.config.length);
      setSelectedPlatforms(template.config.platforms);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Create a new content job</h3>
          <p className="text-sm text-muted-foreground">Tell us what you want to write about and we will research, draft, and optimize it.</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="tone" value={tone} />
          <input type="hidden" name="length" value={length} />
          {selectedPlatforms.map((p) => (
            <input key={p} type="hidden" name="platforms" value={p} />
          ))}

          {templates.length > 0 && (
            <TemplateSelector
              templates={templates}
              selectedId={selectedTemplateId}
              onSelect={applyTemplate}
            />
          )}

          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium">Topic or title</label>
            <input
              id="topic"
              name="topic"
              type="text"
              required
              minLength={3}
              placeholder="e.g. The future of AI in content marketing"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="sourceUrl" className="text-sm font-medium">Source URL (optional)</label>
            <input
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              placeholder="https://example.com/article"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Tone</label>
            <SelectButton options={tones} value={tone} onChange={setTone} />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Length</label>
            <SelectButton options={lengths} value={length} onChange={setLength} />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Platforms</label>
            <CheckboxButton options={platforms} value={selectedPlatforms} onChange={setSelectedPlatforms} />
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            {!showSaveTemplate ? (
              <button
                type="button"
                onClick={() => setShowSaveTemplate(true)}
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Save current config as template
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium">Save as template</p>
                <input
                  type="text"
                  name="templateName"
                  placeholder="Template name"
                  required
                  minLength={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                <input
                  type="text"
                  name="templateDescription"
                  placeholder="Description (optional)"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSavingTemplate}
                    onClick={() => {
                      const nameInput = document.querySelector<HTMLInputElement>('input[name="templateName"]')?.value;
                      const descriptionInput = document.querySelector<HTMLInputElement>('input[name="templateDescription"]')?.value;
                      if (!nameInput) return;
                      handleSaveTemplate(nameInput, descriptionInput || "");
                    }}
                  >
                    {isSavingTemplate ? "Saving..." : "Save"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplate(false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {state.error && (
            <p className="rounded-lg border border-status-red-border bg-status-red-bg px-4 py-3 text-sm text-status-red-text">{state.error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
    </Modal>
  );
}
