import {
  CalendarDays,
  CheckCircle2,
  Download,
  ListChecks,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Tag as TagIcon,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getActivities,
} from "../../services/activityService";
import { getCostCenters } from "../../services/costCenterService";
import { getEquipment } from "../../services/equipmentService";
import { getTags } from "../../services/tagService";
import { getTasks } from "../../services/taskService";
import { getUsers } from "../../services/userService";
import type { Activity } from "../../types/activity";
import type { CostCenter } from "../../types/costCenter";
import type { Equipment } from "../../types/equipment";
import type { Tag } from "../../types/tag";
import type { TaskListItem } from "../../types/task";
import type { UserSummary } from "../../types/user";
import { exportTableCsv, exportTablePdf } from "../../utils/exportFiles";
import "./task-styles.css";

const BACKEND_URL = "http://localhost:8090";
const AVATAR_COLORS = [
  "#087fbd",
  "#6b46c1",
  "#198754",
  "#a3660f",
  "#b42318",
  "#0f766e",
];

type ActivityFilterDropdown =
  | "assignee"
  | "activityUser"
  | "label"
  | "equipment"
  | null;

function formatSpentTime(activity: Activity) {
  return `${activity.spentHours}h ${activity.spentMinutes}min`;
}

function getFileUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function initials(firstName: string | null, lastName: string | null): string {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  const emailFallback = !first && !last ? "U" : "";

  return `${first}${last}${emailFallback}`.toUpperCase();
}

function getUserName(user: UserSummary): string {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    `Utilisateur ${user.id}`
  );
}

