import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ListChecks,
  MapPin,
  Plus,
  Search,
  Timer,
  Users,
  Wrench,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { getTasks, getTaskSummary, updateTaskStatus } from "../../services/taskService";

import type { TaskListItem, TaskStatus, TaskSummary } from "../../types/task";

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

const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  DONE: { label: "Terminée", icon: CheckCircle2, className: "task-status-done" },
  LATE: { label: "En retard", icon: Clock, className: "task-status-late" },
  IN_PROGRESS: {
    label: "En cours",
    icon: Timer,
    className: "task-status-progress",
  },
};

function TaskListPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const [taskList, taskSummary] = await Promise.all([
          getTasks(),
          getTaskSummary(),
        ]);

        setTasks(taskList);
        setSummary(taskSummary);
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

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return tasks;
    }

    return tasks.filter((task) =>
      [
        task.description,
        task.equipment?.name,
        task.equipment?.itemCode,
        task.costCenterName,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [tasks, search]);

  return (
    <section className="admin-page">
      <div className="resource-page-header">
        <div>
          <span className="admin-page-eyebrow">Maintenance</span>
          <h1>Tâches</h1>
          <p>Suivi des interventions planifiées sur vos équipements.</p>
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
            placeholder="Rechercher une tâche, un équipement, un centre de coût…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

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

      {loading && <div className="resource-loading">Chargement…</div>}

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
                <th>Assignés</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="resource-table-empty">
                    Aucune tâche ne correspond à votre recherche.
                  </td>
                </tr>
              )}

              {filteredTasks.map((task) => {
                const status = STATUS_META[task.status];
                const StatusIcon = status.icon;
                const equipmentImage = getFileUrl(
                  task.equipment?.image ?? null,
                );

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
                        {task.equipment?.name || "—"}
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
                        <span className="task-unassigned">Non assignée</span>
                      )}
                    </td>

                    <td onClick={(event) => event.stopPropagation()}>
                      {editingStatusId === task.id ? (
                        <select
                          autoFocus
                          className="task-status-select"
                          value={task.status}
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
                          <option value="LATE">En retard</option>
                        </select>
                      ) : (
                        <button
                          type="button"
                          className={`task-status-badge task-status-editable ${status.className}`}
                          onClick={() => setEditingStatusId(task.id)}
                        >
                          <StatusIcon size={13} />
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
