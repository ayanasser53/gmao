export type ActivityStatus =
  | "IN_PROGRESS"
  | "LATE"
  | "DONE";

export interface Activity {
  id: number;
  taskId: number;
  taskDescription: string;
  equipmentName: string | null;
  description: string;
  performedDate: string;
  performedEndTime: string;
  spentHours: number;
  spentMinutes: number;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRequest {
  taskId: number;
  description: string;
  performedDate: string;
  performedEndTime: string;
  spentHours: number;
  spentMinutes: number;
  status?: ActivityStatus;
}
