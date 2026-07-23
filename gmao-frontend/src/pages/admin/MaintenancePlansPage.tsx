import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  History,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tag as TagIcon,
  Trash2,
  Users,
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
import { getCostCenters } from "../../services/costCenterService";
import { getEquipment } from "../../services/equipmentService";
import { getTags } from "../../services/tagService";
import { getUsers } from "../../services/userService";
import type { CostCenter } from "../../types/costCenter";
import type { Equipment } from "../../types/equipment";
import type { Tag } from "../../types/tag";
import type { UserSummary } from "../../types/user";
import { exportTableCsv, exportTablePdf } from "../../utils/exportFiles";

import "./task-styles.css";

const BACKEND_URL = "http://localhost:8090";

type DisplayStatus = "planned" | "in_progress" | "late" | "done";
type MaintenanceTab = "all" | DisplayStatus;
type MaintenanceFilterDropdown =
  | "trigger"
  | "equipment"
  | "assignee"
  | "label"
  | "costCenter"
  | null;

interface MaintenancePlanWithAssignees extends MaintenancePlan {
  assignees?: { userId?: number | null; id?: number | null }[];
  assignedTo?: { userId?: number | null; id?: number | null }[];
}

type MaintenanceFilterOption = {
  value: string;
  label: string;
  tone?: string;
  imageUrl?: string | null;
  initials?: string;
  avatarColor?: string;
};

