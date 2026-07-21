import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  History,
  ListChecks,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getEquipment } from "../../services/equipmentService";
import { getCostCenters } from "../../services/costCenterService";
import { getTasks, getTaskSummary, updateTaskStatus, fetchTagOptions, type TagOption } from "../../services/taskService";
import { getTeams } from "../../services/teamService";
import { getUsersDetailed } from "../../services/userService";
import type { Equipment } from "../../types/equipment";
import type { CostCenter } from "../../types/costCenter";
import type { TaskListItem, TaskStatus, TaskSummary } from "../../types/task";
import type { Team } from "../../types/team";
import type { UserDetail } from "../../types/user";

import "./task-styles.css";

const BACKEND_URL = "http://localhost:8090";

function getFileUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(hours: number, minutes: number): string {
  return `${hours}h ${minutes.toString().padStart(2, "0")}mn`;
}

const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  PLANNED: { label: "Planifiée", className: "task-status-planned" },
  DONE: { label: "Terminée", className: "task-status-done" },
  LATE: { label: "En retard", className: "task-status-late" },
  IN_PROGRESS: { label: "En cours", className: "task-status-progress" },
};

const AVATAR_COLORS = [
  "#087fbd",
  "#6b46c1",
  "#198754",
  "#a3660f",
  "#b42318",
  "#0f766e",
];

function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const second = parts.length > 1 ? parts[1].charAt(0) : parts[0]?.charAt(1) ?? "";
  return `${first}${second}`.toUpperCase();
}

function TaskListPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TaskStatus>("PLANNED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<
    "assignedTo" | "reportedBy" | "tags" | "equipment" | null
  >(null);
  const [userOptions, setUserOptions] = useState<UserDetail[]>([]);
  const [teamOptions, setTeamOptions] = useState<Team[]>([]);
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([]);
  const [costCenterOptions, setCostCenterOptions] = useState<CostCenter[]>([]);

  const [filterAssignedTo, setFilterAssignedTo] = useState("");
  const [filterReportedBy, setFilterReportedBy] = useState("");
  const [filterTagId, setFilterTagId] = useState("");
  const [filterEquipmentId, setFilterEquipmentId] = useState("");
  const [filterCostCenterId, setFilterCostCenterId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    assignedTo: "",
    reportedBy: "",
    tagId: "",
    equipmentId: "",
    costCenterId: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const [taskList, taskSummary, users, teams, tags, equipmentList, costCenters] =
          await Promise.all([
            getTasks(),
            getTaskSummary(),
            getUsersDetailed().catch(() => [] as UserDetail[]),
            getTeams().catch(() => [] as Team[]),
            fetchTagOptions().catch(() => [] as TagOption[]),
            getEquipment().catch(() => [] as Equipment[]),
            getCostCenters().catch(() => [] as CostCenter[]),
          ]);

        setTasks(taskList);
        setSummary(taskSummary);
        setUserOptions(users);
        setTeamOptions(teams);
        setTagOptions(tags);
        setEquipmentOptions(equipmentList);
        setCostCenterOptions(costCenters);
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger les tâches.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function handleStatusChange(
    taskId: number,
    newStatus: TaskStatus,
  ): Promise<void> {
    setStatusUpdating(taskId);

    try {
      await updateTaskStatus(taskId, newStatus);

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task,
        ),
      );
    } catch (requestError) {
      console.error(requestError);
      setError("Impossible de mettre à jour le statut.");
    } finally {
      setStatusUpdating(null);
      setEditingStatusId(null);
    }
  }

  const statusCounts = useMemo(() => {
    return {
      PLANNED: tasks.filter((task) => task.status === "PLANNED").length,
      IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      LATE: tasks.filter((task) => task.status === "LATE").length,
      DONE: tasks.filter((task) => task.status === "DONE").length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (task.status !== activeTab) {
        return false;
      }

      if (query) {
        const matchesQuery = [
          task.description,
          task.equipment?.name,
          task.equipment?.itemCode,
          task.costCenterName,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));

        if (!matchesQuery) {
          return false;
        }
      }

      if (appliedFilters.assignedTo) {
        const [type, idValue] = appliedFilters.assignedTo.split("-");
        const id = Number(idValue);

        const matches = task.assignedTo.some((assignee) =>
          type === "user"
            ? assignee.type === "USER" && assignee.userId === id
            : assignee.type === "TEAM" && assignee.teamId === id,
        );

        if (!matches) {
          return false;
        }
      }

      if (appliedFilters.reportedBy) {
        const id = Number(appliedFilters.reportedBy);
        const matches = task.assignees.some(
          (assignee) => assignee.type === "USER" && assignee.userId === id,
        );

        if (!matches) {
          return false;
        }
      }

      if (appliedFilters.tagId) {
        const id = Number(appliedFilters.tagId);
        if (!task.tags.some((tag) => tag.id === id)) {
          return false;
        }
      }

      if (appliedFilters.equipmentId) {
        if (task.equipment?.id !== Number(appliedFilters.equipmentId)) {
          return false;
        }
      }

      if (appliedFilters.costCenterId) {
        if (task.costCenterId !== Number(appliedFilters.costCenterId)) {
          return false;
        }
      }

      if (
        appliedFilters.startDate &&
        task.startDate < appliedFilters.startDate
      ) {
        return false;
      }

      if (appliedFilters.endDate && task.startDate > appliedFilters.endDate) {
        return false;
      }

      return true;
    });
  }, [tasks, search, activeTab, appliedFilters]);

  const activeFilterCount = Object.values(appliedFilters).filter(
    Boolean,
  ).length;

  function applyFilters(): void {
    setAppliedFilters({
      assignedTo: filterAssignedTo,
      reportedBy: filterReportedBy,
      tagId: filterTagId,
      equipmentId: filterEquipmentId,
      costCenterId: filterCostCenterId,
      startDate: filterStartDate,
      endDate: filterEndDate,
    });
  }

  function resetFilters(): void {
    setFilterAssignedTo("");
    setFilterReportedBy("");
    setFilterTagId("");
    setFilterEquipmentId("");
    setFilterCostCenterId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setAppliedFilters({
      assignedTo: "",
      reportedBy: "",
      tagId: "",
      equipmentId: "",
      costCenterId: "",
      startDate: "",
      endDate: "",
    });
  }

  return (
    <section className="admin-page">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <ClipboardList size={28} />
            <h1>Tâches</h1>
          </div>
        </div>

        <div className="resource-header-actions">
          <button
            type="button"
            className="resource-primary-button"
            onClick={() => navigate("/admin/tasks/new")}
          >
            <Plus size={17} />
            Créer une tâche
          </button>
        </div>
      </div>

      <div className="resource-toolbar">
        <div className="resource-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Rechercher une tâche, un équipement, un centre de coût..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <button
          type="button"
          className={`task-filter-toggle ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters((current) => !current)}
        >
          <SlidersHorizontal size={16} />
          Filtres
          {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
        </button>

        {summary && (
          <span className="task-summary-chip">
            <ListChecks size={16} />
            <strong>{summary.totalTasks}</strong> tâches ·{" "}
            {formatDuration(
              summary.totalPlannedHours,
              summary.totalPlannedMinutes,
            )}
          </span>
        )}
      </div>

      {showFilters && (
        <div className="task-filter-panel">
          <div className="task-filter-grid">
            <div className="task-filter-field">
              <label>
                <Users size={15} /> Assigné à
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenDropdown((current) =>
                      current === "assignedTo" ? null : "assignedTo",
                    )
                  }
                >
                  {(() => {
                    if (!filterAssignedTo) {
                      return <span>Tous</span>;
                    }

                    const [type, idValue] = filterAssignedTo.split("-");
                    const id = Number(idValue);

                    if (type === "team") {
                      const team = teamOptions.find((t) => t.id === id);
                      return (
                        <>
                          <span
                            className="task-filter-team-avatar"
                            style={{ background: avatarColor(id) }}
                          >
                            {team ? teamInitials(team.name) : ""}
                          </span>
                          {team?.name}
                        </>
                      );
                    }

                    const user = userOptions.find((u) => u.id === id);
                    return user ? (
                      <>
                        <span
                          className="task-filter-avatar"
                          style={{ background: avatarColor(user.id) }}
                        >
                          {initials(user.firstName, user.lastName)}
                        </span>
                        {user.firstName} {user.lastName}
                      </>
                    ) : (
                      <span>Tous</span>
                    );
                  })()}
                </button>

                {openDropdown === "assignedTo" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterAssignedTo ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterAssignedTo("");
                        setOpenDropdown(null);
                      }}
                    >
                      Tous
                      {!filterAssignedTo && <CheckCircle2 size={16} />}
                    </button>

                    {teamOptions.length > 0 && (
                      <p className="task-filter-dropdown-heading">Équipes</p>
                    )}

                    {teamOptions.map((team) => {
                      const value = `team-${team.id}`;
                      const isSelected = filterAssignedTo === value;

                      return (
                        <button
                          type="button"
                          key={value}
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterAssignedTo(value);
                            setOpenDropdown(null);
                          }}
                        >
                          <span
                            className="task-filter-team-avatar"
                            style={{ background: avatarColor(team.id) }}
                          >
                            {teamInitials(team.name)}
                          </span>
                          {team.name}
                          {isSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}

                    {userOptions.length > 0 && (
                      <p className="task-filter-dropdown-heading">
                        Collègues
                      </p>
                    )}

                    {userOptions.map((user) => {
                      const value = `user-${user.id}`;
                      const isSelected = filterAssignedTo === value;

                      return (
                        <button
                          type="button"
                          key={value}
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterAssignedTo(value);
                            setOpenDropdown(null);
                          }}
                        >
                          <span
                            className="task-filter-avatar"
                            style={{ background: avatarColor(user.id) }}
                          >
                            {initials(user.firstName, user.lastName)}
                          </span>
                          {user.firstName} {user.lastName}
                          {isSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="task-filter-field">
              <label>
                <Users size={15} /> Signalé par
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenDropdown((current) =>
                      current === "reportedBy" ? null : "reportedBy",
                    )
                  }
                >
                  {(() => {
                    const user = userOptions.find(
                      (u) => u.id === Number(filterReportedBy),
                    );

                    return user ? (
                      <>
                        <span
                          className="task-filter-avatar"
                          style={{ background: avatarColor(user.id) }}
                        >
                          {initials(user.firstName, user.lastName)}
                        </span>
                        {user.firstName} {user.lastName}
                      </>
                    ) : (
                      <span>Tous</span>
                    );
                  })()}
                </button>

                {openDropdown === "reportedBy" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterReportedBy ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterReportedBy("");
                        setOpenDropdown(null);
                      }}
                    >
                      Tous
                      {!filterReportedBy && <CheckCircle2 size={16} />}
                    </button>

                    {userOptions.map((user) => {
                      const isSelected =
                        filterReportedBy === String(user.id);

                      return (
                        <button
                          type="button"
                          key={user.id}
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterReportedBy(String(user.id));
                            setOpenDropdown(null);
                          }}
                        >
                          <span
                            className="task-filter-avatar"
                            style={{ background: avatarColor(user.id) }}
                          >
                            {initials(user.firstName, user.lastName)}
                          </span>
                          {user.firstName} {user.lastName}
                          {isSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="task-filter-field">
              <label>
                <Tag size={15} /> Tags
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenDropdown((current) =>
                      current === "tags" ? null : "tags",
                    )
                  }
                >
                  {(() => {
                    const tag = tagOptions.find(
                      (t) => t.id === Number(filterTagId),
                    );

                    return tag ? (
                      <span
                        className="task-filter-tag-chip"
                        style={{
                          color: tag.color,
                          borderColor: tag.color,
                          background: `${tag.color}1a`,
                        }}
                      >
                        {tag.label}
                      </span>
                    ) : (
                      <span>Tous</span>
                    );
                  })()}
                </button>

                {openDropdown === "tags" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterTagId ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterTagId("");
                        setOpenDropdown(null);
                      }}
                    >
                      Tous
                      {!filterTagId && <CheckCircle2 size={16} />}
                    </button>

                    {tagOptions.map((tag) => {
                      const isSelected = filterTagId === String(tag.id);

                      return (
                        <button
                          type="button"
                          key={tag.id}
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterTagId(String(tag.id));
                            setOpenDropdown(null);
                          }}
                        >
                          <span
                            className="task-filter-tag-chip"
                            style={{
                              color: tag.color,
                              borderColor: tag.color,
                              background: `${tag.color}1a`,
                            }}
                          >
                            {tag.label}
                          </span>
                          {isSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="task-filter-field">
              <label>
                <Wrench size={15} /> Équipement
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenDropdown((current) =>
                      current === "equipment" ? null : "equipment",
                    )
                  }
                >
                  {(() => {
                    const equipment = equipmentOptions.find(
                      (e) => e.id === Number(filterEquipmentId),
                    );

                    if (!equipment) {
                      return <span>Tous</span>;
                    }

                    const image = getFileUrl(equipment.image);

                    return (
                      <>
                        <span className="task-filter-equip-thumb">
                          {image ? (
                            <img src={image} alt={equipment.name} />
                          ) : (
                            <Wrench size={13} />
                          )}
                        </span>
                        {equipment.name}
                      </>
                    );
                  })()}
                </button>

                {openDropdown === "equipment" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterEquipmentId ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterEquipmentId("");
                        setOpenDropdown(null);
                      }}
                    >
                      Tous
                      {!filterEquipmentId && <CheckCircle2 size={16} />}
                    </button>

                    {equipmentOptions.map((equipment) => {
                      const isSelected =
                        filterEquipmentId === String(equipment.id);
                      const image = getFileUrl(equipment.image);

                      return (
                        <button
                          type="button"
                          key={equipment.id}
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterEquipmentId(String(equipment.id));
                            setOpenDropdown(null);
                          }}
                        >
                          <span className="task-filter-equip-thumb">
                            {image ? (
                              <img src={image} alt={equipment.name} />
                            ) : (
                              <Wrench size={13} />
                            )}
                          </span>
                          {equipment.name}
                          {isSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="task-filter-field">
              <label>
                <MapPin size={15} /> Centre de coût
              </label>
              <select
                value={filterCostCenterId}
                onChange={(e) => setFilterCostCenterId(e.target.value)}
              >
                <option value="">Tous</option>
                {costCenterOptions.map((costCenter) => (
                  <option key={costCenter.id} value={costCenter.id}>
                    {costCenter.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="task-filter-field">
              <label>
                <CalendarDays size={15} /> Période
              </label>
              <div className="task-filter-period">
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
                <span>→</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="task-filter-actions">
            <button
              type="button"
              className="task-filter-apply"
              onClick={applyFilters}
            >
              Appliquer les filtres
            </button>

            <button
              type="button"
              className="task-filter-reset"
              onClick={resetFilters}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      <div className="task-status-cards">
        <button
          type="button"
          className={`tab-planned ${activeTab === "PLANNED" ? "active" : ""}`}
          onClick={() => setActiveTab("PLANNED")}
        >
          <CalendarClock size={18} />
          Planifiée
          <span>{statusCounts.PLANNED}</span>
        </button>
        <button
          type="button"
          className={`tab-progress ${activeTab === "IN_PROGRESS" ? "active" : ""}`}
          onClick={() => setActiveTab("IN_PROGRESS")}
        >
          <Clock size={18} />
          En cours
          <span>{statusCounts.IN_PROGRESS}</span>
        </button>
        <button
          type="button"
          className={`tab-late ${activeTab === "LATE" ? "active" : ""}`}
          onClick={() => setActiveTab("LATE")}
        >
          <Clock size={18} />
          En retard
          <span>{statusCounts.LATE}</span>
        </button>
        <button
          type="button"
          className={`tab-done ${activeTab === "DONE" ? "active" : ""}`}
          onClick={() => setActiveTab("DONE")}
        >
          <History size={18} />
          Terminée
          <span>{statusCounts.DONE}</span>
        </button>
      </div>

      {loading && <div className="resource-loading">Chargement...</div>}

      {!loading && error && (
        <div className="resource-error-message">{error}</div>
      )}

      {!loading && !error && (
        <div className="resource-table-container">
          <table className="resource-table">
            <thead>
              <tr>
                <th>Tâche</th>
                <th>Équipement</th>
                <th>Centre de coût</th>
                <th>Signalé par</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="resource-table-empty">
                    {`Aucune tâche avec le statut "${STATUS_META[activeTab].label}".`}
                  </td>
                </tr>
              )}

              {filteredTasks.map((task) => {
                const status = STATUS_META[task.status];
                const equipmentImage = getFileUrl(
                  task.equipment?.image ?? null,
                );
                const selectedStatus =
                  task.status === "LATE" || task.status === "PLANNED"
                    ? "IN_PROGRESS"
                    : task.status;

                return (
                  <tr
                    key={task.id}
                    className="supplier-clickable-row"
                    onClick={() => navigate(`/admin/tasks/${task.id}`)}
                  >
                    <td>
                      <div className="task-cell-main">
                        <span className="task-cell-title">
                          {task.description}
                        </span>

                        <span className="task-cell-meta">
                          <CalendarDays size={13} />
                          {formatDate(task.startDate)}
                          {task.startHour &&
                            ` · ${task.startHour.slice(0, 5)}`}
                        </span>

                        {task.tags.length > 0 && (
                          <span className="task-cell-tags">
                            {task.tags.map((tag) => (
                              <span
                                key={tag.id}
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="task-equipment-cell">
                        <span className="task-equipment-thumb">
                          {equipmentImage ? (
                            <img
                              src={equipmentImage}
                              alt={task.equipment?.name}
                            />
                          ) : (
                            <Wrench size={16} />
                          )}
                        </span>
                        {task.equipment?.name || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="supplier-contact-cell">
                        <MapPin size={14} />
                        {task.costCenterName || "Non défini"}
                      </span>
                    </td>

                    <td>
                      {task.assignees.length > 0 ? (
                        <span className="supplier-contact-cell">
                          <Users size={14} />
                          {task.assignees
                            .map((assignee) =>
                              assignee.type === "USER"
                                ? assignee.userFullName
                                : assignee.teamName,
                            )
                            .join(", ")}
                        </span>
                      ) : (
                        <span className="task-unassigned">Non renseigné</span>
                      )}
                    </td>

                    <td onClick={(event) => event.stopPropagation()}>
                      {editingStatusId === task.id ? (
                        <select
                          autoFocus
                          className={`task-status-select ${STATUS_META[selectedStatus].className}`}
                          value={selectedStatus}
                          disabled={statusUpdating === task.id}
                          onBlur={() => setEditingStatusId(null)}
                          onChange={(event) =>
                            handleStatusChange(
                              task.id,
                              event.target.value as TaskStatus,
                            )
                          }
                        >
                          <option value="IN_PROGRESS">En cours</option>
                          <option value="DONE">Terminée</option>
                        </select>
                      ) : (
                        <button
                          type="button"
                          className={`task-status-badge task-status-editable ${status.className}`}
                          onClick={() => setEditingStatusId(task.id)}
                        >
                          {status.label}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default TaskListPage;