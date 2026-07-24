import api from "./api";
import type { UserDetail, UserRequest, UserSummary } from "../types/user";

export async function getUsers(): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>("/users");
  return response.data;
}

export async function getUsersDetailed(): Promise<UserDetail[]> {
  const response = await api.get<UserDetail[]>("/users/detailed");
  return response.data;
}

export async function getCurrentUser(): Promise<UserDetail> {
  const response = await api.get<UserDetail>("/users/me");
  return response.data;
}

export async function inviteUser(payload: UserRequest): Promise<UserDetail> {
  const response = await api.post<UserDetail>("/users", payload);
  return response.data;
}

export async function updateUser(
  id: number,
  payload: UserRequest,
): Promise<UserDetail> {
  const response = await api.put<UserDetail>(`/users/${id}`, payload);
  return response.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}
