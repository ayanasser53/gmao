import api from "./api";

import type {
  CreateTagGroupRequest,
  TagGroup,
  UpdateTagGroupRequest,
} from "../types/tag";

export async function getTagGroups(): Promise<TagGroup[]> {
  const response =
    await api.get<TagGroup[]>("/tag-groups");

  return response.data;
}

export async function createTagGroup(
  request: CreateTagGroupRequest,
): Promise<TagGroup> {
  const response = await api.post<TagGroup>(
    "/tag-groups",
    request,
  );

  return response.data;
}

export async function updateTagGroup(
  id: number,
  request: UpdateTagGroupRequest,
): Promise<TagGroup> {
  const response = await api.put<TagGroup>(
    `/tag-groups/${id}`,
    request,
  );

  return response.data;
}

export async function deleteTagGroup(
  id: number,
): Promise<void> {
  await api.delete(`/tag-groups/${id}`);
}