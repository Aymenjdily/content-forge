# Building an AI Content Pipeline with Next.js and Trigger.dev

> How I automated topic research, outlining, drafting, SEO, image generation, and publishing into a single durable workflow — and open-sourced the result.

## The problem

Creating consistent content is a multi-step grind:

1. Research the topic.
2. Build an outline.
3. Write the draft.
4. Optimize for SEO.
5. Find or generate a cover image.
6. Export to the right format.
7. Publish or schedule.

Each step uses a different tool, and switching between them kills momentum. I wanted one place to drop a topic and get a finished, publish-ready piece back — on demand or on a schedule.

That’s how **Content Forge** was born.

## What it does

Content Forge is an AI-powered content pipeline. You enter a topic, pick a tone and length, optionally add a source URL, and the app runs a multi-stage workflow:

```
Research → Outline → Draft → SEO → Image → Notify
```

At the end you get:

- A researched draft in Markdown
- SEO title, meta description, keywords, and slug
- A generated cover image
- Email notification when it’s ready
- Exports to HTML, JSON, PDF, or PowerPoint

You can also save configurations as templates and schedule recurring jobs with cron expressions.

## Architecture

The app is built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. Authentication is handled by **Clerk**, data lives in **PostgreSQL** via **Prisma**, and the heavy lifting is done by **Trigger.dev v3**.

### Why Trigger.dev?

I evaluated a few options for background jobs:

- **Inngest** — great for event-driven workflows, but I wanted simple cron + task orchestration without a separate event model.
- **BullMQ** — powerful, but requires running Redis and managing workers yourself.
- **Trigger.dev** — runs tasks in my own repo, gives me durable execution, retries, scheduling, and a local dev dashboard out of the box. It also deploys separately from Vercel, which keeps concerns clean.

Trigger.dev tasks live alongside my Next.js code, so the mental model stays simple: one repo, one language, one deployment for the UI and another for the worker.

### Job pipeline

Each stage is a standalone task in `trigger/`:

```ts
export const contentForgeTask = task({
  id: "content-forge",
  run: async (payload) => {
    await researchTask.triggerAndWait({ jobId: payload.jobId });
    await outlineTask.triggerAndWait({ jobId: payload.jobId });
    await writeDraftTask.triggerAndWait({ jobId: payload.jobId });
    await seoTask.triggerAndWait({ jobId: payload.jobId });
    await imageTask.triggerAndWait({ jobId: payload.jobId });
    await notifyTask.triggerAndWait({ jobId: payload.jobId });
  },
});
```

Each task updates the job record in PostgreSQL so the UI can stream progress to the user.

## Handling image persistence

One gotcha with AI image APIs is that generated URLs expire. Replicate returns a temporary CDN URL, so the image task downloads the result and re-uploads it to **Vercel Blob**:

```ts
const res = await fetch(imageUrl);
const blob = await res.blob();
const file = new File([blob], "cover.png", { type: "image/png" });
const { url } = await put(
  `jobs/${jobId}/cover-${Date.now()}.png`,
  file,
  { access: "public" }
);
```

Now the cover image URL is permanent and can sit in the content library forever.

## Scheduling with cron

The scheduler uses Trigger.dev’s imperative `schedules` API. When a user creates a recurring job, the app stores a `CronJob` record and registers a schedule that points back to a `cron-runner` task:

```ts
await schedules.create({
  task: "cron-runner",
  cron: cronExpression,
  timezone,
  deduplicationKey: cronJob.id,
  externalId: cronJob.id,
});
```

When Trigger.dev fires the schedule, `cron-runner` looks up the cron job, creates a new `Job`, and triggers the full pipeline.

## Lessons learned

### 1. Durable tasks make AI calls safer

AI APIs are slow and flaky. Trigger.dev retries failed tasks automatically, so a transient OpenAI timeout doesn’t corrupt the whole job.

### 2. Separate UI and worker env vars

Some secrets — like `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, and `RESEND_API_KEY` — must exist in both Vercel and the Trigger.dev dashboard. It’s easy to forget the second one. I added a note about this directly in `env.example`.

### 3. Dark mode needs an inline script

To avoid a flash-of-light-mode on load, I set the theme class in a small inline script before React hydrates:

```html
<script>
  (function () {
    const stored = localStorage.getItem("content-forge-theme");
    const theme = stored === "light" || stored === "dark" ? stored : "system";
    const resolved = theme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    document.documentElement.classList.add(resolved);
  })();
</script>
```

### 4. Prisma client caching in dev

Next.js caches modules in dev, and the generated Prisma client can become stale after a migration. The fix is simple: restart the dev server.

## Try it out

The project is open-source on GitHub:

👉 **[github.com/yourname/content-forge](https://github.com/yourname/content-forge)**

The README has a full setup guide, architecture diagram, and deployment checklist.

## What’s next

- More export formats (Word, LinkedIn article)
- Team workspaces and sharing
- Analytics on published content

If you find it useful, give it a star or open an issue. Contributions are welcome!
