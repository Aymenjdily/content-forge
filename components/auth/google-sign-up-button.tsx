"use client";

import { useSignUp } from "@clerk/nextjs";

interface GoogleAuthButtonProps {
  children: React.ReactNode;
}

export function GoogleSignUpButton({ children }: GoogleAuthButtonProps) {
  const { signUp } = useSignUp();

  const handleClick = async () => {
    if (!signUp) return;

    await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: "/platform",
      redirectCallbackUrl: "/sso-callback",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!signUp}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:border-foreground/20 hover:bg-muted disabled:opacity-50"
    >
      {children}
    </button>
  );
}
