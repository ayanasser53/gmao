import { AxiosError } from "axios";
import {
  Bell,
  CalendarCheck,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { useWorkspaceBasePath } from "../../hooks/useWorkspaceBasePath";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
  type NotificationType,
} from "../../services/notificationService";

import "./notifications-styles.css";

type FilterTab = "ALL" | "UNREAD";

interface NotificationTypeMeta {
  icon: ReactNode;
  className: string;
}

const TYPE_META: Record<NotificationType, NotificationTypeMeta> = {
  TASK_ASSIGNED: {
    icon: <ClipboardList size={18} />,
    className: "notif-icon-blue",
  },
  TASK_STATUS_CHANGED: {
    icon: <ClipboardList size={18} />,
    className: "notif-icon-blue",
  },
  ACTIVITY_STATUS_CHANGED: {
    icon: <CheckCircle2 size={18} />,
    className: "notif-icon-green",
  },
  STOCK_LOW: {
    icon: <PackageCheck size={18} />,
    className: "notif-icon-orange",
  },
  PURCHASE_ORDER_UPDATED: {
    icon: <ShoppingCart size={18} />,
    className: "notif-icon-purple",
  },
  MAINTENANCE_PLAN_ASSIGNED: {
    icon: <CalendarCheck size={18} />,
    className: "notif-icon-blue",
  },
  MAINTENANCE_PLAN_DUE: {
    icon: <CalendarCheck size={18} />,
    className: "notif-icon-red",
  },
};

function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < 1) {
    return "A l'instant";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} j`;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

function NotificationsPage() {
  const navigate = useNavigate();
  const basePath = useWorkspaceBasePath();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setError("");
        setNotifications(await getNotifications());
      } catch (requestError) {
        console.error(requestError);

        const axiosError = requestError as AxiosError<{ message?: string }>;
        const status = axiosError.response?.status;
        const backendMessage = axiosError.response?.data?.message;

        setError(
          `Impossible de charger les notifications` +
            (status ? ` (erreur ${status})` : "") +
            (backendMessage ? ` : ${backendMessage}` : "."),
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const visibleNotifications = useMemo(
    () =>
      activeTab === "UNREAD"
        ? notifications.filter((notification) => !notification.read)
        : notifications,
    [notifications, activeTab],
  );

  async function handleMarkAllAsRead(): Promise<void> {
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true })),
      );
    } catch (requestError) {
      console.error(requestError);
    }
  }

  async function handleNotificationClick(notification: AppNotification): Promise<void> {
    if (!notification.read) {
      try {
        await markNotificationAsRead(notification.id);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, read: true } : item,
          ),
        );
      } catch (requestError) {
        console.error(requestError);
      }
    }

    if (notification.link) {
      navigate(`${basePath}${notification.link}`);
    }
  }

  return (
    <section className="notif-page">
      <div className="notif-page-header">
        <h1>Notifications</h1>

        <button
          type="button"
          className="notif-mark-all-link"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck size={16} />
          Tout marquer comme lu
        </button>
      </div>

      <div className="notif-card">
        <div className="notif-tabs">
          <button
            type="button"
            className={`notif-tab ${activeTab === "ALL" ? "notif-tab-active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            Tout
          </button>

          <button
            type="button"
            className={`notif-tab ${activeTab === "UNREAD" ? "notif-tab-active" : ""}`}
            onClick={() => setActiveTab("UNREAD")}
          >
            Non lues
            {unreadCount > 0 && <span className="notif-tab-badge">{unreadCount}</span>}
          </button>
        </div>

        {error && <div className="admin-form-error">{error}</div>}

        <div className="notif-list">
          {loading ? (
            <div className="resource-loading">Chargement...</div>
          ) : visibleNotifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={28} />
              <p>
                {activeTab === "UNREAD"
                  ? "Aucune notification non lue."
                  : "Aucune notification pour le moment."}
              </p>
            </div>
          ) : (
            visibleNotifications.map((notification) => {
              const meta = TYPE_META[notification.type] ?? {
                icon: <Bell size={18} />,
                className: "notif-icon-blue",
              };
              const title = notification.title;
              const message = notification.message;

              return (
                <article
                  key={notification.id}
                  className={`notif-row ${!notification.read ? "notif-row-unread" : ""} ${
                    notification.link ? "notif-row-clickable" : ""
                  }`}
                  onClick={() => void handleNotificationClick(notification)}
                >
                  <div className={`notif-row-icon ${meta.className}`}>{meta.icon}</div>

                  <div className="notif-row-body">
                    <div className="notif-row-title-line">
                      <span className="notif-row-title">{title}</span>
                      <span className="notif-row-time">
                        {formatRelativeDate(notification.createdAt)}
                      </span>
                    </div>

                    {message && (
                      <p className="notif-row-message">{message}</p>
                    )}
                  </div>

                  {!notification.read && <span className="notif-row-dot" />}
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default NotificationsPage;
