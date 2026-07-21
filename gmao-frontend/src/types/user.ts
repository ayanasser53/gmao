export interface UserSummary {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  photo: string | null;
  active: boolean;
}

export type UserRole =
  | "ADMIN"
  | "TECHNICIAN"
  | "PRODUCTION"
  | "SERVICE_PROVIDER";

export interface UserTeamSummary {
  id: number;
  name: string;
}

export interface UserTagSummary {
  id: number;
  name: string;
  color: string;
}

export interface UserDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  photo: string | null;
  role: UserRole;
  hourlyRate: number | null;
  active: boolean;
  teams: UserTeamSummary[];
  tags: UserTagSummary[];
}

export interface UserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  hourlyRate: number | null;
  tagIds: number[];
}