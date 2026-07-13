import api from "./api";

import type {
  Supplier,
  SupplierRequest,
} from "../types/supplier";

export async function getSuppliers(): Promise<Supplier[]> {
  const response = await api.get<Supplier[]>("/suppliers");
  return response.data;
}

export async function getSupplierById(id: number): Promise<Supplier> {
  const response = await api.get<Supplier>(`/suppliers/${id}`);
  return response.data;
}

export async function createSupplier(
  request: SupplierRequest,
): Promise<Supplier> {
  const response = await api.post<Supplier>("/suppliers", request);
  return response.data;
}

export async function updateSupplier(
  id: number,
  request: SupplierRequest,
): Promise<Supplier> {
  const response = await api.put<Supplier>(`/suppliers/${id}`, request);
  return response.data;
}

export async function deleteSupplier(id: number): Promise<void> {
  await api.delete(`/suppliers/${id}`);
}