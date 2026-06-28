const values = [
  {
    title: "Automate the boring parts",
    body: "Research, formatting, and scheduling should not be manual work. We handle them so you can focus on ideas.",
  },
  {
    title: "Stay in control",
    body: "Every stage is observable. Review outputs, retry failures, and tune tone before anything goes live.",
  },
  {
    title: "Built for makers",
    body: "Content Forge is designed for founders, operators, and creators who publish regularly and care about quality.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pt-32 pb-20">
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">About</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              We build the pipeline. You build the story.
            </h1>
          </div>

          <div className="max-w-xl">
            <p className="text-lg leading-8 text-muted-foreground">
              Content Forge was started because creating good content still involves too many tabs, tools, and manual steps. We wanted a single workflow that researches, writes, illustrates, and schedules — all running in the background with real-time visibility.
            </p>
            <p className="mt-6 text-muted-foreground">
              Today, Content Forge is an open-source project built with Next.js, Trigger.dev, and Prisma. It is designed for teams and creators who publish every week and want their tooling to keep up.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-8 sm:grid-cols-3">
            {values.map((value) => (
              <div key={value.title}>
                <h3 className="text-lg font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-2xl bg-foreground p-10 text-primary-foreground sm:p-14">
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Built in public.
              </h2>
              <p className="mt-4 text-primary-foreground/70">
                Follow the roadmap, open issues, and contribute to the project on GitHub. We ship transparently and learn from the community.
              </p>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex h-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-foreground px-6 text-sm font-semibold text-foreground transition-shadow hover:shadow-lg"
            >
              <span className="relative z-10">View on GitHub</span>
              <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
