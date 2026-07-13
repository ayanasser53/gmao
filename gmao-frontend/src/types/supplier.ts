export type SupplierVisibility = "PRIVATE" | "PUBLIC";

export interface Supplier {
  id: number;
  name: string;
  description: string | null;
  email: string;
  website: string | null;
  sirenOrSiret: string | null;
  reference: string | null;
  phone: string | null;
  fax: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  visibility: SupplierVisibility;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRequest {
  name: string;
  description: string;
  email: string;
  website: string;
  sirenOrSiret: string;
  reference: string;
  phone: string;
  fax: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  visibility: SupplierVisibility;
  logoUrl: string;
}