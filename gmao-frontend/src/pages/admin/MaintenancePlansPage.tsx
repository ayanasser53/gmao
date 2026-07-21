import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  Clock,
  History,
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

import "./task-styles.css";

type DisplayStatus = "planned" | "in_progress" | "late" | "done";

const STATUS_TABS = [
  {
    status: "planned",
    label: "Planifié",
    className: "tab-planned",
    icon: CalendarClock,
  },
  {
    status: "in_progress",
    label: "En cours",
    className: "tab-progress",
    icon: Clock,
  },
  {
    status: "late",
    label: "En retard",
    className: "tab-late",
    icon: Clock,
  },
  {
    status: "done",
    label: "Terminé",
    className: "tab-done",
    icon: History,
  },
] as const;

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

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return toDateKey(new Date());
}

function getPlanDateKey(plan: MaintenancePlan) {
  return getDateKey(plan.nextDueDate) ?? getDateKey(plan.startDate);
}

function getDisplayStatus(plan: MaintenancePlan): DisplayStatus {
  if (plan.status === "DONE") return "done";
  if (plan.status === "LATE") return "late";
  if (plan.status === "IN_PROGRESS") return "in_progress";

  const referenceDate = getPlanDateKey(plan);

  if (referenceDate && referenceDate < getTodayKey()) return "late";

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
  const [activeTab, setActiveTab] = useState<DisplayStatus>("planned");
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

  async function handleStatusChange(
    plan: MaintenancePlan,
    status: MaintenancePlanStatus,
  ) {
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

  const statusCounts = useMemo(() => {
    return STATUS_TABS.reduce(
      (counts, tab) => ({
        ...counts,
        [tab.status]: plans.filter((plan) => getDisplayStatus(plan) === tab.status).length,
      }),
      {
        planned: 0,
        in_progress: 0,
        late: 0,
        done: 0,
      } as Record<DisplayStatus, number>,
    );
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scopedPlans = plans.filter((plan) => getDisplayStatus(plan) === activeTab);

    if (!query) {
      return scopedPlans;
    }

    return scopedPlans.filter((plan) => {
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
  }, [activeTab, plans, search]);

  return (
    <section className="admin-page maintenance-page">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <CalendarClock size={28} />
            <h1>Plans de maintenance</h1>
          </div>
        </div>

        <div className="resource-header-actions">
          <button
            type="button"
            className="resource-secondary-button"
            onClick={() => navigate("/admin/maintenance-plans/calendar")}
          >
            <CalendarClock size={17} />
            Calendrier
          </button>

          <button
            type="button"
            className="resource-primary-button"
            onClick={() => navigate("/admin/maintenance-plans/new")}
          >
            <Plus size={17} />
            Créer un plan
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="resource-toolbar">
        <div className="resource-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un plan, un équipement, un déclencheur..."
          />
        </div>
      </div>

      <div className="task-status-cards">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              type="button"
              key={tab.status}
              className={`${tab.className} ${activeTab === tab.status ? "active" : ""}`}
              onClick={() => setActiveTab(tab.status)}
            >
              <Icon size={18} />
              {tab.label}
              <span>{statusCounts[tab.status]}</span>
            </button>
          );
        })}
      </div>

      <div className="resource-table-container">
        <table className="resource-table">
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
                <td colSpan={6} className="resource-table-empty">
                  {`Aucun plan de maintenance avec le statut "${getStatusLabel(activeTab)}".`}
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
      </div>
    </section>
  );
}
