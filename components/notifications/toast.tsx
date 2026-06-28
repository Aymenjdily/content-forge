"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useNotifications } from "./provider";
import { cn } from "@/lib/utils";

interface ToastProps {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
}

export function useToast() {
  const { addNotification } = useNotifications();

  const toast = useCallback(
    ({ title, message, type = "info", duration = 5000 }: ToastProps) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      addNotification({ title, message, type });

      if (duration > 0) {
        setTimeout(() => {
          // Notification auto-dismiss could be added here
        }, duration);
      }

      return id;
    },
    [addNotification]
  );

  return useMemo(() => ({ toast }), [toast]);
}

export function Toasts() {
  const { notifications, removeNotification } = useNotifications();
  const recent = notifications.slice(0, 3);

  return (
    <div className="fixed right-4 bottom-20 z-50 flex flex-col gap-2 md:bottom-4">
      {recent.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  notification,
  onDismiss,
}: {
  notification: { id: string; title: string; message: string; type: string; createdAt: Date };
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        "flex w-80 items-start gap-3 rounded-xl border bg-background p-4 shadow-lg transition-all",
        notification.type === "success" && "border-status-green-border",
        notification.type === "error" && "border-status-red-border",
        notification.type === "warning" && "border-status-amber-border",
        notification.type === "info" && "border-border"
      )}
    >
      <div className={cn("mt-0.5 h-2 w-2 flex-shrink-0 rounded-full", typeDot(notification.type))} />
      <div className="flex-1">
        <p className="text-sm font-medium">{notification.title}</p>
        <p className="text-xs leading-5 text-muted-foreground">{notification.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function typeDot(type: string) {
  switch (type) {
    case "success":
      return "bg-status-green-text";
    case "warning":
      return "bg-status-amber-text";
    case "error":
      return "bg-status-red-text";
    default:
      return "bg-status-blue-text";
  }
}
