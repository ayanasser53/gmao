import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  Eye,
  Filter,
  Pause,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import type { MaintenancePlan } from "../../types/maintenancePlan";
import {
  deleteMaintenancePlan,
  getMaintenancePlans,
} from "../../services/maintenancePlanService";

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(status: MaintenancePlan["status"]) {
  if (status === "DONE") return "Terminé";
  if (status === "LATE") return "En retard";
  return "En cours";
}

export default function MaintenancePlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setError("");
      const data = await getMaintenancePlans();
      setPlans(data);
    } catch {
      setError("Impossible de charger les plans de maintenance.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce plan de maintenance ?")) return;

    try {
      await deleteMaintenancePlan(id);
      setPlans((current) => current.filter((plan) => plan.id !== id));
    } catch {
      setError("Impossible de supprimer ce plan de maintenance.");
    }
  }

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return plans;

    return plans.filter((plan) => {
      return [
        plan.description,
        plan.equipmentName,
        plan.costCenter,
        plan.triggerLabel,
        plan.frequencyLabel,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [plans, search]);

  return (
    <main className="admin-page maintenance-page">
      <section className="admin-page-hero">
        <div>
          <h1>
            <CalendarClock size={38} />
            Plans de maintenance
          </h1>
        </div>

        <button
          type="button"
          className="primary-action"
          onClick={() => navigate("/admin/maintenance-plans/new")}
        >
          <Plus size={19} />
          Créer un plan
        </button>
      </section>

      {error && <div className="form-error">{error}</div>}

      <section className="table-toolbar">
        <label className="search-field">
          <Search size={20} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un plan de maintenance..."
          />
        </label>

        <button type="button" className="secondary-action">
          <Filter size={19} />
          Filtrer
        </button>
      </section>

      <section className="data-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Plan de maintenance</th>
              <th>Équipement</th>
              <th>Déclencheur</th>
              <th>Prochaine échéance</th>
              <th>Statut</th>
              <th className="table-actions-column">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPlans.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  Aucun plan de maintenance trouvé.
                </td>
              </tr>
            ) : (
              filteredPlans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <div className="maintenance-plan-cell">
                      <strong>{plan.description}</strong>
                      <span>{plan.frequencyLabel}</span>
                    </div>
                  </td>

                  <td>
                    <span className="soft-pill">
                      <Wrench size={16} />
                      {plan.equipmentName || "-"}
                    </span>
                  </td>

                  <td>{plan.triggerLabel}</td>

                  <td>
                    <span
                      className={
                        plan.status === "LATE"
                          ? "status-pill status-late"
                          : "status-pill"
                      }
                    >
                      {formatDate(plan.nextDueDate)}
                    </span>
                  </td>

                  <td>
                    <span className={`status-badge ${plan.status.toLowerCase()}`}>
                      {getStatusLabel(plan.status)}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        title="Voir le détail"
                        onClick={() =>
                          navigate(`/admin/maintenance-plans/${plan.id}`)
                        }
                      >
                        <Eye size={18} />
                      </button>

                      <button type="button" title="Mettre en pause">
                        <Pause size={18} />
                      </button>

                      <button
                        type="button"
                        title="Supprimer"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
