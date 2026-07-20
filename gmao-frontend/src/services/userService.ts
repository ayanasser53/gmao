import api from "./api";
import type { UserSummary } from "../types/user";

export async function getUsers(): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>("/users");
  return response.data;
}
