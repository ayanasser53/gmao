export type TaskStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "LATE";

export interface TaskEquipmentSummary {
  id: number;
  name: string;
  image: string | null;
  itemCode: string | null;
}

export interface TaskTag {
  id: number;
  name: string;
  code: string;
  color: string;
}

export interface TaskAssignee {
  id: number;
  type: "USER" | "TEAM";
  userId: number | null;
  userFullName: string | null;
  userPhoto: string | null;
  teamId: number | null;
  teamName: string | null;
}

export interface TaskDocument {
  id: number;
  fileName: string;
  filePath: string;
  fileType: string | null;
  isLink: boolean;
  uploadedAt: string;
}

export interface TaskSparePartLine {
  sparePartId: number;
  code: string | null;
  name: string;
  imageUrl: string | null;
  quantity: number;
}

export interface TaskListItem {
  id: number;
  description: string;
  startDate: string;
  startHour: string | null;
  endDate: string;
  endHour: string | null;
  plannedMaintenanceHours: number;
  plannedMaintenanceMinutes: number;
  equipment: TaskEquipmentSummary | null;
  costCenterId: number | null;
  costCenterName: string | null;
  assignees: TaskAssignee[];
  assignedTo: TaskAssignee[];
  tags: TaskTag[];
  status: TaskStatus;
}

export interface Task {
  id: number;
  equipmentOnly: boolean;
  equipment: TaskEquipmentSummary | null;
  description: string;
  allDay: boolean;
  startDate: string;
  startHour: string | null;
  endDate: string;
  endHour: string | null;
  plannedMaintenanceHours: number;
  plannedMaintenanceMinutes: number;
  plannedStoppedHours: number;
  plannedStoppedMinutes: number;
  costCenterId: number | null;
  costCenterName: string | null;
  status: TaskStatus;
  assignees: TaskAssignee[];
  assignedTo: TaskAssignee[];
  tags: TaskTag[];
  spareParts: TaskSparePartLine[];
  documents: TaskDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  totalTasks: number;
  totalPlannedHours: number;
  totalPlannedMinutes: number;
}

export interface AssigneeInput {
  userId?: number;
  teamId?: number;
}

export interface SparePartLineInput {
  sparePartId: number;
  quantity: number;
}

export interface LinkInput {
  name: string;
  url: string;
}

export interface CreateTaskInput {
  equipmentOnly: boolean;
  equipmentId: number;
  description: string;
  allDay: boolean;
  startDate: string;
  startHour: string | null;
  endDate: string;
  endHour: string | null;
  plannedMaintenanceHours: number;
  plannedMaintenanceMinutes: number;
  plannedStoppedHours: number;
  plannedStoppedMinutes: number;
  assignees: AssigneeInput[];
  assignedTo: AssigneeInput[];
  tagIds: number[];
  spareParts: SparePartLineInput[];
  links: LinkInput[];
  notifyAssignees: boolean;
}

export type UpdateTaskInput = CreateTaskInput & {
  status: TaskStatus;
  removeDocumentIds: number[];
};