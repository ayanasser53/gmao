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

const WINDOWS_1252_BYTES: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function repairMojibakeOnce(value: string): string {
  if (!/[ÃÂâ]/.test(value)) {
    return value;
  }

  try {
    const bytes = Array.from(value, (character) => {
      const code = character.codePointAt(0) ?? 0;

      return code <= 0xff ? code : WINDOWS_1252_BYTES[code] ?? code;
    });

    if (bytes.some((byte) => byte > 0xff)) {
      return value;
    }

    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  } catch {
    return value;
  }
}

const REPLACEMENT_CHARACTER_FIXES: Array<[RegExp, string]> = [
  [/t�che/gi, "tâche"],
  [/t�ches/gi, "tâches"],
  [/activit�/gi, "activité"],
  [/activit�s/gi, "activités"],
  [/pi�ce/gi, "pièce"],
  [/pi�ces/gi, "pièces"],
  [/d�tach�e/gi, "détachée"],
  [/d�tach�es/gi, "détachées"],
  [/�quipement/gi, "équipement"],
  [/�quipements/gi, "équipements"],
  [/� jour/gi, "à jour"],
  [/assign�e/gi, "assignée"],
  [/assign�/gi, "assigné"],
  [/planifi�e/gi, "planifiée"],
  [/planifi�/gi, "planifié"],
  [/annul�e/gi, "annulée"],
  [/annul�/gi, "annulé"],
  [/termin�e/gi, "terminée"],
  [/termin�/gi, "terminé"],
  [/cr��e/gi, "créée"],
  [/cr��/gi, "créé"],
  [/r�alis�e/gi, "réalisée"],
  [/r�alis�/gi, "réalisé"],
  [/modifi�e/gi, "modifiée"],
  [/modifi�/gi, "modifié"],
];

function repairReplacementCharacters(value: string): string {
  return REPLACEMENT_CHARACTER_FIXES.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}

function normalizeNotificationText(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  let normalized = value;

  for (let index = 0; index < 3; index += 1) {
    const repaired = repairMojibakeOnce(normalized);

    if (repaired === normalized) {
      return repairReplacementCharacters(repaired);
    }

    normalized = repaired;
  }

  return repairReplacementCharacters(normalized);
}

function normalizeNotification(notification: AppNotification): AppNotification {
  return {
    ...notification,
    title: normalizeNotificationText(notification.title) ?? "",
    message: normalizeNotificationText(notification.message),
  };
}

export async function getNotifications(): Promise<AppNotification[]> {
  const response = await api.get<AppNotification[]>("/notifications");
  return response.data.map(normalizeNotification);
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
