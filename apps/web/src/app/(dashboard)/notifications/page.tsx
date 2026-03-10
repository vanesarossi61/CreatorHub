"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import api from "@/lib/api-client";
import type { NotificationItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Notification type -> icon & color mapping
const NOTIF_CONFIG: Record<string, { icon: string; color: string }> = {
  NEW_APPLICATION: { icon: "📋", color: "bg-blue-100 dark:bg-blue-900/30" },
  APPLICATION_ACCEPTED: { icon: "✅", color: "bg-green-100 dark:bg-green-900/30" },
  APPLICATION_REJECTED: { icon: "❌", color: "bg-red-100 dark:bg-red-900/30" },
  DEAL_UPDATED: { icon: "🤝", color: "bg-purple-100 dark:bg-purple-900/30" },
  DEAL_COMPLETED: { icon: "🎉", color: "bg-yellow-100 dark:bg-yellow-900/30" },
  NEW_MESSAGE: { icon: "💬", color: "bg-cyan-100 dark:bg-cyan-900/30" },
  NEW_REVIEW: { icon: "⭐", color: "bg-orange-100 dark:bg-orange-900/30" },
  PAYMENT_RECEIVED: { icon: "💰", color: "bg-emerald-100 dark:bg-emerald-900/30" },
  CAMPAIGN_UPDATE: { icon: "📢", color: "bg-indigo-100 dark:bg-indigo-900/30" },
};

const DEFAULT_CONFIG = { icon: "🔔", color: "bg-muted" };

export default function NotificationsPage() {
  const currentUser = useCurrentUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize: 20 };
      if (filter === "unread") params.isRead = false;
      const data = await api.notifications.list(params);
      setNotifications(data.data);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      toast.error("Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      toast.success("Todas marcadas como leidas");
      loadNotifications();
    } catch (err) {
      toast.error("Error");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!currentUser?.isLoaded) return null;

  // Group notifications by date
  const grouped = groupByDate(notifications);

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-sm text-muted-foreground">
            {total} notificaciones{unreadCount > 0 && ` (${unreadCount} sin leer)`}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-primary hover:underline"
          >
            Marcar todo como leido
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {f === "all" ? "Todas" : "Sin leer"}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium">No hay notificaciones</p>
          <p className="text-sm mt-1">
            {filter === "unread"
              ? "Estas al dia! No hay notificaciones sin leer."
              : "Las notificaciones apareceran aca cuando haya actividad."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ label, items }) => (
            <div key={label}>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
                {label}
              </h3>
              <div className="space-y-1">
                {items.map((notif) => {
                  const config = NOTIF_CONFIG[notif.type] || DEFAULT_CONFIG;
                  const link = getNotifLink(notif);

                  const content = (
                    <div
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg transition-colors",
                        !notif.isRead && "bg-primary/5",
                        "hover:bg-muted/50",
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm", config.color)}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm", !notif.isRead && "font-medium")}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatNotifTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  );

                  return link ? (
                    <Link key={notif.id} href={link}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notif.id}>{content}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {(hasMore || page > 1) && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            Pagina {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================
// HELPERS
// =============================================

function groupByDate(items: NotificationItem[]) {
  const groups: { label: string; items: NotificationItem[] }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const todayItems: NotificationItem[] = [];
  const yesterdayItems: NotificationItem[] = [];
  const weekItems: NotificationItem[] = [];
  const olderItems: NotificationItem[] = [];

  for (const item of items) {
    const d = new Date(item.createdAt);
    if (d >= today) todayItems.push(item);
    else if (d >= yesterday) yesterdayItems.push(item);
    else if (d >= weekAgo) weekItems.push(item);
    else olderItems.push(item);
  }

  if (todayItems.length) groups.push({ label: "Hoy", items: todayItems });
  if (yesterdayItems.length) groups.push({ label: "Ayer", items: yesterdayItems });
  if (weekItems.length) groups.push({ label: "Esta semana", items: weekItems });
  if (olderItems.length) groups.push({ label: "Anteriores", items: olderItems });

  return groups;
}

function getNotifLink(notif: NotificationItem): string | null {
  const data = notif.data as Record<string, string> | null;
  if (!data) return null;

  if (data.campaignSlug) return `/campaigns/${data.campaignSlug}`;
  if (data.dealId) return `/deals`;
  if (data.senderId) return `/messages?with=${data.senderId}`;
  if (data.creatorSlug) return `/creators/${data.creatorSlug}`;

  return null;
}

function formatNotifTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} dias`;

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
