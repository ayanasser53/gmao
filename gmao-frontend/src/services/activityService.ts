import api from "./api";
import type {
  Activity,
  ActivityRequest,
  ActivityStatus,
} from "../types/activity";

function normalizeActivity(activity: Activity): Activity {
  return {
    ...activity,
    spareParts: activity.spareParts ?? [],
    intervenants: activity.intervenants ?? [],
    additionalCosts: activity.additionalCosts ?? [],
    measureReadings: activity.measureReadings ?? [],
    documents: activity.documents ?? [],
  };
}

function buildActivityFormData(data: ActivityRequest, files: File[]) {
  const formData = new FormData();

  formData.append(
    "activity",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );

  files.forEach((file) => {
    formData.append("documents", file);
  });

  return formData;
}

function getActivityBody(data: ActivityRequest, files: File[] = []) {
  return files.length > 0 ? buildActivityFormData(data, files) : data;
}

export async function getActivities(): Promise<Activity[]> {
  const response = await api.get<Activity[]>("/activities");
  return response.data.map(normalizeActivity);
}

export async function getInProgressActivities(): Promise<Activity[]> {
  const response = await api.get<Activity[]>("/activities/in-progress");
  return response.data.map(normalizeActivity);
}

export async function getLateActivities(): Promise<Activity[]> {
  const response = await api.get<Activity[]>("/activities/late");
  return response.data.map(normalizeActivity);
}

export async function getActivityHistory(): Promise<Activity[]> {
  const response = await api.get<Activity[]>("/activities/history");
  return response.data.map(normalizeActivity);
}

export async function getActivitiesByTask(taskId: number): Promise<Activity[]> {
  const response = await api.get<Activity[]>(`/tasks/${taskId}/activities`);
  return response.data.map(normalizeActivity);
}

export async function createActivity(
  data: ActivityRequest,
  files: File[] = [],
): Promise<Activity> {
  const response = await api.post<Activity>("/activities", getActivityBody(data, files));
  return response.data;
}

export async function createActivityForTask(
  taskId: number,
  data: ActivityRequest,
  files: File[] = [],
): Promise<Activity> {
  const response = await api.post<Activity>(
    `/tasks/${taskId}/activities`,
    getActivityBody(data, files),
  );
  return response.data;
}

export async function createActivityAndFinishTask(
  taskId: number,
  data: ActivityRequest,
  files: File[] = [],
): Promise<Activity> {
  const response = await api.post<Activity>(
    `/tasks/${taskId}/activities/finish`,
    getActivityBody(data, files),
  );
  return response.data;
}

export async function updateActivity(
  id: number,
  data: ActivityRequest,
  files: File[] = [],
): Promise<Activity> {
  const response = await api.put<Activity>(
    `/activities/${id}`,
    getActivityBody(data, files),
  );
  return response.data;
}

export async function updateActivityStatus(
  id: number,
  status: ActivityStatus,
): Promise<Activity> {
  const response = await api.patch<Activity>(
    `/activities/${id}/status`,
    null,
    {
      params: { status },
    },
  );

  return response.data;
}

export async function deleteActivity(id: number): Promise<void> {
  await api.delete(`/activities/${id}`);
}
