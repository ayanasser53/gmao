import api from "./api";

import type {
  CostCenter,
  CostCenterRequest,
} from "../types/costCenter";

export async function getCostCenters(): Promise<CostCenter[]> {
  const response =
    await api.get<CostCenter[]>("/cost-centers");

  return response.data;
}

export async function createCostCenter(
  request: CostCenterRequest,
): Promise<CostCenter> {
  const response = await api.post<CostCenter>(
    "/cost-centers",
    request,
  );

  return response.data;
}

export async function updateCostCenter(
  id: number,
  request: CostCenterRequest,
): Promise<CostCenter> {
  const response = await api.put<CostCenter>(
    `/cost-centers/${id}`,
    request,
  );

  return response.data;
}

export async function deleteCostCenter(
  id: number,
): Promise<void> {
  await api.delete(`/cost-centers/${id}`);
}