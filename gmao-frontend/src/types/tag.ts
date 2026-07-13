export interface Tag {
  id: number;
  name: string;
  code: string;
  color: string;
  groupId: number | null;
  groupName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagRequest {
  name: string;
  code: string;
  color: string;
  groupId: number | null;
}

export type UpdateTagRequest = CreateTagRequest;

export interface TagGroup {
  id: number;
  name: string;
  singleChoice: boolean;
  mandatory: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagGroupRequest {
  name: string;
  tagIds: number[];
  singleChoice: boolean;
  mandatory: boolean;
}

export type UpdateTagGroupRequest =
  CreateTagGroupRequest;