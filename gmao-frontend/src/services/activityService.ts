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
  };
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
): Promise<Activity> {
  const response = await api.post<Activity>("/activities", data);
  return response.data;
}

export async function createActivityForTask(
  taskId: number,
  data: ActivityRequest,
): Promise<Activity> {
  const response = await api.post<Activity>(
    `/tasks/${taskId}/activities`,
    data,
  );
  return response.data;
}

export async function createActivityAndFinishTask(
  taskId: number,
  data: ActivityRequest,
): Promise<Activity> {
  const response = await api.post<Activity>(
    `/tasks/${taskId}/activities/finish`,
    data,
  );
  return response.data;
}

export async function updateActivity(
  id: number,
  data: ActivityRequest,
): Promise<Activity> {
  const response = await api.put<Activity>(`/activities/${id}`, data);
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
