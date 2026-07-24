import api from "./api";
import type {
  PurchaseOrder,
  PurchaseOrderRequest,
  PurchaseOrderStatus,
} from "../types/purchaseOrder";

const STORAGE_KEY = "gmao_purchase_orders";
const MIGRATION_KEY = "gmao_purchase_orders_migrated_to_mysql";

type PurchaseOrderApiResponse = Omit<PurchaseOrder, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function toPurchaseOrder(order: PurchaseOrderApiResponse): PurchaseOrder {
  return {
    ...order,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    lines: order.lines.map((line) => ({
      ...line,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    })),
  };
}

function readLocalOrders(): PurchaseOrder[] {
  const rawValue = localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    return JSON.parse(rawValue) as PurchaseOrder[];
  } catch {
    return [];
  }
}

async function migrateLocalOrders(remoteOrders: PurchaseOrder[]): Promise<PurchaseOrder[]> {
  if (localStorage.getItem(MIGRATION_KEY) === "true") {
    return remoteOrders;
  }

  const localOrders = readLocalOrders();

  if (localOrders.length === 0) {
    localStorage.setItem(MIGRATION_KEY, "true");
    return remoteOrders;
  }

  const remoteIds = new Set(remoteOrders.map((order) => order.id));
  const ordersToMigrate = localOrders.filter((order) => !remoteIds.has(order.id));

  if (ordersToMigrate.length === 0) {
    localStorage.setItem(MIGRATION_KEY, "true");
    return remoteOrders;
  }

  for (const order of ordersToMigrate) {
    await api.post<PurchaseOrderApiResponse>("/purchase-orders", {
      id: order.id,
      reference: order.reference,
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      expectedDeliveryDate: order.expectedDeliveryDate,
      notes: order.notes,
      status: order.status,
      lines: order.lines,
    });
  }

  localStorage.setItem(MIGRATION_KEY, "true");

  const response = await api.get<PurchaseOrderApiResponse[]>("/purchase-orders");
  return response.data.map(toPurchaseOrder);
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const response = await api.get<PurchaseOrderApiResponse[]>("/purchase-orders");
  return migrateLocalOrders(response.data.map(toPurchaseOrder));
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
  const response = await api.get<PurchaseOrderApiResponse>(`/purchase-orders/${id}`);
  return toPurchaseOrder(response.data);
}

export async function createPurchaseOrder(
  request: PurchaseOrderRequest,
): Promise<PurchaseOrder> {
  const response = await api.post<PurchaseOrderApiResponse>("/purchase-orders", request);
  return toPurchaseOrder(response.data);
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: Exclude<PurchaseOrderStatus, "ALL">,
): Promise<PurchaseOrder> {
  const response = await api.patch<PurchaseOrderApiResponse>(
    `/purchase-orders/${id}/status`,
    { status },
  );

  return toPurchaseOrder(response.data);
}

export async function updatePurchaseOrder(
  id: string,
  data: Partial<PurchaseOrder>,
): Promise<PurchaseOrder> {
  const response = await api.put<PurchaseOrderApiResponse>(
    `/purchase-orders/${id}`,
    data,
  );

  return toPurchaseOrder(response.data);
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await api.delete(`/purchase-orders/${id}`);
}
