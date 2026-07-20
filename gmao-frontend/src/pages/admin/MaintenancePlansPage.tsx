import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import type {
  MaintenancePlan,
  MaintenancePlanStatus,
} from "../../types/maintenancePlan";
import {
  deleteMaintenancePlan,
  getMaintenancePlans,
  updateMaintenancePlanStatus,
} from "../../services/maintenancePlanService";

type DisplayStatus = "planned" | "in_progress" | "late" | "done";

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function getDateKey(value?: string | null) {
  return value ? value.slice(0, 10) : null;
}

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDisplayStatus(plan: MaintenancePlan): DisplayStatus {
  if (plan.status === "DONE") return "done";
  if (plan.status === "LATE") return "late";
  if (plan.status === "IN_PROGRESS") return "in_progress";

  const referenceDate = getDateKey(plan.nextDueDate) ?? getDateKey(plan.startDate);
  const today = getTodayKey();

  if (referenceDate && referenceDate <= today) return "late";

  return "planned";
}

function getStatusLabel(status: DisplayStatus) {
  if (status === "done") return "Terminé";
  if (status === "late") return "En retard";
  if (status === "planned") return "Planifié";
  return "En cours";
}

function getStoredStatus(status: DisplayStatus): MaintenancePlanStatus {
  if (status === "done") return "DONE";
  if (status === "late") return "LATE";
  if (status === "planned") return "PLANNED";
  return "IN_PROGRESS";
}

export default function MaintenancePlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "history">("active");
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

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

  async function handleStatusChange(plan: MaintenancePlan, status: MaintenancePlanStatus) {
    try {
      setError("");
      setUpdatingStatusId(plan.id);
      const updatedPlan = await updateMaintenancePlanStatus(plan.id, status);
      setPlans((current) =>
        current.map((item) =>
          item.id === updatedPlan.id ? { ...updatedPlan, status } : item,
        ),
      );
    } catch {
      setError("Impossible de modifier le statut du plan de maintenance.");
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const planGroups = useMemo(() => {
    return plans.reduce(
      (groups, plan) => {
        const status = getDisplayStatus(plan);
        if (status === "done") {
          groups.history.push(plan);
        } else {
          groups.active.push(plan);
        }
        return groups;
      },
      { active: [] as MaintenancePlan[], history: [] as MaintenancePlan[] },
    );
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const source = viewMode === "history" ? planGroups.history : planGroups.active;
    const query = search.trim().toLowerCase();

    if (!query) {
      return source;
    }

    return source.filter((plan) => {
      const status = getDisplayStatus(plan);
      return [
        plan.description,
        plan.equipmentName,
        plan.costCenter,
        plan.triggerLabel,
        plan.frequencyLabel,
        getStatusLabel(status),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [planGroups, search, viewMode]);

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
      </section>

      <section className="maintenance-view-switch" aria-label="Vue des plans">
        <button
          type="button"
          className={viewMode === "active" ? "active" : ""}
          onClick={() => setViewMode("active")}
        >
          Plans actifs
          <span>{planGroups.active.length}</span>
        </button>
        <button
          type="button"
          className={viewMode === "history" ? "active" : ""}
          onClick={() => setViewMode("history")}
        >
          Historique
          <span>{planGroups.history.length}</span>
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
                  {viewMode === "history"
                    ? "Aucun plan de maintenance terminé."
                    : "Aucun plan de maintenance trouvé."}
                </td>
              </tr>
            ) : (
              filteredPlans.map((plan) => {
                const displayStatus = getDisplayStatus(plan);
                return (
                  <tr
                    key={plan.id}
                    className="clickable-table-row"
                    onClick={() => navigate(`/admin/maintenance-plans/${plan.id}`)}
                  >
                    <td>
                      <div className="maintenance-plan-cell">
                        <button
                          type="button"
                          className="maintenance-plan-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/admin/maintenance-plans/${plan.id}`);
                          }}
                        >
                          {plan.description}
                        </button>
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
                          displayStatus === "late"
                            ? "status-pill status-late"
                            : "status-pill"
                        }
                      >
                        {formatDate(plan.nextDueDate)}
                      </span>
                    </td>

                    <td>
                      {viewMode === "history" ? (
                        <span className="status-pill done">Terminé</span>
                      ) : (
                        <select
                          className={`maintenance-status-select ${displayStatus}`}
                          value={displayStatus}
                          disabled={updatingStatusId === plan.id}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            handleStatusChange(
                              plan,
                              getStoredStatus(event.target.value as DisplayStatus),
                            )
                          }
                          aria-label="Modifier le statut du plan"
                        >
                          <option value="planned">Planifié</option>
                          <option value="in_progress">En cours</option>
                          <option value="late">En retard</option>
                          <option value="done">Terminé</option>
                        </select>
                      )}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="Modifier"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/admin/maintenance-plans/${plan.id}/edit`);
                          }}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          className="danger-action"
                          title="Supprimer"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(plan.id);
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
      </section>
    </main>
  );
}



