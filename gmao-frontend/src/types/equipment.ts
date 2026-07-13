export type EquipmentVisibility = "PUBLIC" | "PRIVATE";
export interface EquipmentTag { id: number; name: string; color: string; }
export interface Equipment {
  id: number; image: string | null; name: string; description: string | null;
  costCenterId: number | null; costCenterName: string | null;
  gtinEanCode: string | null; itemCode: string | null;
  parentEquipmentId: number | null; parentEquipmentName: string | null;
  visibility: EquipmentVisibility; tags: EquipmentTag[];
  createdAt: string; updatedAt: string;
}
export interface EquipmentPayload {
  name: string; description: string; costCenterId: number | null;
  gtinEanCode: string; itemCode: string; parentEquipmentId: number | null;
  visibility: EquipmentVisibility; tagIds: number[]; removeImage?: boolean;
}
