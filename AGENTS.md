<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:context-check-rule -->
# Project Context

Before planning or building any feature, check the `context/` folder for project requirements, architecture, data models, and roadmap. These markdown files are extracted from the project overview and must be treated as the source of truth for implementation decisions.

Context files:
- `context/overview.md` — product features and elevator pitch
- `context/architecture.md` — architecture diagram and tech stack
- `context/data-models.md` — Prisma schema and enums
- `context/trigger-jobs.md` — Trigger.dev task orchestration design
- `context/ui-ux.md` — UI/UX concepts and screens
- `context/roadmap.md` — phased development roadmap
- `context/deployment.md` — services, costs, and env variables
- `context/marketing.md` — launch and marketing plan
- `context/success.md` — success metrics and learning goals

Always read the relevant context file(s) before writing code for a new feature.
<!-- END:context-check-rule -->
