"use client";

import { useState, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/notifications";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName")?.toString() || "";
    const lastName = formData.get("lastName")?.toString() || "";
    const newImageUrl = imageUrl || user.imageUrl || "";

    startTransition(async () => {
      try {
        await user.update({
          firstName: firstName || null,
          lastName: lastName || null,
        });

        if (newImageUrl && newImageUrl !== user.imageUrl) {
          await user.setProfileImage({ file: newImageUrl });
        }

        toast({ title: "Profile updated", message: "Your account settings have been saved.", type: "success" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update profile";
        toast({ title: "Update failed", message, type: "error" });
      }
    });
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
          <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">You must be signed in to view settings.</p>
      </div>
    );
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress;
  const displayImage = imageUrl || user.imageUrl || "";
  const initials = (user.firstName?.[0] || user.lastName?.[0] || "U").toUpperCase();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="max-w-md text-base leading-7 text-muted-foreground">Manage your account profile and preferences.</p>
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-muted">
            {displayImage ? (
              <img src={displayImage} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-semibold uppercase text-muted-foreground">
                {initials}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Profile</h3>
            <p className="text-sm text-muted-foreground">Update your public profile information.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                defaultValue={user.firstName || ""}
                placeholder="John"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                defaultValue={user.lastName || ""}
                placeholder="Doe"
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={primaryEmail || ""}
              disabled
              className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground outline-none"
            />
            <p className="text-xs text-muted-foreground">Email is managed through Clerk and cannot be changed here.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="imageUrl" className="text-sm font-medium">Profile image URL</label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Paste an image URL to update your avatar.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="reset"
              onClick={() => setImageUrl("")}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
              )}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
