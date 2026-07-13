import api from "./api";

import type {
  CreateTagRequest,
  Tag,
  UpdateTagRequest,
} from "../types/tag";

export async function getTags(): Promise<Tag[]> {
  const response = await api.get<Tag[]>("/tags");
  return response.data;
}

export async function createTag(
  request: CreateTagRequest,
): Promise<Tag> {
  const response = await api.post<Tag>(
    "/tags",
    request,
  );

  return response.data;
}

export async function updateTag(
  id: number,
  request: UpdateTagRequest,
): Promise<Tag> {
  const response = await api.put<Tag>(
    `/tags/${id}`,
    request,
  );

  return response.data;
}

export async function deleteTag(
  id: number,
): Promise<void> {
  await api.delete(`/tags/${id}`);
}