"use client";

import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed left-0 top-0 z-[60] h-dvh w-screen overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        className="fixed left-0 top-0 z-[61] h-dvh w-screen bg-black/40"
        aria-label="Close dialog"
      />

      <div className="relative z-[62] flex min-h-dvh items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full max-w-lg rounded-xl border border-border bg-background shadow-lg",
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
