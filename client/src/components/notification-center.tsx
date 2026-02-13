import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, X, Clock, AlertTriangle, Lightbulb, Calendar, Users, FolderKanban, Sparkles } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: string | null;
  read: number;
  created_at: string;
}

interface NotificationResponse {
  notifications: Notification[];
  unread_count: number;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  meeting_reminder: Calendar,
  overdue_alert: AlertTriangle,
  project_deadline: Clock,
  daily_briefing: Sparkles,
  darvis_insight: Lightbulb,
  contributor_alert: Users,
  project_update: FolderKanban,
};

const TYPE_COLORS: Record<string, string> = {
  meeting_reminder: "text-blue-500",
  overdue_alert: "text-red-500",
  project_deadline: "text-amber-500",
  daily_briefing: "text-emerald-500",
  darvis_insight: "text-purple-500",
  contributor_alert: "text-cyan-500",
  project_update: "text-indigo-500",
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr + "Z");
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}j lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}h lalu`;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useQuery<NotificationResponse>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/count"],
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = countData?.count || 0;
  const notifications = notifData?.notifications || [];

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={`toggle-elevate ${isOpen ? "toggle-elevated" : ""}`}
        data-testid="button-notifications"
        title="Notifikasi"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1"
            data-testid="badge-notification-count"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-80 sm:w-96 max-h-[70vh] rounded-md border bg-card shadow-lg z-50 flex flex-col"
          data-testid="panel-notifications"
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
            <h3 className="text-xs font-semibold" data-testid="text-notifications-title">Notifikasi</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => markAllReadMutation.mutate()}
                  className="h-6 w-6"
                  title="Tandai semua dibaca"
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
                data-testid="button-close-notifications"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground" data-testid="text-no-notifications">
                Belum ada notifikasi
              </div>
            ) : (
              notifications.map((notif) => {
                const IconComp = TYPE_ICONS[notif.type] || Bell;
                const colorClass = TYPE_COLORS[notif.type] || "text-muted-foreground";
                return (
                  <div
                    key={notif.id}
                    className={`flex gap-2 px-3 py-2.5 border-b last:border-b-0 cursor-pointer hover-elevate ${notif.read === 0 ? "bg-muted/30" : ""}`}
                    onClick={() => {
                      if (notif.read === 0) markReadMutation.mutate(notif.id);
                    }}
                    data-testid={`notification-item-${notif.id}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs font-medium leading-tight ${notif.read === 0 ? "" : "text-muted-foreground"}`} data-testid={`text-notification-title-${notif.id}`}>
                          {notif.title}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id); }}
                          className="shrink-0 text-muted-foreground/50 hover:text-destructive"
                          data-testid={`button-delete-notification-${notif.id}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-line leading-snug line-clamp-3" data-testid={`text-notification-message-${notif.id}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1" data-testid={`text-notification-time-${notif.id}`}>
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
