export interface TeamMemberSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TeamTagSummary {
  id: number;
  name: string;
  color: string;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  members: TeamMemberSummary[];
  tags: TeamTagSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamRequest {
  name: string;
  description: string;
  memberIds: number[];
  tagIds: number[];
}