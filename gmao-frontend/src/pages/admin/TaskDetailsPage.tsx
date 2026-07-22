import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Gauge,
  Link2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Tag,
  Upload,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import SparePartSelect from "../../components/admin/SparePartSelect";

import { getActivitiesByTask } from "../../services/activityService";
import { getSpareParts } from "../../services/sparePartService";
import { getTaskById, updateTask, fetchTagOptions, type TagOption } from "../../services/taskService";
import { getTeams } from "../../services/teamService";
import { getUsersDetailed } from "../../services/userService";
import type { Activity } from "../../types/activity";
import type { SparePart } from "../../types/sparePart";
import type { Task, TaskStatus, UpdateTaskInput } from "../../types/task";
import type { Team } from "../../types/team";
import type { UserDetail } from "../../types/user";

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

function initials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim().charAt(0) || "";
  const last = lastName?.trim().charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "AD";
}

function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const second = parts.length > 1 ? parts[1].charAt(0) : parts[0]?.charAt(1) ?? "";
  return `${first}${second}`.toUpperCase();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userOptions, setUserOptions] = useState<UserDetail[]>([]);
  const [teamOptions, setTeamOptions] = useState<Team[]>([]);
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);

  const [editingField, setEditingField] = useState<
    "date" | "reportedBy" | "assignedTo" | "labels" | "description" | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [showReportedByDropdown, setShowReportedByDropdown] = useState(false);
  const [showAssignedToDropdown, setShowAssignedToDropdown] = useState(false);

  const [sparePartOptions, setSparePartOptions] = useState<SparePart[]>([]);
  const [showAddSparePart, setShowAddSparePart] = useState(false);
  const [newSparePartId, setNewSparePartId] = useState<number | "">("");
  const [newSparePartQuantity, setNewSparePartQuantity] = useState(1);

  const [showAddDocument, setShowAddDocument] = useState(false);
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);

  const [editStartDate, setEditStartDate] = useState("");
  const [editStartHour, setEditStartHour] = useState("");
  const [editReportedBy, setEditReportedBy] = useState<
    { userId?: number; teamId?: number; label: string }[]
  >([]);
  const [editAssignedTo, setEditAssignedTo] = useState<
    { userId?: number; teamId?: number; label: string }[]
  >([]);
  const [editTagIds, setEditTagIds] = useState<number[]>([]);
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    async function loadTaskDetails() {
      if (!Number.isFinite(taskId)) {
        setError("Tâche introuvable.");
        setLoading(false);
        return;
      }

      try {
        const [taskData, activityData, users, teams, tags, spareParts] =
          await Promise.all([
            getTaskById(taskId),
            getActivitiesByTask(taskId),
            getUsersDetailed().catch(() => [] as UserDetail[]),
            getTeams().catch(() => [] as Team[]),
            fetchTagOptions().catch(() => [] as TagOption[]),
            getSpareParts().catch(() => [] as SparePart[]),
          ]);

        setTask(taskData);
        setActivities(activityData);
        setUserOptions(users);
        setTeamOptions(teams);
        setTagOptions(tags);
        setSparePartOptions(spareParts);
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger les détails de la tâche.");
      } finally {
        setLoading(false);
      }
    }

    void loadTaskDetails();
  }, [taskId]);

  function startEditing(field: typeof editingField) {
    if (!task) {
      return;
    }

    setShowReportedByDropdown(false);
    setShowAssignedToDropdown(false);

    setEditStartDate(task.startDate);
    setEditStartHour(task.startHour ?? "");
    setEditReportedBy(
      task.assignees.map((a) => ({
        userId: a.userId ?? undefined,
        teamId: a.teamId ?? undefined,
        label: a.type === "USER" ? a.userFullName ?? "" : a.teamName ?? "",
      })),
    );
    setEditAssignedTo(
      task.assignedTo.map((a) => ({
        userId: a.userId ?? undefined,
        teamId: a.teamId ?? undefined,
        label: a.type === "USER" ? a.userFullName ?? "" : a.teamName ?? "",
      })),
    );
    setEditTagIds(task.tags.map((t) => t.id));
    setEditDescription(task.description);
    setEditingField(field);
  }

  function toggleEditing(field: NonNullable<typeof editingField>) {
    if (editingField === field) {
      setEditingField(null);
    } else {
      startEditing(field);
    }
  }

  async function addSparePartLine() {
    if (!task || !newSparePartId) {
      return;
    }

    const nextSpareParts = [
      ...task.spareParts.map((sp) => ({
        sparePartId: sp.sparePartId,
        quantity: sp.quantity,
      })),
      { sparePartId: newSparePartId, quantity: newSparePartQuantity },
    ];

    await savePatch({ spareParts: nextSpareParts }, false);
    setNewSparePartId("");
    setNewSparePartQuantity(1);
    setShowAddSparePart(false);
  }

  async function addDocumentEntry() {
    if (!task || !newDocumentFile) {
      return;
    }

    await savePatch({}, false, [newDocumentFile]);
    setNewDocumentFile(null);

    setShowAddDocument(false);
  }

  async function savePatch(
    patch: Partial<UpdateTaskInput>,
    closeAfter = true,
    files: File[] = [],
  ) {
    if (!task) {
      return;
    }

    setSaving(true);

    const payload: UpdateTaskInput = {
      equipmentOnly: task.equipmentOnly,
      equipmentId: task.equipment?.id ?? 0,
      description: task.description,
      allDay: task.allDay,
      startDate: task.startDate,
      startHour: task.startHour,
      endDate: task.endDate,
      endHour: task.endHour,
      plannedMaintenanceHours: task.plannedMaintenanceHours,
      plannedMaintenanceMinutes: task.plannedMaintenanceMinutes,
      plannedStoppedHours: task.plannedStoppedHours,
      plannedStoppedMinutes: task.plannedStoppedMinutes,
      assignees: task.assignees.map((a) => ({
        userId: a.userId ?? undefined,
        teamId: a.teamId ?? undefined,
      })),
      assignedTo: task.assignedTo.map((a) => ({
        userId: a.userId ?? undefined,
        teamId: a.teamId ?? undefined,
      })),
      tagIds: task.tags.map((t) => t.id),
      spareParts: task.spareParts.map((sp) => ({
        sparePartId: sp.sparePartId,
        quantity: sp.quantity,
      })),
      links: [],
      notifyAssignees: false,
      status:
        task.status === "LATE" || task.status === "PLANNED"
          ? "IN_PROGRESS"
          : task.status,
      removeDocumentIds: [],
      ...patch,
    };

    try {
      const updated = await updateTask(task.id, payload, files);
      setTask(updated);
      if (closeAfter) {
        setEditingField(null);
      }
    } catch (requestError) {
      console.error(requestError);
      const message =
        requestError instanceof Error
          ? requestError.message
          : "La mise à jour a échoué. Réessayez.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

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

      {error && <div className="resource-error-message">{error}</div>}

      <div className="task-details-grid">
        <div className="task-details-main">
          <article className="details-card task-info-card">
            <div className="task-detail-item">
              <CalendarDays size={21} />
              <div>
                <span>
                  Date planifiée
                  <button
                    type="button"
                    className={`task-detail-edit-btn-inline ${
                      editingField === "date" ? "active" : ""
                    }`}
                    onClick={() => toggleEditing("date")}
                    disabled={saving}
                    aria-label="Modifier la date"
                  >
                    {editingField === "date" ? (
                      <X size={13} />
                    ) : (
                      <Pencil size={13} />
                    )}
                  </button>
                </span>
                {editingField === "date" ? (
                  <div className="task-inline-edit">
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      onBlur={() =>
                        void savePatch(
                          {
                            startDate: editStartDate,
                            startHour: editStartHour || null,
                          },
                          false,
                        )
                      }
                    />
                    <input
                      type="time"
                      value={editStartHour}
                      onChange={(e) => setEditStartHour(e.target.value)}
                      onBlur={() =>
                        void savePatch(
                          {
                            startDate: editStartDate,
                            startHour: editStartHour || null,
                          },
                          false,
                        )
                      }
                    />
                  </div>
                ) : (
                  <strong>
                    {formatDate(task.startDate)}
                    {task.startHour ? ` à ${formatTime(task.startHour)}` : ""}
                  </strong>
                )}
              </div>
            </div>

            <div className="task-detail-item">
              <Users size={21} />
              <div>
                <span>
                  Signalé par
                  <button
                    type="button"
                    className={`task-detail-edit-btn-inline ${
                      editingField === "reportedBy" ? "active" : ""
                    }`}
                    onClick={() => toggleEditing("reportedBy")}
                    disabled={saving}
                    aria-label="Modifier signalé par"
                  >
                    {editingField === "reportedBy" ? (
                      <X size={13} />
                    ) : (
                      <Pencil size={13} />
                    )}
                  </button>
                </span>
                {editingField === "reportedBy" ? (
                  <div className="task-inline-edit task-inline-edit-column">
                    <div className="task-chip-list">
                      {editReportedBy.map((item) => (
                        <span
                          className="task-chip"
                          key={item.userId ?? item.teamId}
                        >
                          {item.label}
                          <button
                            type="button"
                            onClick={() => {
                              const next = editReportedBy.filter(
                                (i) => i !== item,
                              );
                              setEditReportedBy(next);
                              void savePatch(
                                {
                                  assignees: next.map((i) => ({
                                    userId: i.userId,
                                    teamId: i.teamId,
                                  })),
                                },
                                false,
                              );
                            }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="task-filter-dropdown">
                      <button
                        type="button"
                        className="task-filter-dropdown-trigger"
                        onClick={() =>
                          setShowReportedByDropdown((current) => !current)
                        }
                      >
                        + Ajouter un utilisateur
                      </button>

                      {showReportedByDropdown && (
                        <div className="task-filter-dropdown-panel">
                          {userOptions
                            .filter(
                              (user) =>
                                !editReportedBy.some(
                                  (i) => i.userId === user.id,
                                ),
                            )
                            .map((user) => (
                              <button
                                type="button"
                                key={user.id}
                                className="task-filter-dropdown-row"
                                onClick={() => {
                                  const next = [
                                    ...editReportedBy,
                                    {
                                      userId: user.id,
                                      label: `${user.firstName} ${user.lastName}`,
                                    },
                                  ];
                                  setEditReportedBy(next);
                                  setShowReportedByDropdown(false);
                                  void savePatch(
                                    {
                                      assignees: next.map((i) => ({
                                        userId: i.userId,
                                        teamId: i.teamId,
                                      })),
                                    },
                                    false,
                                  );
                                }}
                              >
                                <span
                                  className="task-filter-avatar"
                                  style={{ background: avatarColor(user.id) }}
                                >
                                  {initials(user.firstName, user.lastName)}
                                </span>
                                {user.firstName} {user.lastName}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : task.assignees.length > 0 ? (
                  <div className="task-avatar-list">
                    {task.assignees.map((assignee) => (
                      <span
                        key={`${assignee.type}-${
                          assignee.userId || assignee.teamId
                        }`}
                      >
                        <span
                          className="task-detail-avatar"
                          style={{
                            background: avatarColor(
                              assignee.userId ?? assignee.teamId ?? 0,
                            ),
                          }}
                        >
                          {assignee.type === "USER"
                            ? initials(
                                assignee.userFullName?.split(" ")[0],
                                assignee.userFullName?.split(" ")[1],
                              )
                            : teamInitials(assignee.teamName ?? "")}
                        </span>
                        {assignee.type === "USER"
                          ? assignee.userFullName
                          : assignee.teamName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <strong>Personne renseignée pour l'instant.</strong>
                )}
              </div>
            </div>

            <div className="task-detail-item">
              <Users size={21} />
              <div>
                <span>
                  Assigné à
                  <button
                    type="button"
                    className={`task-detail-edit-btn-inline ${
                      editingField === "assignedTo" ? "active" : ""
                    }`}
                    onClick={() => toggleEditing("assignedTo")}
                    disabled={saving}
                    aria-label="Modifier assigné à"
                  >
                    {editingField === "assignedTo" ? (
                      <X size={13} />
                    ) : (
                      <Pencil size={13} />
                    )}
                  </button>
                </span>
                {editingField === "assignedTo" ? (
                  <div className="task-inline-edit task-inline-edit-column">
                    <div className="task-chip-list">
                      {editAssignedTo.map((item) => (
                        <span
                          className="task-chip"
                          key={item.userId ?? `team-${item.teamId}`}
                        >
                          {item.label}
                          <button
                            type="button"
                            onClick={() => {
                              const next = editAssignedTo.filter(
                                (i) => i !== item,
                              );
                              setEditAssignedTo(next);
                              void savePatch(
                                {
                                  assignedTo: next.map((i) => ({
                                    userId: i.userId,
                                    teamId: i.teamId,
                                  })),
                                },
                                false,
                              );
                            }}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="task-filter-dropdown">
                      <button
                        type="button"
                        className="task-filter-dropdown-trigger"
                        onClick={() =>
                          setShowAssignedToDropdown((current) => !current)
                        }
                      >
                        + Ajouter un collègue ou une équipe
                      </button>

                      {showAssignedToDropdown && (
                        <div className="task-filter-dropdown-panel">
                          {teamOptions.filter(
                            (team) =>
                              !editAssignedTo.some((i) => i.teamId === team.id),
                          ).length > 0 && (
                            <p className="task-filter-dropdown-heading">
                              Équipes
                            </p>
                          )}

                          {teamOptions
                            .filter(
                              (team) =>
                                !editAssignedTo.some(
                                  (i) => i.teamId === team.id,
                                ),
                            )
                            .map((team) => (
                              <button
                                type="button"
                                key={`team-${team.id}`}
                                className="task-filter-dropdown-row"
                                onClick={() => {
                                  const next = [
                                    ...editAssignedTo,
                                    { teamId: team.id, label: team.name },
                                  ];
                                  setEditAssignedTo(next);
                                  setShowAssignedToDropdown(false);
                                  void savePatch(
                                    {
                                      assignedTo: next.map((i) => ({
                                        userId: i.userId,
                                        teamId: i.teamId,
                                      })),
                                    },
                                    false,
                                  );
                                }}
                              >
                                <span
                                  className="task-filter-team-avatar"
                                  style={{ background: avatarColor(team.id) }}
                                >
                                  {teamInitials(team.name)}
                                </span>
                                {team.name}
                              </button>
                            ))}

                          {userOptions.filter(
                            (user) =>
                              !editAssignedTo.some((i) => i.userId === user.id),
                          ).length > 0 && (
                            <p className="task-filter-dropdown-heading">
                              Collègues
                            </p>
                          )}

                          {userOptions
                            .filter(
                              (user) =>
                                !editAssignedTo.some(
                                  (i) => i.userId === user.id,
                                ),
                            )
                            .map((user) => (
                              <button
                                type="button"
                                key={user.id}
                                className="task-filter-dropdown-row"
                                onClick={() => {
                                  const next = [
                                    ...editAssignedTo,
                                    {
                                      userId: user.id,
                                      label: `${user.firstName} ${user.lastName}`,
                                    },
                                  ];
                                  setEditAssignedTo(next);
                                  setShowAssignedToDropdown(false);
                                  void savePatch(
                                    {
                                      assignedTo: next.map((i) => ({
                                        userId: i.userId,
                                        teamId: i.teamId,
                                      })),
                                    },
                                    false,
                                  );
                                }}
                              >
                                <span
                                  className="task-filter-avatar"
                                  style={{ background: avatarColor(user.id) }}
                                >
                                  {initials(user.firstName, user.lastName)}
                                </span>
                                {user.firstName} {user.lastName}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : task.assignedTo.length > 0 ? (
                  <div className="task-avatar-list">
                    {task.assignedTo.map((assignee) => (
                      <span
                        key={`${assignee.type}-${
                          assignee.userId || assignee.teamId
                        }`}
                      >
                        <span
                          className="task-detail-avatar"
                          style={{
                            background: avatarColor(
                              assignee.userId ?? assignee.teamId ?? 0,
                            ),
                          }}
                        >
                          {assignee.type === "USER"
                            ? initials(
                                assignee.userFullName?.split(" ")[0],
                                assignee.userFullName?.split(" ")[1],
                              )
                            : teamInitials(assignee.teamName ?? "")}
                        </span>
                        {assignee.type === "USER"
                          ? assignee.userFullName
                          : assignee.teamName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <strong>Personne assignée pour l'instant.</strong>
                )}
              </div>
            </div>

            <div className="task-detail-item">
              <Tag size={21} />
              <div>
                <span>
                  Labels
                  <button
                    type="button"
                    className={`task-detail-edit-btn-inline ${
                      editingField === "labels" ? "active" : ""
                    }`}
                    onClick={() => toggleEditing("labels")}
                    disabled={saving}
                    aria-label="Modifier les labels"
                  >
                    {editingField === "labels" ? (
                      <X size={13} />
                    ) : (
                      <Pencil size={13} />
                    )}
                  </button>
                </span>
                {editingField === "labels" ? (
                  <div className="task-inline-edit task-inline-edit-column">
                    <div className="task-chip-list">
                      {tagOptions.map((tag) => (
                        <button
                          type="button"
                          key={tag.id}
                          className={`team-tag-toggle ${
                            editTagIds.includes(tag.id) ? "active" : ""
                          }`}
                          style={{
                            borderColor: tag.color,
                            color: editTagIds.includes(tag.id)
                              ? "#ffffff"
                              : tag.color,
                            background: editTagIds.includes(tag.id)
                              ? tag.color
                              : "transparent",
                          }}
                          onClick={() => {
                            const next = editTagIds.includes(tag.id)
                              ? editTagIds.filter((id) => id !== tag.id)
                              : [...editTagIds, tag.id];
                            setEditTagIds(next);
                            void savePatch({ tagIds: next }, false);
                          }}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : task.tags.length > 0 ? (
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
                <span>
                  Description
                  <button
                    type="button"
                    className={`task-detail-edit-btn-inline ${
                      editingField === "description" ? "active" : ""
                    }`}
                    onClick={() => toggleEditing("description")}
                    disabled={saving}
                    aria-label="Modifier la description"
                  >
                    {editingField === "description" ? (
                      <X size={13} />
                    ) : (
                      <Pencil size={13} />
                    )}
                  </button>
                </span>
                {editingField === "description" ? (
                  <div className="task-inline-edit task-inline-edit-column">
                    <textarea
                      rows={4}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      onBlur={() =>
                        void savePatch(
                          { description: editDescription },
                          false,
                        )
                      }
                    />
                  </div>
                ) : (
                  <strong>{task.description || "Aucune description renseignée."}</strong>
                )}
              </div>
            </div>
          </article>

          <article className="details-card">
            <div className="details-section-header">
              <h2>Ressources</h2>
            </div>

            <div className="details-subsection">
              <div className="details-subsection-header">
                <h3>Pièces détachées à prévoir</h3>
                <button
                  type="button"
                  className="details-add-btn"
                  onClick={() => setShowAddSparePart((current) => !current)}
                  aria-label="Ajouter une pièce détachée"
                >
                  <Plus size={20} />
                </button>
              </div>

              {showAddSparePart && (
                <div className="task-inline-edit task-inline-edit-column details-add-form">
                  <SparePartSelect
                    spareParts={sparePartOptions}
                    excludedIds={task.spareParts.map((sp) => sp.sparePartId)}
                    onSelect={(part) => setNewSparePartId(part.id)}
                    placeholder="Sélectionner une pièce détachée"
                  />

                  {newSparePartId && (
                    <p className="details-add-selected">
                      Sélectionnée :{" "}
                      <strong>
                        {
                          sparePartOptions.find(
                            (p) => p.id === newSparePartId,
                          )?.name
                        }
                      </strong>
                    </p>
                  )}

                  <button
                    type="button"
                    className="task-inline-done"
                    disabled={saving || !newSparePartId}
                    onClick={() => void addSparePartLine()}
                    >
                      <Plus size={14} /> Ajouter
                    </button>
                </div>
              )}

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
            </div>

            <div className="details-subsection">
              <div className="details-subsection-header">
                <h3>Documents</h3>
                <button
                  type="button"
                  className="details-add-btn"
                  onClick={() => setShowAddDocument((current) => !current)}
                  aria-label="Ajouter un document"
                >
                  <Plus size={20} />
                </button>
              </div>

              {showAddDocument && (
                <div className="task-inline-edit task-inline-edit-column details-add-form">
                  <label className="task-dropzone details-dropzone">
                    <Upload size={20} />
                    <span>
                      {newDocumentFile
                        ? newDocumentFile.name
                        : "Cliquez pour choisir un fichier"}
                    </span>
                    <input
                      type="file"
                      onChange={(e) =>
                        setNewDocumentFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="task-inline-done"
                    disabled={saving || !newDocumentFile}
                    onClick={() => void addDocumentEntry()}
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                </div>
              )}

              {task.documents.length === 0 ? (
                <p className="task-empty-hint">Aucun document joint.</p>
              ) : (
                <div className="task-linked-list">
                  {task.documents.map((document) => (
                    <a
                      key={document.id}
                      className="task-linked-row"
                      href={getFileUrl(document.filePath) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="task-equipment-thumb">
                        {document.isLink ? (
                          <Link2 size={17} />
                        ) : (
                          <FileText size={17} />
                        )}
                      </span>
                      <div>
                        <strong>{document.fileName}</strong>
                        <span>
                          {document.isLink ? "Lien externe" : "Fichier joint"}
                        </span>
                      </div>
                      {!document.isLink && <Download size={17} />}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </article>

          <article className="details-card task-activity-card">
            <div className="details-section-header">
              <h2>Activités</h2>
              <button
                type="button"
                className="success-button"
                onClick={() => navigate(`/admin/activities/create?taskId=${task.id}`)}
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
                  const mainIntervenant = activity.intervenants?.[0];
                  const total = activityTotal(activity);

                  return (
                    <article
                      key={activity.id}
                      className="activity-history-card"
                    >
                      <div className="activity-history-header">
                        <span
                          className="activity-avatar"
                          style={{
                            background: avatarColor(mainIntervenant?.userId ?? 0),
                          }}
                        >
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
                      </div>

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

                          {activity.measureReadings?.length > 0 && (
                            <div className="activity-linked-lines">
                              {activity.measureReadings.map((reading) => (
                                <span key={reading.id}>
                                  <Gauge size={15} />
                                  <em>Compteur :</em> {reading.measureName} ·{" "}
                                  {reading.value} {reading.unitSymbol} ·{" "}
                                  {formatShortDate(reading.readingDate)}{" "}
                                  {formatTime(reading.readingHour)}
                                </span>
                              ))}
                            </div>
                          )}

                          {activity.spareParts?.length > 0 && (
                            <div className="activity-linked-lines">
                              {activity.spareParts.map((item) => (
                                <span key={item.sparePartId}>
                                  <Package size={15} />
                                  <em>Pièce détachée :</em> {item.name} ·{" "}
                                  {item.quantity} ·{" "}
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
                                  <em>Coût additionnel :</em> {item.label} ·{" "}
                                  {money(item.amount, item.currency)}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="activity-total">
                            TOTAL <strong>{money(total)}</strong>
                          </div>
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

            <div className="task-detail-item">
              <MapPin size={21} />
              <div>
                <span>Centre de coût</span>
                <strong>{task.costCenterName || "Non défini"}</strong>
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