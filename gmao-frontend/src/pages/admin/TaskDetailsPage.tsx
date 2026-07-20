import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  Package,
  Plus,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getActivitiesByTask } from "../../services/activityService";
import { getTaskById } from "../../services/taskService";
import type { Activity, ActivityStatus } from "../../types/activity";
import type { Task, TaskStatus } from "../../types/task";

import "./task-styles.css";

const BACKEND_URL = "http://localhost:8090";

function getFileUrl(path: string | null | undefined): string | null {
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

  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "-";
}

function formatDuration(hours = 0, minutes = 0): string {
  if (hours === 0 && minutes === 0) {
    return "0mn.";
  }

  return `${hours > 0 ? `${hours}h ` : ""}${minutes
    .toString()
    .padStart(2, "0")}mn.`;
}

function money(value: number | null | undefined, currency?: string | null) {
  if (value == null) {
    return "-";
  }

  return `${Number(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency || "EUR"}`;
}

const TASK_STATUS_META: Record<TaskStatus, { label: string; className: string }> =
  {
    DONE: { label: "Terminée", className: "task-status-done" },
    LATE: { label: "En retard", className: "task-status-late" },
    IN_PROGRESS: { label: "En cours", className: "task-status-progress" },
  };

const ACTIVITY_STATUS_META: Record<
  ActivityStatus,
  { label: string; className: string }
> = {
  DONE: { label: "Terminée", className: "task-status-done" },
  LATE: { label: "En retard", className: "task-status-late" },
  IN_PROGRESS: { label: "En cours", className: "task-status-progress" },
};

function initials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim().charAt(0) || "";
  const last = lastName?.trim().charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "AD";
}

function activityTotal(activity: Activity): number {
  const sparePartsTotal = (activity.spareParts || []).reduce((total, item) => {
    return total + (item.unitPrice || 0) * (item.quantity || 0);
  }, 0);

  const additionalCostsTotal = (activity.additionalCosts || []).reduce(
    (total, item) => total + (item.amount || 0),
    0,
  );

  return sparePartsTotal + additionalCostsTotal;
}

function TaskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const taskId = Number(id);
  const [task, setTask] = useState<Task | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTaskDetails() {
      if (!Number.isFinite(taskId)) {
        setError("Tâche introuvable.");
        setLoading(false);
        return;
      }

      try {
        const [taskData, activityData] = await Promise.all([
          getTaskById(taskId),
          getActivitiesByTask(taskId),
        ]);

        setTask(taskData);
        setActivities(activityData);
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger les détails de la tâche.");
      } finally {
        setLoading(false);
      }
    }

    void loadTaskDetails();
  }, [taskId]);

  const equipmentImage = useMemo(
    () => getFileUrl(task?.equipment?.image),
    [task?.equipment?.image],
  );

  const spentMinutes = useMemo(
    () =>
      activities.reduce(
        (total, activity) =>
          total + activity.spentHours * 60 + activity.spentMinutes,
        0,
      ),
    [activities],
  );

  if (loading) {
    return (
      <section className="admin-page">
        <div className="resource-loading">Chargement...</div>
      </section>
    );
  }

  if (error || !task) {
    return (
      <section className="admin-page">
        <div className="resource-error-message">
          {error || "Tâche introuvable."}
        </div>
      </section>
    );
  }

  const status = TASK_STATUS_META[task.status];

  return (
    <section className="admin-page task-details-page">
      <div className="details-topbar">
        <button
          type="button"
          className="details-back-button"
          onClick={() => navigate("/admin/tasks")}
          aria-label="Retour aux tâches"
        >
          <ArrowLeft size={22} />
        </button>

        <div>
          <div className="details-eyebrow">Fiche tâche</div>
          <div className="details-title-row">
            <ClipboardList size={30} />
            <h1>Tâche</h1>
            <span className={`task-status-badge ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="task-details-grid">
        <div className="task-details-main">
          <article className="details-card task-info-card">
            <div className="task-detail-item">
              <CalendarDays size={21} />
              <div>
                <span>Date planifiée</span>
                <strong>
                  {formatDate(task.startDate)}
                  {task.startHour ? ` à ${formatTime(task.startHour)}` : ""}
                </strong>
              </div>
            </div>

            <div className="task-detail-item">
              <Users size={21} />
              <div>
                <span>Assignés</span>
                {task.assignees.length > 0 ? (
                  <div className="task-avatar-list">
                    {task.assignees.map((assignee) => (
                      <span
                        key={`${assignee.type}-${
                          assignee.userId || assignee.teamId
                        }`}
                      >
                        {assignee.type === "USER"
                          ? assignee.userFullName
                          : assignee.teamName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <strong>Aucun assigné.</strong>
                )}
              </div>
            </div>

            <div className="task-detail-item">
              <Tag size={21} />
              <div>
                <span>Labels</span>
                {task.tags.length > 0 ? (
                  <div className="task-cell-tags">
                    {task.tags.map((tag) => (
                      <span key={tag.id} style={{ backgroundColor: tag.color }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <strong>Aucun label.</strong>
                )}
              </div>
            </div>

            <div className="task-detail-item task-detail-wide">
              <FileText size={21} />
              <div>
                <span>Description</span>
                <strong>{task.description || "Aucune description renseignée."}</strong>
              </div>
            </div>
          </article>

          <article className="details-card">
            <div className="details-section-header">
              <h2>Pièces détachées à prévoir</h2>
            </div>

            {task.spareParts.length === 0 ? (
              <p className="task-empty-hint">Aucune pièce détachée liée.</p>
            ) : (
              <div className="task-linked-list">
                {task.spareParts.map((line) => {
                  const sparePartImage = getFileUrl(line.imageUrl);

                  return (
                    <div key={line.sparePartId} className="task-linked-row">
                      <span className="task-equipment-thumb">
                        {sparePartImage ? (
                          <img src={sparePartImage} alt={line.name} />
                        ) : (
                          <Package size={17} />
                        )}
                      </span>
                      <div>
                        <strong>{line.name}</strong>
                        <span>
                          Code : {line.code || "Non défini"} · Quantité à
                          prévoir : {line.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="details-card task-activity-card">
            <div className="details-section-header">
              <h2>Activités</h2>
              <button
                type="button"
                className="resource-primary-button"
                onClick={() => navigate("/admin/activities/create")}
              >
                <Plus size={17} />
                Ajouter une activité
              </button>
            </div>

            {activities.length === 0 ? (
              <p className="task-empty-hint">Aucune activité enregistrée.</p>
            ) : (
              <div className="activity-timeline">
                {activities.map((activity) => {
                  const activityStatus = ACTIVITY_STATUS_META[activity.status];
                  const mainIntervenant = activity.intervenants?.[0];
                  const total = activityTotal(activity);
                  const isOpen = selectedActivityId === activity.id;

                  return (
                    <article
                      key={activity.id}
                      className={`activity-history-card activity-clickable-card ${
                        isOpen ? "is-open" : ""
                      }`}
                      onClick={() =>
                        setSelectedActivityId((current) =>
                          current === activity.id ? null : activity.id,
                        )
                      }
                    >
                      <div className="activity-history-header">
                        <span className="activity-avatar">
                          {initials(
                            mainIntervenant?.firstName,
                            mainIntervenant?.lastName,
                          )}
                        </span>
                        <strong>
                          {mainIntervenant
                            ? `${mainIntervenant.firstName || ""} ${
                                mainIntervenant.lastName || ""
                              }`.trim()
                            : "Administrateur"}
                        </strong>
                        <span
                          className={`task-status-badge ${activityStatus.className}`}
                        >
                          {activityStatus.label}
                        </span>
                        <button
                          type="button"
                          className="activity-detail-link"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedActivityId((current) =>
                              current === activity.id ? null : activity.id,
                            );
                          }}
                        >
                          {isOpen ? "Masquer le détail" : "Voir le détail"}
                        </button>
                      </div>

                      {isOpen && (
                        <>
                          <div className="activity-history-grid">
                            <div className="task-detail-item">
                              <FileText size={19} />
                              <div>
                                <span>Description</span>
                                <strong>{activity.description}</strong>
                              </div>
                            </div>

                            <div className="task-detail-item">
                              <CalendarDays size={19} />
                              <div>
                                <span>Réalisée le</span>
                                <strong>
                                  {formatShortDate(activity.performedDate)}{" "}
                                  {formatTime(activity.performedEndTime)}
                                </strong>
                              </div>
                            </div>

                            <div className="task-detail-item">
                              <Clock size={19} />
                              <div>
                                <span>Temps passé</span>
                                <strong>
                                  {formatDuration(
                                    activity.spentHours,
                                    activity.spentMinutes,
                                  )}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {activity.spareParts?.length > 0 && (
                            <div className="activity-linked-lines">
                              {activity.spareParts.map((item) => (
                                <span key={item.sparePartId}>
                                  <Package size={15} />
                                  {item.name} · {item.quantity} ·{" "}
                                  {money(
                                    (item.unitPrice || 0) * item.quantity,
                                    item.currency,
                                  )}
                                </span>
                              ))}
                            </div>
                          )}

                          {activity.additionalCosts?.length > 0 && (
                            <div className="activity-linked-lines">
                              {activity.additionalCosts.map((item) => (
                                <span key={item.id}>
                                  <Plus size={15} />
                                  {item.label} · {money(item.amount, item.currency)}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="activity-total">
                            TOTAL <strong>{money(total)}</strong>
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </article>
        </div>

        <aside className="task-details-side">
          <article className="details-card">
            <h2>Équipement</h2>
            <button
              type="button"
              className="task-equipment-summary"
              onClick={() =>
                task.equipment && navigate(`/admin/equipment/${task.equipment.id}`)
              }
              disabled={!task.equipment}
            >
              <span className="task-equipment-thumb task-equipment-thumb-large">
                {equipmentImage ? (
                  <img src={equipmentImage} alt={task.equipment?.name} />
                ) : (
                  <Wrench size={20} />
                )}
              </span>
              <span>
                <em>Nom de l'équipement</em>
                <strong>{task.equipment?.name || "Non défini"}</strong>
              </span>
            </button>

            <div className="task-detail-item">
              <MapPin size={21} />
              <div>
                <span>Code article</span>
                <strong>{task.equipment?.itemCode || "Non défini"}</strong>
              </div>
            </div>
          </article>

          <article className="details-card">
            <div className="task-detail-item">
              <Clock size={21} />
              <div>
                <span>Temps passé</span>
                <strong>
                  {formatDuration(
                    Math.floor(spentMinutes / 60),
                    spentMinutes % 60,
                  )}
                </strong>
              </div>
            </div>

            <div className="task-detail-item">
              <CalendarDays size={21} />
              <div>
                <span>Temps de maintenance planifié</span>
                <strong>
                  {formatDuration(
                    task.plannedMaintenanceHours,
                    task.plannedMaintenanceMinutes,
                  )}
                </strong>
              </div>
            </div>

            <div className="task-detail-item">
              <CalendarDays size={21} />
              <div>
                <span>Temps d'arrêt planifié</span>
                <strong>
                  {formatDuration(
                    task.plannedStoppedHours,
                    task.plannedStoppedMinutes,
                  )}
                </strong>
              </div>
            </div>

            <div className="task-detail-item">
              <CheckCircle2 size={21} />
              <div>
                <span>Coûts supplémentaires</span>
                <strong>
                  {money(
                    activities.reduce(
                      (total, activity) => total + activityTotal(activity),
                      0,
                    ),
                  )}
                </strong>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

export default TaskDetailsPage;
