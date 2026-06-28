"use client";

import { useSignIn } from "@clerk/nextjs";

interface GoogleAuthButtonProps {
  children: React.ReactNode;
}

export function GoogleSignInButton({ children }: GoogleAuthButtonProps) {
  const { signIn } = useSignIn();

  const handleClick = async () => {
    if (!signIn) return;

    await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: "/platform",
      redirectCallbackUrl: "/sso-callback",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!signIn}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:border-foreground/20 hover:bg-muted disabled:opacity-50"
    >
      {children}
    </button>
  );
}
