import type {
  PurchaseOrder,
  PurchaseOrderRequest,
  PurchaseOrderStatus,
} from "../types/purchaseOrder";

const STORAGE_KEY = "gmao_purchase_orders";

function readOrders(): PurchaseOrder[] {
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

function writeOrders(orders: PurchaseOrder[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function nextReference(orders: PurchaseOrder[]): string {
  const year = new Date().getFullYear();
  const countForYear = orders.filter((order) =>
    order.reference.startsWith(`PO-${year}-`),
  ).length;

  return `PO-${year}-${String(countForYear + 1).padStart(4, "0")}`;
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return readOrders().sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt),
  );
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
  const order = readOrders().find((item) => item.id === id);

  if (!order) {
    throw new Error("Commande introuvable.");
  }

  return order;
}

export async function createPurchaseOrder(
  request: PurchaseOrderRequest,
): Promise<PurchaseOrder> {
  const orders = readOrders();
  const now = new Date().toISOString();

  const order: PurchaseOrder = {
    id: crypto.randomUUID(),
    reference: request.reference.trim() || nextReference(orders),
    supplierId: request.supplierId,
    supplierName: request.supplierName,
    expectedDeliveryDate: request.expectedDeliveryDate,
    notes: request.notes,
    status: "DRAFT",
    lines: request.lines,
    createdAt: now,
    updatedAt: now,
  };

  writeOrders([order, ...orders]);

  return order;
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: Exclude<PurchaseOrderStatus, "ALL">,
): Promise<PurchaseOrder> {
  const orders = readOrders();
  const updatedOrders = orders.map((order) =>
    order.id === id
      ? {
          ...order,
          status,
          updatedAt: new Date().toISOString(),
        }
      : order,
  );
  const updatedOrder = updatedOrders.find((order) => order.id === id);

  if (!updatedOrder) {
    throw new Error("Commande introuvable.");
  }

  writeOrders(updatedOrders);

  return updatedOrder;
}

export async function updatePurchaseOrder(
  id: string,
  data: Partial<PurchaseOrder>,
): Promise<PurchaseOrder> {
  const orders = readOrders();
  const updatedOrders = orders.map((order) =>
    order.id === id
      ? {
          ...order,
          ...data,
          updatedAt: new Date().toISOString(),
        }
      : order,
  );
  const updatedOrder = updatedOrders.find((order) => order.id === id);

  if (!updatedOrder) {
    throw new Error("Commande introuvable.");
  }

  writeOrders(updatedOrders);

  return updatedOrder;
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const orders = readOrders();
  writeOrders(orders.filter((order) => order.id !== id));
}
