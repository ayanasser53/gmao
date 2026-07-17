import api from "./api";
import type {
  MaintenancePlan,
  MaintenancePlanPayload,
} from "../types/maintenancePlan";

const BASE_URL = "/maintenance-plans";

export async function getMaintenancePlans(): Promise<MaintenancePlan[]> {
  const response = await api.get<MaintenancePlan[]>(BASE_URL);
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

export async function deleteMaintenancePlan(id: number): Promise<void> {
  await api.delete(`${BASE_URL}/${id}`);
}
