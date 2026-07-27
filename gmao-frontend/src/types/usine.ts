export interface Usine {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  userCount: number;
  createdAt: string;
}

export interface UsineRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}
