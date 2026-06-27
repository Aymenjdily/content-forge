import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "For solo creators trying the pipeline.",
    features: ["1 project", "10 drafts/mo", "Basic analytics", "Email support"],
    cta: "Start for free",
    href: "/platform",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    description: "For founders and small teams who publish weekly.",
    features: ["Unlimited projects", "Unlimited drafts", "Advanced analytics", "Team collaboration", "Priority support"],
    cta: "Start free trial",
    href: "/platform",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "annual",
    description: "For companies that need control and scale.",
    features: ["SSO", "SLA", "Dedicated support", "Custom integrations", "Audit logs"],
    cta: "Contact sales",
    href: "mailto:hello@contentforge.dev",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pt-32 pb-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pricing</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple, transparent pricing.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Start free. Upgrade when you need more power and teammates.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`
                relative flex flex-col rounded-2xl border p-8
                ${plan.highlighted
                  ? "border-foreground bg-foreground text-primary-foreground shadow-xl"
                  : "border-border bg-white"
                }
              `}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}

              <div>
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    /{plan.period}
                  </span>
                </div>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className={`mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-primary-foreground" : "text-accent"}`}
                    >
                      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={plan.highlighted ? "text-primary-foreground/90" : "text-muted-foreground"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`
                  mt-8 inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-semibold transition-colors
                  ${plan.highlighted
                    ? "bg-primary-foreground text-foreground hover:bg-primary-foreground/90"
                    : "bg-foreground text-primary-foreground hover:bg-foreground/90"
                  }
                `}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-2xl text-center">
          <p className="text-sm text-muted-foreground">
            All plans include unlimited pipeline runs, SSL, and 99.9% uptime. Need help choosing?{" "}
            <a href="mailto:hello@contentforge.dev" className="font-medium text-foreground underline underline-offset-4 hover:text-accent">
              Email us.
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
