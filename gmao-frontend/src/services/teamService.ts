import api from "./api";
import type { Team, TeamRequest } from "../types/team";

export async function getTeams(): Promise<Team[]> {
  const response = await api.get<Team[]>("/teams");
  return response.data;
}

export async function getTeamById(id: number): Promise<Team> {
  const response = await api.get<Team>(`/teams/${id}`);
  return response.data;
}

export async function createTeam(payload: TeamRequest): Promise<Team> {
  const response = await api.post<Team>("/teams", payload);
  return response.data;
}

export async function updateTeam(
  id: number,
  payload: TeamRequest,
): Promise<Team> {
  const response = await api.put<Team>(`/teams/${id}`, payload);
  return response.data;
}

export async function deleteTeam(id: number): Promise<void> {
  await api.delete(`/teams/${id}`);
}