function parseLocalDate(value: string): Date | null {
  const parts = value.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return null;
  }

  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function ActivitiesPage() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterActivityUser, setFilterActivityUser] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterEquipment, setFilterEquipment] = useState("");
  const [filterCostCenter, setFilterCostCenter] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [openDropdown, setOpenDropdown] =
    useState<ActivityFilterDropdown>(null);

  useEffect(() => {
    async function loadActivities() {
      try {
        setError("");

        const [
          activitiesData,
          taskData,
          usersData,
          tagsData,
          equipmentData,
          costCentersData,
        ] = await Promise.all([
          getActivities(),
          getTasks(),
          getUsers(),
          getTags(),
          getEquipment(),
          getCostCenters(),
        ]);

        setActivities(activitiesData);
        setTasks(taskData);
        setUsers(usersData);
        setTags(tagsData);
        setEquipment(equipmentData);
        setCostCenters(costCentersData);
      } catch {
        setError("Impossible de charger les activites.");
      }
    }

    void loadActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    const value = search.trim().toLowerCase();
    const tasksById = new Map(tasks.map((task) => [task.id, task]));

    return activities.filter((activity) => {
      const task = tasksById.get(activity.taskId);
      const matchesSearch =
        !value ||
        activity.description.toLowerCase().includes(value) ||
        activity.taskDescription.toLowerCase().includes(value) ||
        activity.equipmentName?.toLowerCase().includes(value);

      if (!matchesSearch) {
        return false;
      }

      if (
        filterAssignee &&
        ![...(task?.assignees ?? []), ...(task?.assignedTo ?? [])].some(
          (assignee) => String(assignee.userId ?? "") === filterAssignee,
        )
      ) {
        return false;
      }

      if (
        filterActivityUser &&
        !activity.intervenants.some(
          (user) => String(user.userId) === filterActivityUser,
        )
      ) {
        return false;
      }

      if (
        filterLabel &&
        !(task?.tags ?? []).some((tag) => String(tag.id) === filterLabel)
      ) {
        return false;
      }

      if (
        filterEquipment &&
        String(task?.equipment?.id ?? "") !== filterEquipment
      ) {
        return false;
      }

      if (
        filterCostCenter &&
        String(task?.costCenterId ?? "") !== filterCostCenter
      ) {
        return false;
      }

      const activityDate = parseLocalDate(activity.performedDate);
      const startDate = filterStartDate
        ? parseLocalDate(filterStartDate)
        : null;
      const endDate = filterEndDate ? parseLocalDate(filterEndDate) : null;

      if (startDate && (!activityDate || activityDate < startDate)) {
        return false;
      }

      if (endDate) {
        endDate.setHours(23, 59, 59, 999);

        if (!activityDate || activityDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, [
    activities,
    search,
    tasks,
    filterAssignee,
    filterActivityUser,
    filterLabel,
    filterEquipment,
    filterCostCenter,
    filterStartDate,
    filterEndDate,
  ]);

  const assigneeOptions = useMemo(() => {
    return users.map((user) => ({
      value: String(user.id),
      label: getUserName(user),
    }));
  }, [users]);

  const activityUserOptions = useMemo(() => {
    return users.map((user) => ({
      value: String(user.id),
      label: getUserName(user),
    }));
  }, [users]);

  const labelOptions = useMemo(() => {
    return tags;
  }, [tags]);

  const equipmentOptions = useMemo(() => {
    return equipment;
  }, [equipment]);

  const costCenterOptions = useMemo(() => {
    return costCenters.map((costCenter) => ({
      value: String(costCenter.id),
      label: costCenter.name,
    }));
  }, [costCenters]);

  function getExportOptions() {
    return {
      title: "Liste des activites",
      fileName: "activites",
      headers: [
        "Equipement",
        "Tache",
        "Activite",
        "Date",
        "Heure fin",
        "Temps passe",
      ],
      rows: filteredActivities.map((activity) => [
        activity.equipmentName || "-",
        activity.taskDescription,
        activity.description,
        activity.performedDate,
        activity.performedEndTime,
        formatSpentTime(activity),
      ]),
    };
  }

  function exportCsv() {
    exportTableCsv(getExportOptions());
  }

  function exportPdf() {
    exportTablePdf(getExportOptions());
  }

  function openTaskDetails(activity: Activity) {
    if (!Number.isFinite(activity.taskId)) {
      setError("Impossible d'ouvrir la tâche liée à cette activité.");
      return;
    }

    navigate(`/admin/tasks/${activity.taskId}?from=activities`);
  }

  return (
    <section className="suppliers-workspace">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <ListChecks size={28} />
            <h1>Activites</h1>
          </div>
        </div>

        <div className="resource-header-actions">
          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportPdf}
            disabled={filteredActivities.length === 0}
          >
            <Download size={16} />
            PDF
          </button>

          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportCsv}
            disabled={filteredActivities.length === 0}
          >
            <Download size={16} />
            CSV
          </button>

          <Link
            to="/admin/activities/create"
            className="supplier-primary-button"
          >
            <Plus size={18} />
            Ajouter une activite
          </Link>
        </div>
      </div>

      {error && (
        <div className="supplier-error-message">
          {error}
        </div>
      )}

      <div className="supplier-toolbar-row">
        <div className="supplier-search-bar">
          <Search size={19} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une activite..."
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
        <div className="task-filter-panel">
          <div className="task-filter-grid">
            <div className="task-filter-field">
              <label>
                <Users size={15} /> Assignés
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenDropdown((current) =>
                      current === "assignee" ? null : "assignee",
                    )
                  }
                >
                  {(() => {
                    const user = users.find(
                      (item) => item.id === Number(filterAssignee),
                    );

                    return user ? (
                      <>
                        <span
                          className="task-filter-avatar"
                          style={{ background: avatarColor(user.id) }}
                        >
                          {initials(user.firstName, user.lastName)}
                        </span>
                        {getUserName(user)}
                      </>
                    ) : (
                      <span>Tous</span>
                    );
                  })()}
                </button>

                {openDropdown === "assignee" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterAssignee ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterAssignee("");
                        setOpenDropdown(null);
                      }}
                    >
                      Tous
                      {!filterAssignee && <CheckCircle2 size={16} />}
                    </button>

                    {assigneeOptions.map((option) => {
                      const user = users.find(
                        (item) => item.id === Number(option.value),
                      );
                      const isSelected = filterAssignee === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterAssignee(option.value);
                            setOpenDropdown(null);
                          }}
                        >
                          {user && (
                            <span
                              className="task-filter-avatar"
                              style={{ background: avatarColor(user.id) }}
                            >
                              {initials(user.firstName, user.lastName)}
                            </span>
                          )}
                          {option.label}
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
                <CalendarDays size={15} /> Période
              </label>
              <div className="activity-period-range">
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(event) =>
                    setFilterStartDate(event.target.value)
                  }
                />
                <span aria-hidden="true">→</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(event) => setFilterEndDate(event.target.value)}
                />
              </div>
            </div>

            <div className="task-filter-field">
              <label>
                <Users size={15} /> Utilisateur de l'activité
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenDropdown((current) =>
                      current === "activityUser" ? null : "activityUser",
                    )
                  }
                >
                  {(() => {
                    const user = users.find(
                      (item) => item.id === Number(filterActivityUser),
                    );

                    return user ? (
                      <>
                        <span
                          className="task-filter-avatar"
                          style={{ background: avatarColor(user.id) }}
                        >
                          {initials(user.firstName, user.lastName)}
                        </span>
                        {getUserName(user)}
                      </>
                    ) : (
                      <span>Tous</span>
                    );
                  })()}
                </button>

                {openDropdown === "activityUser" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterActivityUser ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterActivityUser("");
                        setOpenDropdown(null);
                      }}
                    >
                      Tous
                      {!filterActivityUser && <CheckCircle2 size={16} />}
                    </button>

                    {activityUserOptions.map((option) => {
                      const user = users.find(
                        (item) => item.id === Number(option.value),
                      );
                      const isSelected = filterActivityUser === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterActivityUser(option.value);
                            setOpenDropdown(null);
                          }}
                        >
                          {user && (
                            <span
                              className="task-filter-avatar"
                              style={{ background: avatarColor(user.id) }}
                            >
                              {initials(user.firstName, user.lastName)}
                            </span>
                          )}
                          {option.label}
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
                <TagIcon size={15} /> Labels
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenDropdown((current) =>
                      current === "label" ? null : "label",
                    )
                  }
                >
                  {(() => {
                    const tag = labelOptions.find(
                      (item) => item.id === Number(filterLabel),
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
                        {tag.name}
                      </span>
                    ) : (
                      <span>Tous</span>
                    );
                  })()}
                </button>

                {openDropdown === "label" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterLabel ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterLabel("");
                        setOpenDropdown(null);
                      }}
                    >
                      Tous
                      {!filterLabel && <CheckCircle2 size={16} />}
                    </button>

                    {labelOptions.map((tag) => {
                      const isSelected = filterLabel === String(tag.id);

                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterLabel(String(tag.id));
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
                            {tag.name}
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
                <Wrench size={15} /> Équipements
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
                    const item = equipmentOptions.find(
                      (equipmentItem) =>
                        equipmentItem.id === Number(filterEquipment),
                    );

                    if (!item) {
                      return <span>Tous</span>;
                    }

                    const image = getFileUrl(item.image);

                    return (
                      <>
                        <span className="task-filter-equip-thumb">
                          {image ? (
                            <img src={image} alt={item.name} />
                          ) : (
                            <Wrench size={13} />
                          )}
                        </span>
                        {item.name}
                      </>
                    );
                  })()}
                </button>

                {openDropdown === "equipment" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterEquipment ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterEquipment("");
                        setOpenDropdown(null);
                      }}
                    >
                      Tous
                      {!filterEquipment && <CheckCircle2 size={16} />}
                    </button>

                    {equipmentOptions.map((item) => {
                      const isSelected = filterEquipment === String(item.id);
                      const image = getFileUrl(item.image);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterEquipment(String(item.id));
                            setOpenDropdown(null);
                          }}
                        >
                          <span className="task-filter-equip-thumb">
                            {image ? (
                              <img src={image} alt={item.name} />
                            ) : (
                              <Wrench size={13} />
                            )}
                          </span>
                          {item.name}
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
                <MapPin size={15} /> Centre de coûts
              </label>
              <select
                value={filterCostCenter}
                onChange={(event) => setFilterCostCenter(event.target.value)}
              >
                <option value="">Tous</option>
                {costCenterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="task-filter-actions">
            <button
              type="button"
              className="task-filter-apply"
              onClick={() => setShowFilters(false)}
            >
              Appliquer les filtres
            </button>

            <button
              type="button"
              className="task-filter-reset"
              onClick={() => {
                setFilterAssignee("");
                setFilterActivityUser("");
                setFilterLabel("");
                setFilterEquipment("");
                setFilterCostCenter("");
                setFilterStartDate("");
                setFilterEndDate("");
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      <div className="supplier-table-wrapper">
        <table className="supplier-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Equipement</th>
              <th>Tache</th>
              <th>Activite</th>
              <th>Date</th>
              <th>Heure fin</th>
              <th>Temps passe</th>
            </tr>
          </thead>

          <tbody>
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={7} className="supplier-empty-row">
                  Aucun resultat
                </td>
              </tr>
            ) : (
              filteredActivities.map((activity) => (
                <tr
                  key={activity.id}
                  className="supplier-clickable-row"
                  tabIndex={0}
                  onClick={() => openTaskDetails(activity)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      openTaskDetails(activity);
                    }
                  }}
                >
                  <td className="resource-table-id-cell">#{activity.id}</td>
                  <td>{activity.equipmentName || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="activity-task-link"
                      onClick={(event) => {
                        event.stopPropagation();
                        openTaskDetails(activity);
                      }}
                    >
                      {activity.taskDescription}
                    </button>
                  </td>
                  <td>{activity.description}</td>
                  <td>{activity.performedDate}</td>
                  <td>{activity.performedEndTime}</td>
                  <td>{formatSpentTime(activity)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ActivitiesPage;