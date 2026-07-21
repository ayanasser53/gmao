import {
  Archive,
  Ban,
  Box,
  CheckCircle2,
  CircleCheck,
  CircleX,
  FileText,
  PackageCheck,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  deletePurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrderStatus,
} from "../../services/purchaseOrderService";
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
} from "../../types/purchaseOrder";

const STATUS_META: Record<
  PurchaseOrderStatus,
  {
    label: string;
    className: string;
    icon: typeof Box;
  }
> = {
  ALL: {
    label: "Tout",
    className: "all",
    icon: Box,
  },
  DRAFT: {
    label: "Brouillon",
    className: "draft",
    icon: FileText,
  },
  CONFIRMED: {
    label: "Confirmé",
    className: "confirmed",
    icon: CircleCheck,
  },
  IN_PROGRESS: {
    label: "En cours",
    className: "progress",
    icon: CheckCircle2,
  },
  DONE: {
    label: "Terminé",
    className: "done",
    icon: PackageCheck,
  },
  CANCELLED: {
    label: "Annulé",
    className: "cancelled",
    icon: CircleX,
  },
  ARCHIVED: {
    label: "Archivé",
    className: "archived",
    icon: Archive,
  },
};

const STATUS_ORDER: PurchaseOrderStatus[] = [
  "ALL",
  "DRAFT",
  "CONFIRMED",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
  "ARCHIVED",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function orderTotal(order: PurchaseOrder) {
  return order.lines.reduce(
    (total, line) => total + line.quantity * line.unitPrice,
    0,
  );
}

function relativeDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diffMs / 86_400_000));

  if (days === 0) return "aujourd'hui";
  if (days === 1) return "il y a 1 jour";
  return `il y a ${days} jours`;
}

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [activeStatus, setActiveStatus] = useState<PurchaseOrderStatus>("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getPurchaseOrders();
        setOrders(data);
      } catch {
        setError("Impossible de charger les bons de commande.");
      }
    }

    void loadOrders();
  }, []);

  const statusCounts = useMemo(() => {
    return STATUS_ORDER.reduce(
      (counts, status) => ({
        ...counts,
        [status]:
          status === "ALL"
            ? orders.length
            : orders.filter((order) => order.status === status).length,
      }),
      {} as Record<PurchaseOrderStatus, number>,
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scopedOrders =
      activeStatus === "ALL"
        ? orders
        : orders.filter((order) => order.status === activeStatus);

    if (!query) {
      return scopedOrders;
    }

    return scopedOrders.filter((order) =>
      [
        order.reference,
        order.supplierName,
        order.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [activeStatus, orders, search]);

  async function changeStatus(
    order: PurchaseOrder,
    status: Exclude<PurchaseOrderStatus, "ALL">,
  ) {
    try {
      const updatedOrder = await updatePurchaseOrderStatus(order.id, status);
      setOrders((current) =>
        current.map((item) => (item.id === order.id ? updatedOrder : item)),
      );
    } catch {
      setError("Impossible de mettre à jour le bon de commande.");
    }
  }

  async function removeOrder(order: PurchaseOrder) {
    if (!confirm(`Supprimer le bon de commande ${order.reference} ?`)) {
      return;
    }

    try {
      await deletePurchaseOrder(order.id);
      setOrders((current) => current.filter((item) => item.id !== order.id));
    } catch {
      setError("Impossible de supprimer le bon de commande.");
    }
  }

  return (
    <section className="admin-page purchase-orders-page">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <ShoppingCart size={28} />
            <h1>Bons de commande</h1>
          </div>
        </div>

        <div className="resource-header-actions">
          <button
            type="button"
            className="resource-primary-button"
            onClick={() => navigate("/admin/purchase-orders/create")}
          >
            <Plus size={17} />
            Créer un bon de commande
          </button>
        </div>
      </div>

      {error && <div className="resource-error-message">{error}</div>}

      <div className="purchase-status-grid">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;

          return (
            <button
              type="button"
              key={status}
              className={`${meta.className} ${activeStatus === status ? "active" : ""}`}
              onClick={() => setActiveStatus(status)}
            >
              <span className="purchase-status-icon">
                <Icon size={20} />
              </span>
              <span>{meta.label}</span>
              <strong>{statusCounts[status] ?? 0}</strong>
            </button>
          );
        })}
      </div>

      <div className="supplier-search-bar purchase-search">
        <Search size={18} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par référence..."
        />
      </div>

      <div className="supplier-table-wrapper">
        <table className="supplier-table purchase-order-table">
          <thead>
            <tr>
              <th>N° de commande</th>
              <th>Fournisseur</th>
              <th>Date de livraison espérée</th>
              <th>Créé le</th>
              <th>Mis à jour le</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Réception</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="supplier-empty-row">
                  Aucun bon de commande trouvé.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const meta = STATUS_META[order.status];

                return (
                  <tr
                    key={order.id}
                    className="supplier-clickable-row"
                    onClick={() => navigate(`/admin/purchase-orders/${order.id}`)}
                  >
                    <td className="purchase-reference">{order.reference}</td>
                    <td>{order.supplierName || "Non défini"}</td>
                    <td>{order.expectedDeliveryDate || "-"}</td>
                    <td>{relativeDate(order.createdAt)}</td>
                    <td>{relativeDate(order.updatedAt)}</td>
                    <td>{formatCurrency(orderTotal(order))}</td>
                    <td>
                      <span className={`purchase-status-pill ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td>
                      <div className="purchase-reception">
                        <strong>{order.status === "DONE" ? "100%" : "0%"}</strong>
                        <span>
                          <i style={{ width: order.status === "DONE" ? "100%" : "0%" }} />
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="Annuler"
                          onClick={(event) => {
                            event.stopPropagation();
                            changeStatus(order, "CANCELLED");
                          }}
                        >
                          <Ban size={18} />
                        </button>
                        <button
                          type="button"
                          title="Archiver"
                          onClick={(event) => {
                            event.stopPropagation();
                            changeStatus(order, "ARCHIVED");
                          }}
                        >
                          <Archive size={18} />
                        </button>
                        <button
                          type="button"
                          className="danger-action"
                          title="Supprimer"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeOrder(order);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
