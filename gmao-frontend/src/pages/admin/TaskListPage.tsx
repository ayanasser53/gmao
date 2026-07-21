import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Clock,
  History,
  ListChecks,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  Wrench,
  X,
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

      if (filterAssignedTo) {
        const [type, idValue] = filterAssignedTo.split("-");
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

      if (filterReportedBy) {
        const id = Number(filterReportedBy);
        const matches = task.assignees.some(
          (assignee) => assignee.type === "USER" && assignee.userId === id,
        );

        if (!matches) {
          return false;
        }
      }

      if (filterTagId) {
        const id = Number(filterTagId);
        if (!task.tags.some((tag) => tag.id === id)) {
          return false;
        }
      }

      if (filterEquipmentId) {
        if (task.equipment?.id !== Number(filterEquipmentId)) {
          return false;
        }
      }

      if (filterCostCenterId) {
        if (task.costCenterId !== Number(filterCostCenterId)) {
          return false;
        }
      }

      if (filterStartDate && task.startDate < filterStartDate) {
        return false;
      }

      if (filterEndDate && task.startDate > filterEndDate) {
        return false;
      }

      return true;
    });
  }, [
    tasks,
    search,
    activeTab,
    filterAssignedTo,
    filterReportedBy,
    filterTagId,
    filterEquipmentId,
    filterCostCenterId,
    filterStartDate,
    filterEndDate,
  ]);

  const activeFilterCount = [
    filterAssignedTo,
    filterReportedBy,
    filterTagId,
    filterEquipmentId,
    filterCostCenterId,
    filterStartDate,
    filterEndDate,
  ].filter(Boolean).length;

  function resetFilters(): void {
    setFilterAssignedTo("");
    setFilterReportedBy("");
    setFilterTagId("");
    setFilterEquipmentId("");
    setFilterCostCenterId("");
    setFilterStartDate("");
    setFilterEndDate("");
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
            <div className="measure-form-group">
              <label>Assigné à</label>
              <select
                value={filterAssignedTo}
                onChange={(e) => setFilterAssignedTo(e.target.value)}
              >
                <option value="">Tous</option>
                <optgroup label="Équipes">
                  {teamOptions.map((team) => (
                    <option key={`team-${team.id}`} value={`team-${team.id}`}>
                      {team.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Collègues">
                  {userOptions.map((user) => (
                    <option key={`user-${user.id}`} value={`user-${user.id}`}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="measure-form-group">
              <label>Signalé par</label>
              <select
                value={filterReportedBy}
                onChange={(e) => setFilterReportedBy(e.target.value)}
              >
                <option value="">Tous</option>
                {userOptions.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="measure-form-group">
              <label>Tags</label>
              <select
                value={filterTagId}
                onChange={(e) => setFilterTagId(e.target.value)}
              >
                <option value="">Tous</option>
                {tagOptions.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="measure-form-group">
              <label>Équipement</label>
              <select
                value={filterEquipmentId}
                onChange={(e) => setFilterEquipmentId(e.target.value)}
              >
                <option value="">Tous</option>
                {equipmentOptions.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="measure-form-group">
              <label>Centre de coût</label>
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

            <div className="measure-form-group">
              <label>Période</label>
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

          {activeFilterCount > 0 && (
            <button
              type="button"
              className="task-filter-reset"
              onClick={resetFilters}
            >
              <X size={14} />
              Réinitialiser les filtres
            </button>
          )}
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