const STATUS_TABS = [
  {
    status: "all",
    label: "Tout",
    className: "tab-all",
    icon: CheckCircle2,
  },
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

const TRIGGER_FILTER_OPTIONS = [
  { value: "DAYS:1", label: "Quotidien", tone: "planned" },
  { value: "WEEKS:1", label: "Hebdomadaire", tone: "progress" },
  { value: "MONTHS:1", label: "Mensuel", tone: "equipment" },
  { value: "MONTHS:3", label: "Trimestriel", tone: "cost" },
  { value: "YEARS:1", label: "Annuel", tone: "done" },
];

const AVATAR_COLORS = [
  "#087fbd",
  "#0f9f6e",
  "#7c3aed",
  "#d97706",
  "#dc2626",
  "#4f46e5",
];

interface MaintenanceRealizationExportDraft {
  hours?: number;
  minutes?: number;
  measureValue?: string;
  additionalCost?: string;
}

function getFileUrl(
  path: string | null | undefined,
  folder?: "equipment" | "users",
): string | null {
  if (!path) {
    return null;
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  if (
    path.startsWith("/uploads/") ||
    path.startsWith("uploads/") ||
    path.includes("/")
  ) {
    return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }

  if (folder) {
    return `${BACKEND_URL}/uploads/${folder}/${path}`;
  }

  return `${BACKEND_URL}/${path}`;
}

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

function getTabLabel(tab: MaintenanceTab) {
  return tab === "all" ? "Tout" : getStatusLabel(tab);
}

function formatDuration(hours: number, minutes: number): string {
  return `${hours || 0}h ${String(minutes || 0).padStart(2, "0")}min`;
}

function formatMoney(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} EUR`;
}

function getRealizationStorageKey(planId: number) {
  return `maintenance-plan-realization-${planId}`;
}

function readPlanRealizationDraft(
  planId: number,
): MaintenanceRealizationExportDraft | null {
  try {
    const storedDraft = localStorage.getItem(getRealizationStorageKey(planId));

    if (!storedDraft) {
      return null;
    }

    return JSON.parse(storedDraft) as MaintenanceRealizationExportDraft;
  } catch {
    return null;
  }
}

function formatPlanCounter(
  plan: MaintenancePlan,
  draft: MaintenanceRealizationExportDraft | null,
) {
  if (draft?.measureValue) {
    return draft.measureValue;
  }

  if (plan.triggerType === "COUNTER") {
    return plan.triggerLabel || "Compteur";
  }

  return "-";
}

function getStoredStatus(status: DisplayStatus): MaintenancePlanStatus {
  if (status === "done") return "DONE";
  if (status === "late") return "LATE";
  if (status === "planned") return "PLANNED";
  return "IN_PROGRESS";
}

function getUserName(user: UserSummary): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    `Utilisateur ${user.id}`
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";

  return `${first}${second}`.toUpperCase() || "?";
}

function getAvatarColor(id: number) {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

function getScheduleFilterValue(plan: MaintenancePlan) {
  const unit = String(plan.frequencyUnit ?? "").toUpperCase();
  const value = Number(plan.frequencyValue ?? 1);

  return `${unit}:${value}`;
}

function planHasAssignee(plan: MaintenancePlan, userId: string) {
  const fullPlan = plan as MaintenancePlanWithAssignees;

  return [...(fullPlan.assignees ?? []), ...(fullPlan.assignedTo ?? [])].some(
    (assignee) =>
      String(assignee.userId ?? assignee.id ?? "") === userId,
  );
}

export default function MaintenancePlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterTriggerType, setFilterTriggerType] = useState("");
  const [filterEquipmentId, setFilterEquipmentId] = useState("");
  const [filterAssigneeId, setFilterAssigneeId] = useState("");
  const [filterTagId, setFilterTagId] = useState("");
  const [filterCostCenter, setFilterCostCenter] = useState("");
  const [openDropdown, setOpenDropdown] =
    useState<MaintenanceFilterDropdown>(null);
  const [activeTab, setActiveTab] = useState<MaintenanceTab>("all");
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setError("");
      const [
        data,
        equipmentData,
        usersData,
        tagsData,
        costCentersData,
      ] = await Promise.all([
        getMaintenancePlans(),
        getEquipment(),
        getUsers(),
        getTags(),
        getCostCenters(),
      ]);

      setPlans(data);
      setEquipment(equipmentData);
      setUsers(usersData);
      setTags(tagsData);
      setCostCenters(costCentersData);
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
    const counts: Record<MaintenanceTab, number> = {
      all: plans.length,
      planned: 0,
      in_progress: 0,
      late: 0,
      done: 0,
    };

    plans.forEach((plan) => {
      counts[getDisplayStatus(plan)] += 1;
    });

    return counts;
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    const equipmentById = new Map(equipment.map((item) => [item.id, item]));
    const scopedPlans = plans.filter((plan) => {
      const displayStatus = getDisplayStatus(plan);
      const linkedEquipment = equipmentById.get(plan.equipmentId);

      if (activeTab !== "all" && displayStatus !== activeTab) {
        return false;
      }

      if (
        filterTriggerType &&
        getScheduleFilterValue(plan) !== filterTriggerType
      ) {
        return false;
      }

      if (filterEquipmentId && String(plan.equipmentId) !== filterEquipmentId) {
        return false;
      }

      if (filterAssigneeId && !planHasAssignee(plan, filterAssigneeId)) {
        return false;
      }

      if (
        filterTagId &&
        !(linkedEquipment?.tags ?? []).some(
          (tag) => String(tag.id) === filterTagId,
        )
      ) {
        return false;
      }

      if (
        filterCostCenter &&
        (String(linkedEquipment?.costCenterId ?? "") !== filterCostCenter) &&
        plan.costCenter !==
          costCenters.find((costCenter) => String(costCenter.id) === filterCostCenter)
            ?.name
      ) {
        return false;
      }

      return true;
    });

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
  }, [
    activeTab,
    plans,
    equipment,
    search,
    filterTriggerType,
    filterEquipmentId,
    filterAssigneeId,
    filterTagId,
    filterCostCenter,
    costCenters,
  ]);

  function getExportOptions() {
    const statusLabel = getTabLabel(activeTab).toLowerCase();

    return {
      title: `Plans de maintenance - Statut ${statusLabel}`,
      fileName: `plans-maintenance-statut-${statusLabel.replace(/\s+/g, "-")}`,
      headers: [
        "Plan de maintenance",
        "Equipement",
        "Declencheur",
        "Prochaine echeance",
        "Statut",
        "Temps planifie",
        "Temps d'arret planifie",
        "Temps passe",
        "Cout",
        "Compteur",
      ],
      rows: filteredPlans.map((plan) => {
        const status = getDisplayStatus(plan);
        const realizationDraft = readPlanRealizationDraft(plan.id);
        const realizedHours = Number(realizationDraft?.hours ?? 0);
        const realizedMinutes = Number(realizationDraft?.minutes ?? 0);
        const additionalCost = Number(realizationDraft?.additionalCost ?? 0);

        return [
          plan.description,
          plan.equipmentName || "-",
          plan.triggerLabel || "-",
          formatDate(plan.nextDueDate),
          getStatusLabel(status),
          formatDuration(
            plan.plannedMaintenanceHours,
            plan.plannedMaintenanceMinutes,
          ),
          formatDuration(plan.plannedStoppedHours, plan.plannedStoppedMinutes),
          realizationDraft ? formatDuration(realizedHours, realizedMinutes) : "-",
          realizationDraft ? formatMoney(additionalCost) : "-",
          formatPlanCounter(plan, realizationDraft),
        ];
      }),
    };
  }

  function exportCsv() {
    exportTableCsv(getExportOptions());
  }

  function exportPdf() {
    exportTablePdf(getExportOptions());
  }

  function renderMaintenanceFilterDropdown(
    dropdown: Exclude<MaintenanceFilterDropdown, null>,
    value: string,
    setValue: (nextValue: string) => void,
    placeholder: string,
    options: MaintenanceFilterOption[],
  ) {
    const selectedOption = options.find((option) => option.value === value);
    const renderOptionMedia = (option: MaintenanceFilterOption) => {
      if (option.imageUrl) {
        return (
          <span className="maintenance-filter-option-thumb">
            <img src={option.imageUrl} alt="" />
          </span>
        );
      }

      if (option.initials) {
        return (
          <span
            className="maintenance-filter-option-avatar"
            style={{ backgroundColor: option.avatarColor }}
          >
            {option.initials}
          </span>
        );
      }

      return null;
    };

    return (
      <div className="task-filter-dropdown maintenance-filter-dropdown">
        <button
          type="button"
          className="task-filter-dropdown-trigger"
          onClick={() =>
            setOpenDropdown((current) => (current === dropdown ? null : dropdown))
          }
        >
          {selectedOption ? (
            <span className="maintenance-filter-selected-option">
              {renderOptionMedia(selectedOption)}
              <span
                className={`maintenance-filter-option-pill ${
                  selectedOption.tone ? `tone-${selectedOption.tone}` : ""
                }`}
              >
                {selectedOption.label}
              </span>
            </span>
          ) : (
            <span>{placeholder}</span>
          )}
        </button>

        {openDropdown === dropdown && (
          <div className="task-filter-dropdown-panel maintenance-filter-dropdown-panel">
            <button
              type="button"
              className={`task-filter-dropdown-row ${!value ? "selected" : ""}`}
              onClick={() => {
                setValue("");
                setOpenDropdown(null);
              }}
            >
              <span className="maintenance-filter-option-pill tone-neutral">
                Tous
              </span>
              {!value && <CheckCircle2 size={16} />}
            </button>

            {options.map((option) => {
              const isSelected = value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`task-filter-dropdown-row ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    setValue(option.value);
                    setOpenDropdown(null);
                  }}
                >
                  {renderOptionMedia(option)}
                  <span
                    className={`maintenance-filter-option-pill ${
                      option.tone ? `tone-${option.tone}` : ""
                    }`}
                  >
                    {option.label}
                  </span>
                  {isSelected && <CheckCircle2 size={16} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

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
            onClick={exportPdf}
            disabled={filteredPlans.length === 0}
          >
            <Download size={16} />
            PDF
          </button>

          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportCsv}
            disabled={filteredPlans.length === 0}
          >
            <Download size={16} />
            CSV
          </button>

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
        <button
          type="button"
          className={`task-filter-toggle ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters((current) => !current)}
        >
          <SlidersHorizontal size={16} />
          Filtrer
        </button>
      </div>
      {showFilters && (
        <div className="task-filter-panel maintenance-filter-panel">
          <div className="task-filter-grid">
            <div className="task-filter-field">
              <label>
                <History size={15} /> Déclencheur
              </label>
              {renderMaintenanceFilterDropdown(
                "trigger",
                filterTriggerType,
                setFilterTriggerType,
                "Sélectionnez votre option",
                TRIGGER_FILTER_OPTIONS,
              )}
            </div>

            <div className="task-filter-field">
              <label><Wrench size={15} /> Équipements</label>
              {renderMaintenanceFilterDropdown(
                "equipment",
                filterEquipmentId,
                setFilterEquipmentId,
                "Équipements",
                equipment.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                  imageUrl: getFileUrl(item.image, "equipment"),
                  tone: "equipment",
                })),
              )}
            </div>

            <div className="task-filter-field">
              <label><Users size={15} /> Assignés</label>
              {renderMaintenanceFilterDropdown(
                "assignee",
                filterAssigneeId,
                setFilterAssigneeId,
                "Assignés",
                users.map((user) => {
                  const label = getUserName(user);

                  return {
                    value: String(user.id),
                    label,
                    imageUrl: getFileUrl(user.photo, "users"),
                    initials: getInitials(label),
                    avatarColor: getAvatarColor(user.id),
                    tone: "user",
                  };
                }),
              )}
            </div>

            <div className="task-filter-field">
              <label><TagIcon size={15} /> Labels</label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() => setOpenDropdown((current) => current === "label" ? null : "label")}
                >
                  {(() => {
                    const tag = tags.find((item) => String(item.id) === filterTagId);
                    return tag ? (
                      <span className="task-filter-tag-chip" style={{ color: tag.color, borderColor: tag.color, background: `${tag.color}1a` }}>
                        {tag.name}
                      </span>
                    ) : <span>Labels</span>;
                  })()}
                </button>
                {openDropdown === "label" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${!filterTagId ? "selected" : ""}`}
                      onClick={() => { setFilterTagId(""); setOpenDropdown(null); }}
                    >
                      Tous
                      {!filterTagId && <CheckCircle2 size={16} />}
                    </button>
                    {tags.map((tag) => {
                      const isSelected = filterTagId === String(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={`task-filter-dropdown-row ${isSelected ? "selected" : ""}`}
                          onClick={() => { setFilterTagId(String(tag.id)); setOpenDropdown(null); }}
                        >
                          <span className="task-filter-tag-chip" style={{ color: tag.color, borderColor: tag.color, background: `${tag.color}1a` }}>{tag.name}</span>
                          {isSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="task-filter-field">
              <label><MapPin size={15} /> Centre de coûts</label>
              {renderMaintenanceFilterDropdown(
                "costCenter",
                filterCostCenter,
                setFilterCostCenter,
                "Centre de coûts",
                costCenters.map((costCenter) => ({
                  value: String(costCenter.id),
                  label: costCenter.name,
                  tone: "cost",
                })),
              )}
            </div>
          </div>

          <div className="task-filter-actions">
            <button type="button" className="task-filter-apply" onClick={() => setShowFilters(false)}>
              Appliquer les filtres
            </button>
            <button
              type="button"
              className="task-filter-reset"
              onClick={() => {
                setFilterTriggerType("");
                setFilterEquipmentId("");
                setFilterAssigneeId("");
                setFilterTagId("");
                setFilterCostCenter("");
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}
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
              <th>ID</th>
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
                <td colSpan={7} className="resource-table-empty">
                  {activeTab === "all"
                    ? "Aucun plan de maintenance."
                    : `Aucun plan de maintenance avec le statut "${getStatusLabel(activeTab)}".`}
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
                    <td className="resource-table-id-cell">#{plan.id}</td>
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