import api from "./api";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "ACTIVITY_STATUS_CHANGED"
  | "STOCK_LOW"
  | "PURCHASE_ORDER_UPDATED"
  | "MAINTENANCE_PLAN_ASSIGNED"
  | "MAINTENANCE_PLAN_DUE";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const response = await api.get<AppNotification[]>("/notifications");
  return response.data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await api.get<{ count: number }>("/notifications/unread-count");
  return response.data.count;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
