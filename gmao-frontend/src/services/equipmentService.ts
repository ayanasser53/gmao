import api from "./api";

import type {
  Equipment,
  EquipmentPayload,
} from "../types/equipment";

function createFormData(
  payload: EquipmentPayload,
  image: File | null,
): FormData {
  const formData = new FormData();

  const equipmentBlob = new Blob(
    [JSON.stringify(payload)],
    {
      type: "application/json",
    },
  );

  formData.append("equipment", equipmentBlob);

  if (image) {
    formData.append("image", image);
  }

  return formData;
}

export async function getEquipment(): Promise<Equipment[]> {
  const response =
    await api.get<Equipment[]>("/equipment");

  return response.data;
}

export async function getEquipmentById(
  id: number,
): Promise<Equipment> {
  const response =
    await api.get<Equipment>(`/equipment/${id}`);

  return response.data;
}

export async function createEquipment(
  payload: EquipmentPayload,
  image: File | null,
): Promise<Equipment> {
  const formData = createFormData(
    payload,
    image,
  );

  const response = await api.post<Equipment>(
    "/equipment",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function updateEquipment(
  id: number,
  payload: EquipmentPayload,
  image: File | null,
): Promise<Equipment> {
  const formData = createFormData(
    payload,
    image,
  );

  const response = await api.put<Equipment>(
    `/equipment/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function deleteEquipment(
  id: number,
): Promise<void> {
  await api.delete(`/equipment/${id}`);
}