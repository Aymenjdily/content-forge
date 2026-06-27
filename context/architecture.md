# Architecture & Tech Stack

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15 (App Router)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   UI Layer   │  │  API Routes  │  │  Server Actions     │  │
│  │  (shadcn/ui) │  │  (tRPC/REST) │  │  (mutations)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Trigger.dev v3 (Background Jobs)                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  contentForge (orchestrator)                            │  │
│  │  ├── research()        → Cheerio / Jina AI               │  │
│  │  ├── generateOutline() → OpenAI GPT-4o                   │  │
│  │  ├── writeDraft()      → OpenAI GPT-4o                   │  │
│  │  ├── createImage()     → Replicate (Flux/SDXL)            │  │
│  │  ├── optimizeSEO()     → OpenAI GPT-4o                   │  │
│  │  ├── schedulePosts()   → LinkedIn/Twitter API            │  │
│  │  └── notifyUser()      → Resend                          │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  PostgreSQL │  │    Redis    │  │   Object Storage    │  │
│  │  (Prisma)   │  │  (Trigger)  │  │   (Images/Vercel)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | Full-stack React framework |
| **Language** | TypeScript | Type safety across the stack |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, accessible UI components |
| **Jobs** | Trigger.dev v3 | Background job orchestration |
| **Database** | PostgreSQL (Supabase/Neon) | Relational data storage |
| **ORM** | Prisma | Database schema & queries |
| **Auth** | Clerk | User authentication & sessions |
| **AI Text** | OpenAI GPT-4o | Content generation |
| **AI Image** | Replicate (Flux/SDXL) | Hero image generation |
| **Email** | Resend | Transactional emails |
| **Search** | Jina AI Reader / Cheerio | Web scraping & content extraction |
| **Deploy** | Vercel | Frontend & API hosting |
| **Trigger Host** | Trigger.dev Cloud | Job execution infrastructure |
