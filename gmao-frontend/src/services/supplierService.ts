import api from "./api";

import type {
  Supplier,
  SupplierRequest,
} from "../types/supplier";

function createFormData(
  request: SupplierRequest,
  logo: File | null,
): FormData {
  const formData = new FormData();
  const supplierBlob = new Blob([JSON.stringify(request)], {
    type: "application/json",
  });

  formData.append("supplier", supplierBlob);

  if (logo) {
    formData.append("logo", logo);
  }

  return formData;
}

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
  logo: File | null = null,
): Promise<Supplier> {
  const response = await api.post<Supplier>(
    "/suppliers",
    createFormData(request, logo),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function updateSupplier(
  id: number,
  request: SupplierRequest,
  logo: File | null = null,
): Promise<Supplier> {
  const response = await api.put<Supplier>(
    `/suppliers/${id}`,
    createFormData(request, logo),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function deleteSupplier(id: number): Promise<void> {
  await api.delete(`/suppliers/${id}`);
}