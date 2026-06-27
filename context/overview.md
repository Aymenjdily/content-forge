# AI Content Forge — Project Overview

An open-source, AI-powered content pipeline built with Next.js 15 and Trigger.dev v3. Paste a topic, sit back, and watch a multi-stage workflow research, write, illustrate, and schedule your content — all with real-time progress tracking and resilience built in.

## Elevator Pitch

**The Problem:** Creating high-quality content is a fragmented, manual process. Research → writing → image creation → scheduling → distribution. It takes hours and dozens of tools.

**The Solution:** AI Content Forge orchestrates the entire pipeline as a resilient, observable background workflow. You provide a topic or URL; the system handles the rest. Built to showcase Trigger.dev's real superpowers: **long-running jobs, retries, concurrency, and real-time observability**.

## Core Features

### 1. Topic Input & Configuration
- **Quick Start:** Paste a topic, URL, or keyword
- **Advanced Mode:** Configure tone, length, target audience, platforms (LinkedIn, Twitter/X, Blog)
- **Template Library:** "Technical Deep Dive", "Viral Thread", "LinkedIn Carousel", "Newsletter"

### 2. Multi-Stage AI Pipeline (Trigger.dev Jobs)
A single `contentForge` task that orchestrates sub-tasks:

| Stage | Task | Description | Tool/API |
|-------|------|-------------|----------|
| 1 | `research` | Scrape & summarize source content, extract key points | Cheerio / Jina AI Reader |
| 2 | `generateOutline` | Create structured outline from research | OpenAI GPT-4o |
| 3 | `writeDraft` | Generate full article/thread copy | OpenAI GPT-4o |
| 4 | `createImage` | Generate a hero image matching the content | Replicate (Flux/SDXL) |
| 5 | `optimizeSEO` | Generate meta title, description, keywords | OpenAI GPT-4o |
| 6 | `schedulePosts` | Queue social media posts via APIs | LinkedIn/Twitter APIs (or Buffer) |
| 7 | `notifyUser` | Send email with final package | Resend / SendGrid |

Each stage:
- Has **individual retry logic** (exponential backoff)
- Emits **real-time progress events** to the UI
- Can be **individually re-triggered** if it fails
- Runs with **concurrency limits** to respect API rate limits

### 3. Live Job Dashboard
- **Real-time Status:** See jobs move from `queued` → `running` → `completed` / `failed`
- **Visual Pipeline:** Step-by-step progress with icons, timestamps, and logs
- **Log Streaming:** View stdout/stderr from each task in real-time
- **Manual Actions:** Retry failed steps, cancel running jobs, pause/resume

### 4. Content Library
- Browse all generated content (articles, threads, images)
- Export as Markdown, HTML, or JSON
- One-click re-run with same or modified parameters
- Version history (every generation is saved)

### 5. Scheduler (Cron Jobs)
- "Generate weekly industry roundup every Monday 9am"
- "Daily trending topic analysis"
- Fully managed by Trigger.dev's cron scheduling

### 6. Team Collaboration *(Future)*
- Share generated content with team members
- Approval workflows before publishing
- Comments and feedback on drafts
