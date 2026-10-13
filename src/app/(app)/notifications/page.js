"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck, CircleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications";
import { formatDateTime } from "@/lib/format";

export default function NotificationsPage() {
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getNotifications({
        unreadOnly: unreadOnly ? "true" : undefined,
        limit: 50,
      });
      setNotifications(res?.data?.notifications || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast({ message: "All notifications marked as read", type: "success" });
    } catch (err) {
      showToast({ message: err.message || "Failed to update", type: "error" });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Notifications</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            System notices, transaction confirmations, and security alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={unreadOnly ? "primary" : "secondary"}
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className="text-xs"
          >
            {unreadOnly ? "Showing Unread" : "Filter Unread"}
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              isLoading={isMarkingAll}
              className="gap-1.5 text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Mark all read</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 squircle bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]">
          <CircleAlert className="w-4 h-4 shrink-0 text-[var(--text)]" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader
          title="Notification Feed"
          subtitle={`${unreadCount} unread notices`}
        />

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 squircle bg-[var(--surface)] flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-3">
            <Bell className="w-8 h-8 text-[var(--text-muted)]" strokeWidth={1.5} />
            <p>No notifications found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkSingleRead(n.id)}
                className={`p-4 squircle border transition-all cursor-pointer ${
                  n.isRead
                    ? "bg-[var(--surface)] border-[var(--border)] opacity-80"
                    : "bg-[var(--surface)] border-[var(--text)]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[var(--text)] shrink-0" />
                    )}
                    <span className="text-base font-medium text-[var(--text)]">{n.title}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] shrink-0">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                  {n.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
