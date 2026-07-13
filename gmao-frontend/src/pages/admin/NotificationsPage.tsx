import {
  Bell,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  ShoppingCart,
  Wrench,
} from "lucide-react";

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  date: string;
  unread: boolean;
  type: "task" | "equipment" | "purchase" | "stock";
}

const notifications: NotificationItem[] = [
  {
    id: 1,
    title: "Nouvelle tâche créée",
    description:
      "Une intervention de maintenance a été créée pour l’équipement Presse hydraulique.",
    date: "Il y a 10 minutes",
    unread: true,
    type: "task",
  },
  {
    id: 2,
    title: "Stock minimum atteint",
    description:
      "Le stock de la pièce Roulement 6205 est inférieur au seuil minimum.",
    date: "Il y a 1 heure",
    unread: true,
    type: "stock",
  },
  {
    id: 3,
    title: "Commande reçue",
    description:
      "La commande d’achat PO-2026-001 a été marquée comme reçue.",
    date: "Hier à 16:20",
    unread: false,
    type: "purchase",
  },
  {
    id: 4,
    title: "Équipement mis à jour",
    description:
      "Les informations de l’équipement Compresseur principal ont été modifiées.",
    date: "Hier à 11:40",
    unread: false,
    type: "equipment",
  },
];

function getNotificationIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "task":
      return <ClipboardList size={22} />;

    case "equipment":
      return <Wrench size={22} />;

    case "purchase":
      return <ShoppingCart size={22} />;

    case "stock":
      return <PackageCheck size={22} />;

    default:
      return <Bell size={22} />;
  }
}

function NotificationsPage() {
  const unreadCount = notifications.filter(
    (notification) => notification.unread,
  ).length;

  return (
    <section className="admin-page notifications-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-page-eyebrow">
            Espace administrateur
          </span>

          <h1>Notifications</h1>

          <p>
            Consultez les événements importants liés à la maintenance,
            aux stocks et aux commandes.
          </p>
        </div>

        <button
          type="button"
          className="secondary-admin-button"
        >
          <CheckCircle2 size={18} />
          Tout marquer comme lu
        </button>
      </div>

      <div className="notification-summary-grid">
        <article className="notification-summary-card">
          <div className="notification-summary-icon">
            <Bell size={25} />
          </div>

          <div>
            <span>Total</span>
            <strong>{notifications.length}</strong>
          </div>
        </article>

        <article className="notification-summary-card">
          <div className="notification-summary-icon unread">
            <Bell size={25} />
          </div>

          <div>
            <span>Non lues</span>
            <strong>{unreadCount}</strong>
          </div>
        </article>
      </div>

      <div className="notifications-panel">
        <div className="notifications-panel-header">
          <div>
            <h2>Notifications récentes</h2>
            <p>
              Les dernières mises à jour de votre application.
            </p>
          </div>
        </div>

        <div className="notifications-list">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`notification-item ${
                notification.unread
                  ? "notification-item-unread"
                  : ""
              }`}
            >
              <div className="notification-item-icon">
                {getNotificationIcon(notification.type)}
              </div>

              <div className="notification-item-content">
                <div className="notification-item-heading">
                  <h3>{notification.title}</h3>

                  {notification.unread && (
                    <span className="notification-unread-dot" />
                  )}
                </div>

                <p>{notification.description}</p>

                <span className="notification-date">
                  {notification.date}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default NotificationsPage;