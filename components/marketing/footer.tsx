import Link from "next/link";
import { Logo } from "@/components/logo";

const links = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog/building-ai-content-pipeline" },
  { label: "About", href: "/about" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={20} />
          <span className="text-sm font-semibold">Content Forge</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Content Forge
        </p>
      </div>
    </footer>
  );
}
