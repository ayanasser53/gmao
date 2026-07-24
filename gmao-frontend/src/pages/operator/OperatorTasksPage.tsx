import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Clock,
  History,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyCreatedTasks } from "../../services/taskService";
import type { TaskListItem, TaskStatus } from "../../types/task";

import "../admin/task-styles.css";

const BACKEND_URL = "http://localhost:8090";

const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  PLANNED: { label: "Planifiee", className: "task-status-planned" },
  IN_PROGRESS: { label: "En cours", className: "task-status-progress" },
  LATE: { label: "En retard", className: "task-status-late" },
  DONE: { label: "Terminee", className: "task-status-done" },
};

type TaskTab = "ALL" | TaskStatus;

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

function OperatorTasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TaskTab>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setTasks(await getMyCreatedTasks());
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger vos taches.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const statusCounts = useMemo(
    () => ({
      ALL: tasks.length,
      PLANNED: tasks.filter((task) => task.status === "PLANNED").length,
      IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      LATE: tasks.filter((task) => task.status === "LATE").length,
      DONE: tasks.filter((task) => task.status === "DONE").length,
    }),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      if (activeTab !== "ALL" && task.status !== activeTab) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        task.description,
        task.equipment?.name,
        task.equipment?.itemCode,
        task.costCenterName,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [tasks, search, activeTab]);

  return (
    <section className="operator-page">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <ClipboardList size={28} />
            <h1>Mes taches</h1>
          </div>
        </div>

        <button
          type="button"
          className="resource-primary-button"
          onClick={() => navigate("/operator/tasks/new")}
        >
          <Plus size={17} />
          Creer une tache
        </button>
      </div>

      <div className="resource-toolbar">
        <div className="resource-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Rechercher une tache ou un equipement..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="task-status-cards">
        <button
          type="button"
          className={`tab-all ${activeTab === "ALL" ? "active" : ""}`}
          onClick={() => setActiveTab("ALL")}
        >
          <ClipboardList size={18} />
          Tout
          <span>{statusCounts.ALL}</span>
        </button>
        <button
          type="button"
          className={`tab-planned ${activeTab === "PLANNED" ? "active" : ""}`}
          onClick={() => setActiveTab("PLANNED")}
        >
          <CalendarClock size={18} />
          Planifiee
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
          Terminee
          <span>{statusCounts.DONE}</span>
        </button>
      </div>

      {loading && <div className="resource-loading">Chargement...</div>}

      {!loading && error && <div className="resource-error-message">{error}</div>}

      {!loading && !error && (
        <div className="resource-table-container">
          <table className="resource-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tache</th>
                <th>Equipement</th>
                <th>Centre de cout</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="resource-table-empty">
                    Aucune tache trouvee.
                  </td>
                </tr>
              )}

              {filteredTasks.map((task) => {
                const status = STATUS_META[task.status];
                const equipmentImage = getFileUrl(task.equipment?.image ?? null);

                return (
                  <tr
                    key={task.id}
                    className="supplier-clickable-row"
                    onClick={() => navigate(`/operator/tasks/${task.id}`)}
                  >
                    <td className="resource-table-id-cell">#{task.id}</td>
                    <td>
                      <div className="task-cell-main">
                        <span className="task-cell-title">{task.description}</span>
                        <span className="task-cell-meta">
                          <CalendarDays size={13} />
                          Creee le {formatDate(task.startDate)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="task-equipment-cell">
                        <span className="task-equipment-thumb">
                          {equipmentImage ? (
                            <img src={equipmentImage} alt={task.equipment?.name} />
                          ) : (
                            <Wrench size={16} />
                          )}
                        </span>
                        {task.equipment?.name || "-"}
                      </span>
                    </td>
                    <td>{task.costCenterName || "Non defini"}</td>
                    <td>{formatDate(task.startDate)}</td>
                    <td>
                      <span className={`task-status-badge ${status.className}`}>
                        {status.label}
                      </span>
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

export default OperatorTasksPage;
