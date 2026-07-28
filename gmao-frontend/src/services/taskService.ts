import type {
  CreateTaskInput,
  Task,
  TaskListItem,
  TaskStatus,
  TaskSummary,
  UpdateTaskInput,
} from "../types/task";

import { getImpersonatedUsine } from "./impersonation";

const BACKEND_URL = "http://localhost:8090";

/**
 * The backend requires a JWT on every route except /api/auth/** and
 * /uploads/**. Adjust the localStorage key below ("token") if your
 * login flow stores it under a different name.
 *
 * Ce fichier utilise fetch() directement (pas le client axios partagé
 * services/api.ts), donc l'en-tête X-Usine-Context utilisé par le SUPERADMIN
 * pour consulter le dashboard d'une usine doit être ajouté ici aussi.
 */
function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const impersonatedUsine = getImpersonatedUsine();

  if (impersonatedUsine) {
    headers["X-Usine-Context"] = String(impersonatedUsine.id);
  }

  return headers;
}

async function handle<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Erreur ${response.status}`;

    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      // no JSON body, keep the generic message
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getTasks(): Promise<TaskListItem[]> {
  const response = await fetch(`${BACKEND_URL}/api/tasks`, {
    headers: authHeaders(),
  });
  return handle<TaskListItem[]>(response);
}

export async function getMyCreatedTasks(): Promise<TaskListItem[]> {
  const response = await fetch(`${BACKEND_URL}/api/tasks/my-created`, {
    headers: authHeaders(),
  });
  return handle<TaskListItem[]>(response);
}

export async function getMyCreatedTaskById(id: number): Promise<Task> {
  const response = await fetch(`${BACKEND_URL}/api/tasks/my-created/${id}`, {
    headers: authHeaders(),
  });
  const task = await handle<Task>(response);

  return {
    ...task,
    assignees: task.assignees ?? [],
    assignedTo: task.assignedTo ?? [],
    tags: task.tags ?? [],
    spareParts: task.spareParts ?? [],
    documents: task.documents ?? [],
  };
}

export async function getTaskSummary(): Promise<TaskSummary> {
  const response = await fetch(`${BACKEND_URL}/api/tasks/summary`, {
    headers: authHeaders(),
  });
  return handle<TaskSummary>(response);
}

export async function getTaskById(id: number): Promise<Task> {
  const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
    headers: authHeaders(),
  });
  const task = await handle<Task>(response);

  return {
    ...task,
    assignees: task.assignees ?? [],
    assignedTo: task.assignedTo ?? [],
    tags: task.tags ?? [],
    spareParts: task.spareParts ?? [],
    documents: task.documents ?? [],
  };
}

function buildFormData(
  payload: CreateTaskInput | UpdateTaskInput,
  files: File[],
): FormData {
  const formData = new FormData();

  formData.append(
    "task",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );

  files.forEach((file) => {
    formData.append("documents", file);
  });

  return formData;
}

export async function createTask(
  payload: CreateTaskInput,
  files: File[] = [],
): Promise<Task> {
  const response = await fetch(`${BACKEND_URL}/api/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: buildFormData(payload, files),
  });

  return handle<Task>(response);
}

export async function updateTask(
  id: number,
  payload: UpdateTaskInput,
  files: File[] = [],
): Promise<Task> {
  const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: buildFormData(payload, files),
  });

  return handle<Task>(response);
}

export async function updateTaskStatus(
  id: number,
  status: TaskStatus,
): Promise<Task> {
  const response = await fetch(`${BACKEND_URL}/api/tasks/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  });

  return handle<Task>(response);
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return handle<void>(response);
}

export interface TagOption {
  id: number;
  label: string;
  color: string;
}

export async function fetchTagOptions(): Promise<TagOption[]> {
  const response = await fetch(`${BACKEND_URL}/api/tags`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    console.error(`Erreur ${response.status} en chargeant /api/tags`);
    return [];
  }

  const data = await response.json();

  return (Array.isArray(data) ? data : []).map((tag) => ({
    id: tag.id,
    label: tag.name,
    color: tag.color || "#7d8793",
  }));
}

export async function fetchOptionList(
  path: string,
  labelOf: (item: any) => string,
): Promise<{ id: number; label: string }[]> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    console.error(`Erreur ${response.status} en chargeant ${path}`);
    return [];
  }

  const data = await response.json();

  return (Array.isArray(data) ? data : []).map((item) => ({
    id: item.id,
    label: labelOf(item),
  }));
}