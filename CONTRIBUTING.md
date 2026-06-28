# Contributing to Content Forge

Thanks for your interest in contributing! This document covers how to get set up, our development workflow, and how to submit changes.

## Development setup

1. Fork and clone the repo.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the environment template and fill in your credentials:

   ```bash
   cp env.example .env.local
   ```

4. Run database migrations:

   ```bash
   npx prisma migrate dev
   ```

5. Start Trigger.dev locally:

   ```bash
   npm run trigger:dev
   ```

6. In another terminal, start Next.js:

   ```bash
   npm run dev
   ```

## Project structure

```
app/              # Next.js App Router pages and API routes
components/       # React components (marketing, platform, auth)
context/          # Project requirements, architecture, and roadmap docs
lib/              # Utilities, Prisma client, server actions, jobs
trigger/          # Trigger.dev background tasks
prisma/           # Prisma schema and migrations
```

Before building a new feature, check the relevant files in `context/` for requirements and architecture decisions.

## Coding guidelines

- **TypeScript**: Prefer strict typing. Avoid `any` unless interacting with SDKs that require it.
- **Styling**: Use Tailwind CSS utility classes. Prefer semantic tokens (`bg-background`, `text-foreground`, `border-border`) for theming.
- **Dark mode**: When adding new UI, verify both light and dark modes. Use `@variant dark` styles in CSS when needed.
- **Server actions**: Place new actions under `lib/actions/` and mark them with `"use server"`.
- **Trigger tasks**: Place new tasks under `trigger/` and register them in the main pipeline in `trigger/content-forge.ts`.
- **Database changes**: Edit `prisma/schema.prisma` and run `npx prisma migrate dev`.

## Before submitting

- Run the build:

  ```bash
  npm run build
  ```

- Run the linter:

  ```bash
  npm run lint
  ```

- Test your changes locally in both light and dark mode and on a narrow viewport.

## Submitting changes

1. Create a branch for your change:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make focused commits with clear messages.
3. Push to your fork and open a pull request against `main`.
4. Include a description of what changed and why.

## Questions?

Open an issue or discussion on GitHub and we'll help you out.
