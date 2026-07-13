export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  userId: number;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  role: string;
}

export interface ApiErrorResponse {
  status?: number;
  error?: string;
  message?: string;
  timestamp?: string;
}