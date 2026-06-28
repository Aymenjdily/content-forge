"use client";

import { useState, useTransition } from "react";
import { createCronJob, type CronJob } from "@/lib/actions/cron-jobs";
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

const cronPresets = [
  { label: "Daily", value: "0 9 * * *", description: "Every day at 09:00" },
  { label: "Weekly", value: "0 9 * * 1", description: "Monday at 09:00" },
  { label: "Monthly", value: "0 9 1 * *", description: "1st of each month" },
];

interface NewScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (cronJob: CronJob) => void;
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

export function NewScheduleDialog({ open, onOpenChange, onCreated }: NewScheduleDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [topic, setTopic] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [cronExpression, setCronExpression] = useState("0 9 * * 1");
  const [timezone, setTimezone] = useState("UTC");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["blog"]);

  if (!open) return null;

  function resetForm() {
    setTopic("");
    setSourceUrl("");
    setCronExpression("0 9 * * 1");
    setTimezone("UTC");
    setTone("professional");
    setLength("medium");
    setSelectedPlatforms(["blog"]);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("topic", topic);
    formData.set("sourceUrl", sourceUrl);
    formData.set("cronExpression", cronExpression);
    formData.set("timezone", timezone);
    formData.set("tone", tone);
    formData.set("length", length);
    selectedPlatforms.forEach((p) => formData.append("platforms", p));

    startTransition(async () => {
      const result = await createCronJob({}, formData);
      if (result.success && result.cronJob) {
        onCreated(result.cronJob);
        handleClose();
        toast({ title: "Scheduled", message: "Your recurring job has been created." });
      } else if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <Modal open={open} onClose={handleClose} className="flex max-h-[85dvh] flex-col">
      <div className="flex items-start justify-between border-b border-border p-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Create recurring job</h3>
          <p className="text-sm text-muted-foreground">Schedule content generation to run automatically.</p>
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

      <form id="new-schedule-form" onSubmit={handleSubmit} className="overflow-y-auto p-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="schedule-topic" className="text-sm font-medium">
                Topic
              </label>
              <input
                id="schedule-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. AI trends in marketing"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="schedule-source" className="text-sm font-medium">
                Source URL <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="schedule-source"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/source"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule</label>
              <div className="grid grid-cols-3 gap-2">
                {cronPresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setCronExpression(preset.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-left text-xs transition-all",
                      cronExpression === preset.value
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    <span className="font-semibold">{preset.label}</span>
                    <span className={cn("text-[10px] opacity-80", cronExpression === preset.value ? "text-background" : "text-muted-foreground")}>
                      {preset.description}
                    </span>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                placeholder="0 9 * * 1"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-mono outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
              <p className="text-xs text-muted-foreground">CRON expression in 5-field format.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
              <p className="text-xs text-muted-foreground">IANA timezone, e.g. America/New_York, Europe/London.</p>
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

            {error && (
              <p className="rounded-lg border border-status-red-border bg-status-red-bg px-4 py-3 text-sm text-status-red-text">{error}</p>
            )}
          </div>
        </form>

      <div className="flex items-center justify-end gap-3 border-t border-border p-6">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <Button
          type="submit"
          disabled={isPending || selectedPlatforms.length === 0 || !topic.trim() || topic.trim().length < 3}
          onClick={() => {
            const form = document.getElementById("new-schedule-form") as HTMLFormElement | null;
            form?.requestSubmit();
          }}
        >
          {isPending ? "Creating…" : "Create schedule"}
        </Button>
      </div>
    </Modal>
  );
}
