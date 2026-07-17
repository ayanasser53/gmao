export type MaintenancePlanStatus = "PLANNED" | "IN_PROGRESS" | "DONE" | "LATE";

export type MaintenanceTriggerType =
  | "FIXED_DATE"
  | "TASK_CLOSURE"
  | "EXTERNAL_API"
  | "COUNTER";

export type MaintenanceFrequencyUnit = "DAYS" | "WEEKS" | "MONTHS" | "YEARS";

export interface MaintenancePlanSparePart {
  sparePartId: number;
  sparePartName: string;
  sparePartCode?: string | null;
  sparePartImage?: string | null;
  quantity: number;
}

export interface MaintenancePlan {
  id: number;
  equipmentId: number;
  equipmentName: string;
  equipmentImage?: string | null;
  costCenter?: string | null;
  description: string;
  equipmentOnly: boolean;
  regulatory: boolean;
  triggerType: MaintenanceTriggerType;
  triggerLabel: string;
  frequencyValue: number;
  frequencyUnit: MaintenanceFrequencyUnit | string;
  frequencyLabel: string;
  startDate?: string | null;
  nextDueDate?: string | null;
  plannedMaintenanceHours: number;
  plannedMaintenanceMinutes: number;
  plannedStoppedHours: number;
  plannedStoppedMinutes: number;
  status: MaintenancePlanStatus;
  spareParts: MaintenancePlanSparePart[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface MaintenancePlanPayload {
  equipmentId: number;
  description: string;
  equipmentOnly: boolean;
  regulatory: boolean;
  triggerType: MaintenanceTriggerType;
  frequencyValue: number;
  frequencyUnit: MaintenanceFrequencyUnit;
  startDate: string | null;
  nextDueDate: string | null;
  plannedMaintenanceHours: number;
  plannedMaintenanceMinutes: number;
  plannedStoppedHours: number;
  plannedStoppedMinutes: number;
  status?: MaintenancePlanStatus;
  spareParts?: {
    sparePartId: number;
    quantity: number;
  }[];
}

