import api from "./api";

import type {
  CreateUnitRequest,
  MeasurementUnit,
  UpdateUnitRequest,
} from "../types/unit";

export async function getUnits(): Promise<MeasurementUnit[]> {
  const response =
    await api.get<MeasurementUnit[]>("/units");

  return response.data;
}

export async function getUnitById(
  id: number,
): Promise<MeasurementUnit> {
  const response =
    await api.get<MeasurementUnit>(`/units/${id}`);

  return response.data;
}

export async function createUnit(
  request: CreateUnitRequest,
): Promise<MeasurementUnit> {
  const response = await api.post<MeasurementUnit>(
    "/units",
    request,
  );

  return response.data;
}

export async function updateUnit(
  id: number,
  request: UpdateUnitRequest,
): Promise<MeasurementUnit> {
  const response = await api.put<MeasurementUnit>(
    `/units/${id}`,
    request,
  );

  return response.data;
}

export async function deleteUnit(
  id: number,
): Promise<void> {
  await api.delete(`/units/${id}`);
}