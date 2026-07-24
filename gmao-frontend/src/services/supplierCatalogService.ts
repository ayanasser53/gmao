import api from "./api";

export type SupplierCatalogItemRequest = {
  equipment: string;
  category: string;
  brand: string;
  manufacturerReference: string;
  gtin: string;
  supplierName: string;
  supplierLogo: string;
  supplierSiren: string;
  supplierPhone: string;
  supplierDescription: string;
  image: string;
};

export type SupplierCatalogItemResponse = {
  id: number;
  equipment: string;
  category: string | null;
  brand: string | null;
  manufacturerReference: string | null;
  gtin: string | null;
  supplierId: number;
  image: string | null;
};

export type SupplierCatalogSupplierResponse = {
  id: number;
  name: string;
  logo: string | null;
  siren: string | null;
  phone: string | null;
  description: string | null;
  official: boolean;
};

export type SupplierCatalogResponse = {
  items: SupplierCatalogItemResponse[];
  suppliers: SupplierCatalogSupplierResponse[];
};

export async function getImportedSupplierCatalog(): Promise<SupplierCatalogResponse> {
  const response = await api.get<SupplierCatalogResponse>("/supplier-catalog");
  return response.data;
}

export async function importSupplierCatalog(
  items: SupplierCatalogItemRequest[],
): Promise<SupplierCatalogResponse> {
  const response = await api.post<SupplierCatalogResponse>("/supplier-catalog/import", {
    items,
  });
  return response.data;
}

export async function deleteSupplierCatalogItem(id: number): Promise<void> {
  await api.delete(`/supplier-catalog/items/${id}`);
}

export async function uploadSupplierCatalogItemImage(
  id: number,
  image: File,
): Promise<SupplierCatalogItemResponse> {
  const formData = new FormData();
  formData.append("image", image);

  const response = await api.post<SupplierCatalogItemResponse>(
    `/supplier-catalog/items/${id}/image`,
    formData,
  );

  return response.data;
}
