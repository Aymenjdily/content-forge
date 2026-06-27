"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
  href?: string;
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("cf-notifications");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as Notification[];
      return parsed.map((n) => ({ ...n, createdAt: new Date(n.createdAt) }));
    } catch {
      return [];
    }
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("cf-notifications", JSON.stringify(notifications));
    }
  }, [notifications, mounted]);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "read" | "createdAt">) => {
    setNotifications((prev) => {
      const title = notification.title;
      const message = notification.message;
      const type = notification.type;
      const similar = prev.some(
        (n) => n.title === title && n.message === message && n.type === type
      );
      if (similar) return prev;

      const newNotification: Notification = {
        ...notification,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        read: false,
        createdAt: new Date(),
      };
      return [newNotification, ...prev].slice(0, 50);
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
    }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification]
  );

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}
