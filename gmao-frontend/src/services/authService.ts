import api from "./api";

import { clearImpersonatedUsine } from "./impersonation";

import type {
  AuthResponse,
  LoginRequest,
} from "../types/auth";

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
  clearImpersonatedUsine();

  localStorage.setItem("token", authData.token);
  localStorage.setItem("userId", String(authData.userId));
  localStorage.setItem("email", authData.email);
  localStorage.setItem("role", authData.role);

  if (authData.usineId !== null) {
    localStorage.setItem("usineId", String(authData.usineId));
  } else {
    localStorage.removeItem("usineId");
  }

  if (authData.usineName !== null) {
    localStorage.setItem("usineName", authData.usineName);
  } else {
    localStorage.removeItem("usineName");
  }
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

export function isSuperAdmin(): boolean {
  return getAuthenticatedRole() === "SUPERADMIN";
}

export function getAuthenticatedUsineName(): string {
  return localStorage.getItem("usineName") ?? "";
}

export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
  localStorage.removeItem("role");
  localStorage.removeItem("usineId");
  localStorage.removeItem("usineName");
  clearImpersonatedUsine();
}
