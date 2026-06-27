import Link from "next/link";
import { cn } from "@/lib/utils";

const highlights = [
  {
    number: "01",
    title: "Research",
    body: "Scrapes and summarizes sources so you start with facts, not a blank page.",
  },
  {
    number: "02",
    title: "Draft",
    body: "Writes articles, threads, or newsletters in the tone and length you choose.",
  },
  {
    number: "03",
    title: "Illustrate",
    body: "Generates a hero image that matches the content, ready for publishing.",
  },
  {
    number: "04",
    title: "Schedule",
    body: "Queues posts and sends you a final package when everything is ready.",
  },
];

const testimonials = [
  {
    quote: "We went from a Slack thread to a scheduled LinkedIn post in fifteen minutes. It felt like having a research intern who never sleeps.",
    name: "Mara K.",
    role: "Founder, Weekend Build",
    initials: "MK",
  },
  {
    quote: "The pipeline just keeps running. I check my inbox and the draft, image, and metadata are already there.",
    name: "Daniel R.",
    role: "Engineering Lead, Relay",
    initials: "DR",
  },
  {
    quote: "Our Monday newsletter used to eat up half the day. Now I review, edit lightly, and publish.",
    name: "Sofia L.",
    role: "Content Ops, Plainflow",
    initials: "SL",
  },
];

function StarRating() {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {"★★★★★".split("").map((star, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}


export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pt-36 pb-28">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Content Forge
            </p>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Content that builds itself.
            </h1>

            <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
              Paste a topic or URL. Get research, drafts, images, SEO metadata, and scheduled posts — without switching tabs.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/platform"
                className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-md bg-foreground px-6 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-lg"
              >
                <span className="relative z-10">Start creating</span>
                <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-white px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                View pricing
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">Free during beta. No credit card required.</p>
          </div>

          <div className="lg:col-span-6">
            <div className="relative">
              <div className="absolute -right-3 -bottom-3 h-full w-full rounded-2xl border border-border bg-muted" />
              <div className="relative grid gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:grid-cols-2">
                {testimonials.map((t, i) => (
                  <blockquote
                    key={t.name}
                    className={cn(
                      "flex flex-col justify-between rounded-xl border border-border bg-muted/30 p-5",
                      i === 0 && "sm:col-span-2"
                    )}
                  >
                    <div>
                      <StarRating />
                      <p className={cn("mt-3 leading-7", i === 0 ? "text-base" : "text-[15px]")}>
                        “{t.quote}”
                      </p>
                    </div>
                    <footer className="mt-5 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {t.initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-14 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Features</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">From topic to publish-ready assets.</h2>
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => (
              <div key={item.number} className="bg-white p-8">
                <span className="text-xs font-semibold text-accent">{item.number}</span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-28">
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How it works</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            One topic. A whole pipeline.
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "Paste a topic or URL", detail: "Start with a sentence, a keyword, or a link." },
            { step: "Research and outline", detail: "We scrape and summarize the source material." },
            { step: "Draft and image", detail: "Copy and a hero image are generated in parallel." },
            { step: "SEO, schedule, deliver", detail: "Metadata, queued posts, and an email package." },
          ].map((item, index) => (
            <div key={item.step} className="relative">
              <span className="absolute -top-3 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-primary-foreground">
                {index + 1}
              </span>
              <div className="rounded-2xl border border-border bg-white p-6 pt-8">
                <h3 className="text-base font-semibold">{item.step}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-2xl bg-foreground p-10 text-primary-foreground sm:p-14">
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Stop copy-pasting between tabs.
              </h2>
              <p className="mt-4 text-primary-foreground/70">
                Try Content Forge free during beta and see how much time you get back.
              </p>
            </div>
            <Link
              href="/platform"
              className="group relative inline-flex h-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-foreground px-6 text-sm font-semibold text-foreground transition-shadow hover:shadow-lg"
            >
              <span className="relative z-10">Start creating for free</span>
              <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
