import api from "./api";
import type {
  MaintenancePlan,
  MaintenancePlanPayload,
  MaintenancePlanStatus,
} from "../types/maintenancePlan";

const BASE_URL = "/maintenance-plans";

export async function getMaintenancePlans(): Promise<MaintenancePlan[]> {
  const response = await api.get<MaintenancePlan[]>(BASE_URL);
  return response.data;
}

export async function getMyMaintenancePlans(): Promise<MaintenancePlan[]> {
  const response = await api.get<MaintenancePlan[]>(`${BASE_URL}/my`);
  return response.data;
}

/**
 * Mes plans de maintenance, toutes usines confondues. Utilisé par le
 * portail prestataire.
 */
export async function getAssignedToMeMaintenancePlans(): Promise<MaintenancePlan[]> {
  const response = await api.get<MaintenancePlan[]>(`${BASE_URL}/assigned-to-me`);
  return response.data;
}

export async function getMaintenancePlanById(
  id: number
): Promise<MaintenancePlan> {
  const response = await api.get<MaintenancePlan>(`${BASE_URL}/${id}`);
  return response.data;
}

export async function createMaintenancePlan(
  payload: MaintenancePlanPayload
): Promise<MaintenancePlan> {
  const response = await api.post<MaintenancePlan>(BASE_URL, payload);
  return response.data;
}

export async function updateMaintenancePlan(
  id: number,
  payload: MaintenancePlanPayload
): Promise<MaintenancePlan> {
  const response = await api.put<MaintenancePlan>(`${BASE_URL}/${id}`, payload);
  return response.data;
}

export async function updateMaintenancePlanStatus(
  id: number,
  status: MaintenancePlanStatus
): Promise<MaintenancePlan> {
  const response = await api.patch<MaintenancePlan>(`${BASE_URL}/${id}/status`, { status });
  return response.data;
}
export async function deleteMaintenancePlan(id: number): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}

