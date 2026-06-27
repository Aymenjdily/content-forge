# Trigger.dev Job Design

## Main Orchestrator

```typescript
// trigger/content-forge.ts
import { task } from "@trigger.dev/sdk/v3";
import { research } from "./stages/research";
import { generateOutline } from "./stages/outline";
import { writeDraft } from "./stages/draft";
import { createImage } from "./stages/image";
import { optimizeSEO } from "./stages/seo";
import { schedulePosts } from "./stages/schedule";
import { notifyUser } from "./stages/notify";

export const contentForge = task({
  id: "content-forge",
  run: async ({ topic, sourceUrl, config, userId, jobId }: ForgeInput) => {
    // Stage 1: Research
    const researchData = await research.triggerAndWait({ topic, sourceUrl });
    await updateProgress(jobId, "research", 15);

    // Stage 2: Outline
    const outline = await generateOutline.triggerAndWait({ 
      research: researchData.output, 
      config 
    });
    await updateProgress(jobId, "outline", 30);

    // Stage 3: Draft (can run parallel with image if desired)
    const [draft, image] = await Promise.all([
      writeDraft.triggerAndWait({ outline: outline.output, config }),
      createImage.triggerAndWait({ outline: outline.output, config })
    ]);
    await updateProgress(jobId, "draft", 60);

    // Stage 4: SEO
    const seo = await optimizeSEO.triggerAndWait({ 
      draft: draft.output, 
      config 
    });
    await updateProgress(jobId, "seo", 75);

    // Stage 5: Schedule
    const scheduled = await schedulePosts.triggerAndWait({
      draft: draft.output,
      image: image.output,
      platforms: config.platforms,
      seo: seo.output
    });
    await updateProgress(jobId, "schedule", 90);

    // Stage 6: Notify
    await notifyUser.triggerAndWait({
      userId,
      jobId,
      draft: draft.output,
      image: image.output,
      seo: seo.output
    });
    await updateProgress(jobId, "notify", 100);

    return { success: true, jobId };
  },
});
```

## Individual Stage Task (Example)

```typescript
// trigger/stages/research.ts
import { task } from "@trigger.dev/sdk/v3";

export const research = task({
  id: "content-forge-research",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async ({ topic, sourceUrl }: ResearchInput) => {
    if (sourceUrl) {
      // Use Jina AI Reader or Cheerio to scrape
      const content = await scrapeUrl(sourceUrl);
      return summarizeWithAI(content);
    }

    // Otherwise, perform web search
    const searchResults = await searchWeb(topic);
    return synthesizeResearch(searchResults);
  },
});
```
