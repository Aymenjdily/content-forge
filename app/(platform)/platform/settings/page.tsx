"use client";

import { useRef, useState, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/components/notifications";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", message: "Please select an image file.", type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", message: "Image must be smaller than 5MB.", type: "error" });
      return;
    }

    setUploading(true);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      await user.setProfileImage({ file: data.url });
      toast({ title: "Avatar updated", message: "Your profile image has been uploaded.", type: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast({ title: "Upload failed", message, type: "error" });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName")?.toString() || "";
    const lastName = formData.get("lastName")?.toString() || "";

    startTransition(async () => {
      try {
        await user.update({
          firstName: firstName || null,
          lastName: lastName || null,
        });

        toast({ title: "Profile updated", message: "Your account settings have been saved.", type: "success" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update profile";
        toast({ title: "Update failed", message, type: "error" });
      }
    });
  };

  if (!isLoaded) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
          <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">You must be signed in to view settings.</p>
      </div>
    );
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress;
  const displayImage = previewUrl || user.imageUrl || "";
  const initials = (user.firstName?.[0] || user.lastName?.[0] || "U").toUpperCase();

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
        <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="max-w-md text-base leading-7 text-muted-foreground">Manage your account profile and preferences.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold tracking-tight">Profile details</h3>
              <p className="text-sm text-muted-foreground">Update your name and public profile information.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
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
                <label htmlFor="email" className="text-sm font-medium">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={primaryEmail || ""}
                  disabled
                  className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground outline-none"
                />
                <p className="text-xs text-muted-foreground">Email is managed through Clerk and cannot be changed here.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="reset"
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

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold tracking-tight">Profile photo</h3>
              <p className="text-sm text-muted-foreground">Upload a new avatar. JPG, PNG, or GIF up to 5MB.</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-background bg-muted shadow-sm">
                  {displayImage ? (
                    <img src={displayImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-semibold uppercase text-muted-foreground">
                      {initials}
                    </div>
                  )}
                </div>
                {(uploading || isPending) && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                    <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploading ? "Uploading..." : "Upload new photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
