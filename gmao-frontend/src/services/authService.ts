import api from "./api";

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
} from "../types/auth";

export async function registerAdmin(
  data: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>(
    "/auth/register",
    data,
  );

  return response.data;
}

export async function loginAdmin(
  data: LoginRequest,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    "/auth/login",
    data,
  );

  return response.data;
}

export function saveAuthentication(authData: AuthResponse): void {
  localStorage.setItem("token", authData.token);
  localStorage.setItem("userId", String(authData.userId));
  localStorage.setItem("email", authData.email);
  localStorage.setItem("role", authData.role);
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function getAuthenticatedUserId(): number | null {
  const value = localStorage.getItem("userId");
  return value ? Number(value) : null;
}

export function getAuthenticatedEmail(): string {
  return localStorage.getItem("email") ?? "";
}

export function getAuthenticatedRole(): string {
  return localStorage.getItem("role") ?? "";
}

export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
  localStorage.removeItem("role");
}