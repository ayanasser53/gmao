import api from "./api";

import type {
  CreateMeasureRequest,
  Measure,
  UpdateMeasureRequest,
} from "../types/measure";

export async function getMeasures(): Promise<Measure[]> {
  const response =
    await api.get<Measure[]>("/measures");

  return response.data;
}

export async function getMeasureById(
  id: number,
): Promise<Measure> {
  const response =
    await api.get<Measure>(`/measures/${id}`);

  return response.data;
}

export async function createMeasure(
  request: CreateMeasureRequest,
): Promise<Measure> {
  const response = await api.post<Measure>(
    "/measures",
    request,
  );

  return response.data;
}

export async function updateMeasure(
  id: number,
  request: UpdateMeasureRequest,
): Promise<Measure> {
  const response = await api.put<Measure>(
    `/measures/${id}`,
    request,
  );

  return response.data;
}

export async function deleteMeasure(
  id: number,
): Promise<void> {
  await api.delete(`/measures/${id}`);
}