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
  spareParts: ActivitySparePart[];
  intervenants: ActivityIntervenant[];
  additionalCosts: ActivityAdditionalCost[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivitySparePart {
  sparePartId: number;
  name: string;
  code: string | null;
  quantity: number;
  unitPrice: number | null;
  currency: string | null;
}

export interface ActivityIntervenant {
  userId: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface ActivityAdditionalCost {
  id: number;
  label: string;
  amount: number;
  currency: string | null;
}

export interface ActivityRequest {
  taskId: number;
  description: string;
  performedDate: string;
  performedEndTime: string;
  spentHours: number;
  spentMinutes: number;
  status?: ActivityStatus;
  spareParts?: {
    sparePartId: number;
    quantity: number;
  }[];
  intervenantIds?: number[];
  additionalCosts?: {
    label: string;
    amount: number;
    currency: string;
  }[];
}
