import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  if (variant === "primary") {
    return (
      <button
        disabled={disabled}
        className={cn(
          "group relative inline-flex items-center justify-center overflow-hidden rounded-md bg-foreground text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-lg disabled:opacity-50",
          size === "sm" ? "h-9 px-4" : "h-11 px-6",
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
      </button>
    );
  }

  if (variant === "danger") {
    return (
      <button
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg border border-status-red-border bg-background px-4 py-2 text-sm font-medium text-status-red-text transition-colors hover:bg-status-red-bg disabled:opacity-50",
          size === "sm" && "px-3 py-1.5 text-xs",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50",
          size === "sm" && "px-3 py-1.5 text-xs",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50",
        size === "sm" && "px-3 py-1.5 text-xs",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
