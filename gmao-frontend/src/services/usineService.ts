import api from "./api";

import type {
  Usine,
  UsineDashboard,
  UsineGlobalDashboard,
  UsineRequest,
} from "../types/usine";

export async function getUsines(): Promise<Usine[]> {
  const response = await api.get<Usine[]>("/usines");

  return response.data;
}

export async function getUsine(id: number): Promise<Usine> {
  const response = await api.get<Usine>(`/usines/${id}`);

  return response.data;
}

export async function getUsineDashboard(id: number): Promise<UsineDashboard> {
  const response = await api.get<UsineDashboard>(`/usines/${id}/dashboard`);

  return response.data;
}

export async function getGlobalUsineDashboard(): Promise<UsineGlobalDashboard> {
  const response = await api.get<UsineGlobalDashboard>(
    "/usines/dashboard/summary",
  );

  return response.data;
}

export async function createUsine(
  request: UsineRequest,
): Promise<Usine> {
  const response = await api.post<Usine>("/usines", request);

  return response.data;
}

export async function updateUsine(
  id: number,
  request: UsineRequest,
): Promise<Usine> {
  const response = await api.put<Usine>(`/usines/${id}`, request);

  return response.data;
}

export async function setUsineActive(
  id: number,
  active: boolean,
): Promise<Usine> {
  const response = await api.patch<Usine>(
    `/usines/${id}/active?active=${active}`,
  );

  return response.data;
}

export async function deleteUsine(id: number): Promise<void> {
  await api.delete(`/usines/${id}`);
}