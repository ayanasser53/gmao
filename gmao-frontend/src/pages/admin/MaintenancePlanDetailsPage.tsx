import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  FileText,
  History,
  MapPin,
  Package,
  Pencil,
  Plus,
  Scale,
  Tags,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import type { MaintenancePlan } from "../../types/maintenancePlan";
import {
  getMaintenancePlanById,
  updateMaintenancePlan,
} from "../../services/maintenancePlanService";
import { getSpareParts } from "../../services/sparePartService";
import type { SparePart } from "../../types/sparePart";

const BACKEND_URL = "http://localhost:8090";

function getImageUrl(imagePath?: string | null) {
  if (!imagePath) return null;

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:")
  ) {
    return imagePath;
  }

  return `${BACKEND_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDuration(hours: number, minutes: number) {
  if (!hours && !minutes) return "N/A";
  return `${hours}h ${String(minutes).padStart(2, "0")}mn.`;
}

function getDetailStatus(plan: MaintenancePlan) {
  if (plan.status === "DONE") return { className: "done", label: "Terminé" };

  const due = plan.nextDueDate
    ? new Date(`${plan.nextDueDate.slice(0, 10)}T00:00:00`)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (due && due < today) return { className: "late", label: "En retard" };
  if (due && due > today) return { className: "planned", label: "Planifié" };

  return { className: "in_progress", label: "En cours" };
}

function planToPayload(plan: MaintenancePlan) {
  return {
    equipmentId: plan.equipmentId,
    description: plan.description,
    equipmentOnly: plan.equipmentOnly,
    regulatory: plan.regulatory,
    triggerType: plan.triggerType,
    frequencyValue: plan.frequencyValue,
    frequencyUnit: plan.frequencyUnit as "DAYS" | "WEEKS" | "MONTHS" | "YEARS",
    startDate: plan.startDate || null,
    nextDueDate: plan.nextDueDate || null,
    plannedMaintenanceHours: plan.plannedMaintenanceHours,
    plannedMaintenanceMinutes: plan.plannedMaintenanceMinutes,
    plannedStoppedHours: plan.plannedStoppedHours,
    plannedStoppedMinutes: plan.plannedStoppedMinutes,
    spareParts: plan.spareParts.map((sparePart) => ({
      sparePartId: sparePart.sparePartId,
      quantity: sparePart.quantity,
    })),
  };
}

export default function MaintenancePlanDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState<MaintenancePlan | null>(null);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [selectedSparePartId, setSelectedSparePartId] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showSpareSelector, setShowSpareSelector] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    loadPlan(Number(id));
    loadSpareParts();
  }, [id]);

  async function loadPlan(planId: number) {
    try {
      setError("");
      const data = await getMaintenancePlanById(planId);
      setPlan({ ...data, spareParts: data.spareParts || [] });
    } catch {
      setError("Impossible de charger le plan de maintenance.");
    }
  }

  async function loadSpareParts() {
    try {
      const data = await getSpareParts();
      setSpareParts(data);
    } catch {
      setSpareParts([]);
    }
  }

  async function addSparePart() {
    if (!plan || !selectedSparePartId) return;

    const exists = plan.spareParts.some(
      (item) => item.sparePartId === selectedSparePartId
    );

    const nextSpareParts = exists
      ? plan.spareParts.map((item) =>
          item.sparePartId === selectedSparePartId
            ? { ...item, quantity: selectedQuantity }
            : item
        )
      : [
          ...plan.spareParts,
          {
            sparePartId: selectedSparePartId,
            sparePartName:
              spareParts.find((item) => item.id === selectedSparePartId)?.name ||
              "Pièce détachée",
            sparePartCode:
              spareParts.find((item) => item.id === selectedSparePartId)?.code ||
              null,
            sparePartImage:
              spareParts.find((item) => item.id === selectedSparePartId)?.image ||
              null,
            quantity: selectedQuantity,
          },
        ];

    try {
      setError("");
      setPlan({ ...plan, spareParts: nextSpareParts });

      const updated = await updateMaintenancePlan(plan.id, {
        ...planToPayload(plan),
        spareParts: nextSpareParts.map((item) => ({
          sparePartId: item.sparePartId,
          quantity: item.quantity,
        })),
      });

      setPlan({
        ...updated,
        spareParts:
          updated.spareParts && updated.spareParts.length > 0
            ? updated.spareParts
            : nextSpareParts,
      });
      setSelectedSparePartId(0);
      setSelectedQuantity(1);
      setShowSpareSelector(false);
    } catch {
      setPlan(plan);
      setError("Impossible d'ajouter la pièce détachée au plan.");
    }
  }

  async function removeSparePart(sparePartId: number) {
    if (!plan) return;

    const nextSpareParts = plan.spareParts.filter(
      (item) => item.sparePartId !== sparePartId
    );

    try {
      setError("");
      const updated = await updateMaintenancePlan(plan.id, {
        ...planToPayload(plan),
        spareParts: nextSpareParts.map((item) => ({
          sparePartId: item.sparePartId,
          quantity: item.quantity,
        })),
      });

      setPlan({ ...updated, spareParts: updated.spareParts || [] });
    } catch {
      setError("Impossible de retirer la pièce détachée du plan.");
    }
  }

  const availableSpareParts = useMemo(() => {
    if (!plan) return spareParts;

    return spareParts.filter(
      (sparePart) =>
        !plan.spareParts.some((item) => item.sparePartId === sparePart.id)
    );
  }, [plan, spareParts]);

  if (error && !plan) {
    return (
      <main className="admin-page">
        <div className="form-error">{error}</div>
      </main>
    );
  }

  if (!plan) {
    return (
      <main className="admin-page">
        <div className="empty-table-cell">Chargement...</div>
      </main>
    );
  }

  const equipmentImage = getImageUrl(plan.equipmentImage);
  const detailStatus = getDetailStatus(plan);

  return (
    <main className="admin-page">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate("/admin/maintenance-plans")}
      >
        <ArrowLeft size={19} />
        Retour aux plans de maintenance
      </button>

      {error && <div className="form-error">{error}</div>}

      <section className="details-header">
        <div>
          <h1>
            <CalendarClock size={34} />
            Plan de maintenance
            <span className={`status-badge ${detailStatus.className}`}>{detailStatus.label}</span>
          </h1>
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={() => navigate(`/admin/maintenance-plans/${plan.id}/edit`)}
        >
          <Pencil size={18} />
          Modifier
        </button>
      </section>

      <section className="maintenance-details-layout">
        <div className="details-panel">
          <div className="details-row">
            <FileText size={22} />
            <div>
              <span>Description</span>
              <strong>{plan.description}</strong>
            </div>
          </div>

          <div className="details-row">
            <History size={22} />
            <div>
              <span>Périodicité</span>
              <strong>{plan.frequencyLabel}</strong>
            </div>
          </div>

          <div className="details-row">
            <CalendarClock size={22} />
            <div>
              <span>Prochaine échéance</span>
              <strong className="status-pill status-late">
                {formatDate(plan.nextDueDate)}
              </strong>
            </div>
          </div>

          <div className="details-row">
            <Users size={22} />
            <div>
              <span>Assignés</span>
              <strong>Aucun assigné.</strong>
            </div>
          </div>

          <div className="details-row">
            <Tags size={22} />
            <div>
              <span>Labels</span>
              <strong>Aucun label.</strong>
            </div>
          </div>

          <div className="details-row">
            <FileText size={22} />
            <div>
              <span>Checklist</span>
              <strong>Aucune checklist associée.</strong>
            </div>
          </div>
        </div>

        <aside className="details-side">
          <section className="details-card">
            <h3>Équipement</h3>

            <button
              type="button"
              className="linked-equipment-card linked-equipment-action"
              onClick={() => navigate(`/admin/equipment/${plan.equipmentId}`)}
            >
              {equipmentImage ? (
                <img src={equipmentImage} alt={plan.equipmentName} />
              ) : (
                <div className="linked-equipment-placeholder">
                  <Wrench size={28} />
                </div>
              )}

              <div>
                <span>Nom de l'équipement</span>
                <strong>{plan.equipmentName}</strong>
              </div>
            </button>

            <div className="details-row compact">
              <MapPin size={20} />
              <div>
                <span>Centre de coûts</span>
                <strong>{plan.costCenter || "-"}</strong>
              </div>
            </div>
          </section>

          <section className="details-card">
            <div className="details-row compact">
              <Scale size={20} />
              <div>
                <span>Réglementaire</span>
                <strong>{plan.regulatory ? "Oui" : "Non"}</strong>
              </div>
            </div>

            <div className="details-row compact">
              <History size={20} />
              <div>
                <span>Déclencheur</span>
                <strong>{plan.triggerLabel}</strong>
              </div>
            </div>

            <div className="details-row compact">
              <Clock size={20} />
              <div>
                <span>Temps de maintenance planifié</span>
                <strong>
                  {formatDuration(
                    plan.plannedMaintenanceHours,
                    plan.plannedMaintenanceMinutes
                  )}
                </strong>
              </div>
            </div>

            <div className="details-row compact">
              <Clock size={20} />
              <div>
                <span>Temps d'arrêt planifié</span>
                <strong>
                  {formatDuration(
                    plan.plannedStoppedHours,
                    plan.plannedStoppedMinutes
                  )}
                </strong>
              </div>
            </div>
          </section>
        </aside>
      </section>

      <section className="details-card full maintenance-spare-card">
        <div className="section-title-row">
          <h3>Pièces détachées à prévoir</h3>
          <button
            type="button"
            className="icon-link-button"
            onClick={() => setShowSpareSelector((current) => !current)}
            aria-label="Ajouter une pièce détachée"
          >
            <Plus size={20} />
          </button>
        </div>

        {showSpareSelector && (
          <div className="maintenance-spare-selector">
            <select
              value={selectedSparePartId}
              onChange={(event) =>
                setSelectedSparePartId(Number(event.target.value))
              }
            >
              <option value={0}>Sélectionner une pièce détachée</option>
              {availableSpareParts.map((sparePart) => (
                <option key={sparePart.id} value={sparePart.id}>
                  {sparePart.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min={1}
              value={selectedQuantity}
              onChange={(event) =>
                setSelectedQuantity(Math.max(1, Number(event.target.value)))
              }
              aria-label="Quantité à prévoir"
            />

            <button
              type="button"
              className="primary-action compact-action"
              onClick={addSparePart}
              disabled={!selectedSparePartId}
            >
              Ajouter
            </button>
          </div>
        )}

        {plan.spareParts.length === 0 ? (
          <p>Aucune pièce détachée liée.</p>
        ) : (
          <div className="maintenance-spare-list">
            {plan.spareParts.map((sparePart) => {
              const imageUrl = getImageUrl(sparePart.sparePartImage);

              return (
                <div className="maintenance-spare-item" key={sparePart.sparePartId}>
                  {imageUrl ? (
                    <img src={imageUrl} alt={sparePart.sparePartName} />
                  ) : (
                    <div className="maintenance-spare-placeholder">
                      <Package size={22} />
                    </div>
                  )}

                  <div>
                    <strong>{sparePart.sparePartName}</strong>
                    <span>
                      Code : {sparePart.sparePartCode || "Non défini"} · À prévoir : {sparePart.quantity}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="icon-link-button danger"
                    onClick={() => removeSparePart(sparePart.sparePartId)}
                    aria-label="Retirer la pièce détachée"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

