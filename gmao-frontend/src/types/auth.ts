export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  role: string;
  usineId: number | null;
  usineName: string | null;
}

export interface ApiErrorResponse {
  status?: number;
  error?: string;
  message?: string;
  timestamp?: string;
}