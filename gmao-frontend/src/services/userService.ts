import api from "./api";
import type {
  UserDetail,
  UserInviteResponse,
  UserRequest,
  UserSummary,
} from "../types/user";

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

export async function inviteUser(payload: UserRequest): Promise<UserInviteResponse> {
  const response = await api.post<UserInviteResponse>("/users", payload);
  return response.data;
}

export async function updateUser(
  id: number,
  payload: UserRequest,
): Promise<UserDetail> {
  const response = await api.put<UserDetail>(`/users/${id}`, payload);
  return response.data;
}

export async function setUserActive(
  id: number,
  active: boolean,
): Promise<UserDetail> {
  const response = await api.patch<UserDetail>(
    `/users/${id}/active?active=${active}`,
  );
  return response.data;
}
