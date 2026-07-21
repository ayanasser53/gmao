export type PurchaseOrderStatus =
  | "ALL"
  | "DRAFT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED"
  | "ARCHIVED";

export type PurchaseOrderLineType = "SPARE_PART" | "FREE_TEXT";

export interface PurchaseOrderLine {
  id: string;
  type: PurchaseOrderLineType;
  sparePartId: number | null;
  sparePartName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface PurchaseOrder {
  id: string;
  reference: string;
  supplierId: number | null;
  supplierName: string | null;
  expectedDeliveryDate: string | null;
  notes: string;
  status: Exclude<PurchaseOrderStatus, "ALL">;
  lines: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderRequest {
  reference: string;
  supplierId: number | null;
  supplierName: string | null;
  expectedDeliveryDate: string | null;
  notes: string;
  lines: PurchaseOrderLine[];
}
