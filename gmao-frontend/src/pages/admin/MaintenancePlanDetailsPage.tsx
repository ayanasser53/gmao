import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  FileText,
  History,
  MapPin,
  Pencil,
  Plus,
  Scale,
  Tags,
  Users,
  Wrench,
} from "lucide-react";
import type { MaintenancePlan } from "../../types/maintenancePlan";
import { getMaintenancePlanById } from "../../services/maintenancePlanService";

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

export default function MaintenancePlanDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState<MaintenancePlan | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    loadPlan(Number(id));
  }, [id]);

  async function loadPlan(planId: number) {
    try {
      setError("");
      const data = await getMaintenancePlanById(planId);
      setPlan(data);
    } catch {
      setError("Impossible de charger le plan de maintenance.");
    }
  }

  if (error) {
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

      <section className="details-header">
        <div>
          <h1>
            <CalendarClock size={34} />
            Plan de maintenance
            <span className="status-badge in_progress">En cours</span>
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

            <div className="linked-equipment-card">
              {equipmentImage ? (
                <img src={equipmentImage} alt={plan.equipmentName} />
              ) : (
                <div className="linked-equipment-placeholder">
                  <Wrench size={28} />
                </div>
              )}

              <div>
                <span>Nom de l’équipement</span>
                <strong>{plan.equipmentName}</strong>
              </div>
            </div>

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
                <span>Temps d’arrêt planifié</span>
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

      <section className="details-card full">
        <div className="section-title-row">
          <h3>Pièces détachées à prévoir</h3>
          <button type="button" className="icon-link-button">
            <Plus size={20} />
          </button>
        </div>
        <p>Aucune pièce détachée liée.</p>
      </section>

      <section className="details-card full">
        <div className="section-title-row">
          <h3>Documents</h3>
          <button type="button" className="icon-link-button">
            <Plus size={20} />
          </button>
        </div>
        <p>Aucun document associé.</p>
      </section>
    </main>
  );
}