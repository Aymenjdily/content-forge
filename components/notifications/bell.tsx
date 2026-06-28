"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useNotifications } from "./provider";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {mounted && unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 hidden md:block"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-background shadow-lg md:w-96">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/30",
                      !notification.read && "bg-muted/20"
                    )}
                  >
                    {notification.href ? (
                      <Link
                        href={notification.href}
                        onClick={() => markAsRead(notification.id)}
                        className="block"
                      >
                        <NotificationContent notification={notification} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="block w-full text-left"
                      >
                        <NotificationContent notification={notification} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                      aria-label="Remove notification"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationContent({ notification }: { notification: { title: string; message: string; type: string; createdAt: Date; read: boolean } }) {
  return (
    <>
      <div className="flex items-start gap-2 pr-6">
        {!notification.read && <span className={cn("mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full", typeDot(notification.type))} />}
        <div className="flex-1">
          <p className="text-sm font-medium">{notification.title}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{notification.message}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(notification.createdAt)}</p>
        </div>
      </div>
    </>
  );
}

function typeDot(type: string) {
  switch (type) {
    case "success":
      return "bg-green-500";
    case "warning":
      return "bg-amber-500";
    case "error":
      return "bg-red-500";
    default:
      return "bg-blue-500";
  }
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
