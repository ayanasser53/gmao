import { useEffect, useState } from "react";

import {
  Activity as ActivityIcon,
  BadgeCheck,
  Boxes,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  History,
  Package,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import SparePartSelect from "../../components/admin/SparePartSelect";

import {
  checkExternalStockForAll,
  getSpareParts,
  getStockMovementHistory,
  reconcileStock,
  type ExternalStockCheck,
  type StockMovementHistory,
} from "../../services/sparePartService";
import { getUsersDetailed } from "../../services/userService";
import { getTasks } from "../../services/taskService";
import { getActivities } from "../../services/activityService";
import { getMaintenancePlans } from "../../services/maintenancePlanService";
import { exportTableCsv, exportTablePdf } from "../../utils/exportFiles";

import type { SparePart } from "../../types/sparePart";
import type { UserDetail } from "../../types/user";
import type { TaskListItem } from "../../types/task";
import type { Activity } from "../../types/activity";
import type { MaintenancePlan } from "../../types/maintenancePlan";

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

function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function initials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.trim().charAt(0) || "";
  const last = lastName?.trim().charAt(0) || "";
  return `${first}${last}`.toUpperCase() || "?";
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

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR");
}

function MovementHistoryPage() {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [movements, setMovements] = useState<StockMovementHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSparePartId, setFilterSparePartId] = useState<number | "">("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterTaskId, setFilterTaskId] = useState<number | "">("");
  const [filterActivityId, setFilterActivityId] = useState<number | "">("");
  const [filterPlanId, setFilterPlanId] = useState<number | "">("");
  const [filterUserId, setFilterUserId] = useState<number | "">("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);

  const [stockChecks, setStockChecks] = useState<ExternalStockCheck[] | null>(
    null,
  );
  const [checkingAll, setCheckingAll] = useState(false);
  const [reconcilingId, setReconcilingId] = useState<number | null>(null);
  const [reconcilingAll, setReconcilingAll] = useState(false);

  useEffect(() => {
    getSpareParts()
      .then(setSpareParts)
      .catch(() => setSpareParts([]));
    getUsersDetailed()
      .then(setUsers)
      .catch(() => setUsers([]));
    getTasks()
      .then(setTasks)
      .catch(() => setTasks([]));
    getActivities()
      .then(setActivities)
      .catch(() => setActivities([]));
    getMaintenancePlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    void loadMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMovements() {
    try {
      setLoading(true);
      setError("");

      const selectedUser = users.find((user) => user.id === filterUserId);

      const data = await getStockMovementHistory({
        sparePartId: filterSparePartId ? Number(filterSparePartId) : undefined,
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
        taskId: filterTaskId ? Number(filterTaskId) : undefined,
        activityId: filterActivityId ? Number(filterActivityId) : undefined,
        maintenancePlanId: filterPlanId ? Number(filterPlanId) : undefined,
        userName: selectedUser
          ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim()
          : undefined,
      });

      setMovements(data);
    } catch {
      setError("Impossible de charger l'historique des mouvements.");
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setFilterSparePartId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterTaskId("");
    setFilterActivityId("");
    setFilterPlanId("");
    setFilterUserId("");
  }

  async function handleCheckAllStock() {
    try {
      setCheckingAll(true);
      setError("");
      const results = await checkExternalStockForAll();
      setStockChecks(results);
    } catch {
      setError("Impossible de contacter l'API externe.");
    } finally {
      setCheckingAll(false);
    }
  }

  async function handleReconcileOne(check: ExternalStockCheck) {
    try {
      setReconcilingId(check.sparePartId);
      await reconcileStock(check.sparePartId, check.externalQuantity);
      setStockChecks(
        (current) =>
          current?.filter(
            (item) => item.sparePartId !== check.sparePartId,
          ) ?? null,
      );
      void loadMovements();
    } catch {
      setError("Impossible de synchroniser cette pièce détachée.");
    } finally {
      setReconcilingId(null);
    }
  }

  async function handleReconcileAll() {
    if (!stockChecks) return;

    const mismatched = stockChecks.filter((check) => !check.inSync);

    try {
      setReconcilingAll(true);
      setError("");

      for (const check of mismatched) {
        await reconcileStock(check.sparePartId, check.externalQuantity);
      }

      setStockChecks(null);
      void loadMovements();
    } catch {
      setError("Impossible de synchroniser tout le stock.");
    } finally {
      setReconcilingAll(false);
    }
  }

  const selectedSparePart = spareParts.find(
    (part) => part.id === filterSparePartId,
  );
  const selectedUser = users.find((user) => user.id === filterUserId);
  const selectedTask = tasks.find((task) => task.id === filterTaskId);
  const selectedActivity = activities.find(
    (activity) => activity.id === filterActivityId,
  );
  const selectedPlan = plans.find((plan) => plan.id === filterPlanId);

  const activeFilterCount = [
    filterSparePartId,
    filterStartDate,
    filterEndDate,
    filterTaskId,
    filterActivityId,
    filterPlanId,
    filterUserId,
  ].filter((value) => value !== "" && value !== undefined).length;

  const filteredMovements = (() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return movements;
    }

    return movements.filter((movement) =>
      [
        movement.sparePartName,
        movement.source,
        movement.taskDescription,
        movement.activityDescription,
        movement.maintenancePlanDescription,
        movement.userName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
      );
  })();

  function getMovementPlanLabel(movement: StockMovementHistory): string {
    if (!movement.maintenancePlanId) {
      return "-";
    }

    const description = movement.maintenancePlanDescription?.trim();
    return description
      ? `#${movement.maintenancePlanId} - ${description}`
      : `#${movement.maintenancePlanId}`;
  }

  function getMovementDescription(movement: StockMovementHistory): string {
    return (
      movement.activityDescription ||
      movement.taskDescription ||
      movement.maintenancePlanDescription ||
      "-"
    );
  }

  function getExportOptions() {
    return {
      title: "Historique des mouvements",
      fileName: "historique-mouvements",
      headers: [
        "Piece detachee",
        "Source",
        "ID tache",
        "ID activite",
        "Plan de maintenance",
        "Description",
        "Utilisateur",
        "Quantite",
        "Date",
      ],
      rows: filteredMovements.map((movement) => [
        movement.sparePartName || "-",
        movement.source || "-",
        movement.taskId ? `#${movement.taskId}` : "-",
        movement.activityId ? `#${movement.activityId}` : "-",
        getMovementPlanLabel(movement),
        getMovementDescription(movement),
        movement.userName || "-",
        movement.quantity ?? "-",
        formatDateTime(movement.movementDate),
      ]),
    };
  }

  function exportCsv() {
    exportTableCsv(getExportOptions());
  }

  function exportPdf() {
    exportTablePdf(getExportOptions());
  }

  return (
    <section className="admin-page">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <History size={26} />
            <h1>Historique des mouvements</h1>
          </div>
        </div>

        <div className="resource-header-actions">
          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportPdf}
            disabled={filteredMovements.length === 0}
          >
            <Download size={16} />
            PDF
          </button>

          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportCsv}
            disabled={filteredMovements.length === 0}
          >
            <Download size={16} />
            CSV
          </button>

          <button
            type="button"
            className="external-stock-check-btn movement-check-all-btn"
            onClick={() => void handleCheckAllStock()}
            disabled={checkingAll}
          >
            <RefreshCw size={15} />
            {checkingAll
              ? "Vérification en cours..."
              : "Vérifier le stock réel (toutes les pièces)"}
          </button>
        </div>
      </div>

      <div className="resource-toolbar">
        <div className="resource-search">
          <Search size={17} />
          <input
            type="text"
            placeholder="Rechercher un mouvement..."
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
          Filtrer
          {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
        </button>
      </div>

      {error && <div className="resource-error-message">{error}</div>}

      {stockChecks && (
        <div className="task-filter-panel movement-stock-check-panel">
          <div className="movement-stock-check-header">
            <h2>Résultat de la vérification</h2>

            {stockChecks.some((check) => !check.inSync) && (
              <button
                type="button"
                className="external-stock-reconcile-btn"
                onClick={() => void handleReconcileAll()}
                disabled={reconcilingAll}
              >
                {reconcilingAll
                  ? "Synchronisation..."
                  : "Tout synchroniser"}
              </button>
            )}
          </div>

          <table className="supplier-table">
            <thead>
              <tr>
                <th>Pièce détachée</th>
                <th>Stock application</th>
                <th>Stock externe</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {stockChecks.map((check) => (
                <tr key={check.sparePartId}>
                  <td>{check.sparePartName}</td>
                  <td>{check.appQuantity}</td>
                  <td>{check.externalQuantity}</td>
                  <td>
                    {check.inSync ? (
                      <span className="external-stock-in-sync">
                        <BadgeCheck size={15} /> Synchronisé
                      </span>
                    ) : (
                      <span className="movement-mismatch-badge">
                        Écart détecté
                      </span>
                    )}
                  </td>
                  <td>
                    {!check.inSync && (
                      <button
                        type="button"
                        className="external-stock-reconcile-btn"
                        onClick={() => void handleReconcileOne(check)}
                        disabled={reconcilingId === check.sparePartId}
                      >
                        {reconcilingId === check.sparePartId
                          ? "..."
                          : "Synchroniser"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFilters && (
        <div className="task-filter-panel">
        <div className="task-filter-grid">
          <div className="task-filter-field">
            <label>
              <Package size={15} /> Pièce détachée
            </label>
            <SparePartSelect
              spareParts={spareParts}
              excludedIds={[]}
              onSelect={(part) => setFilterSparePartId(part.id)}
              placeholder="Toutes les pièces détachées"
            />

            {selectedSparePart && (
              <div className="movement-selected-chip">
                <span className="task-filter-equip-thumb">
                  {getFileUrl(selectedSparePart.image) ? (
                    <img
                      src={getFileUrl(selectedSparePart.image) ?? ""}
                      alt={selectedSparePart.name}
                    />
                  ) : (
                    <Boxes size={13} />
                  )}
                </span>
                {selectedSparePart.name}
                <button
                  type="button"
                  onClick={() => setFilterSparePartId("")}
                  aria-label="Retirer le filtre pièce détachée"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="task-filter-field">
            <label>
              <CalendarDays size={15} /> Date de début
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>

          <div className="task-filter-field">
            <label>
              <CalendarDays size={15} /> Date de fin
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>

          <div className="task-filter-field">
            <label>
              <ClipboardList size={15} /> Tâche
            </label>
            <div className="task-filter-dropdown">
              <button
                type="button"
                className="task-filter-dropdown-trigger"
                onClick={() => setShowTaskDropdown((current) => !current)}
              >
                {selectedTask ? (
                  `#${selectedTask.id} — ${selectedTask.description}`
                ) : (
                  <span>Toutes</span>
                )}
              </button>

              {showTaskDropdown && (
                <div className="task-filter-dropdown-panel">
                  <button
                    type="button"
                    className={`task-filter-dropdown-row ${
                      !filterTaskId ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFilterTaskId("");
                      setShowTaskDropdown(false);
                    }}
                  >
                    Toutes
                    {!filterTaskId && <CheckCircle2 size={16} />}
                  </button>

                  {tasks.map((task) => (
                    <button
                      type="button"
                      key={task.id}
                      className={`task-filter-dropdown-row ${
                        filterTaskId === task.id ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterTaskId(task.id);
                        setShowTaskDropdown(false);
                      }}
                    >
                      #{task.id} — {task.description}
                      {filterTaskId === task.id && (
                        <CheckCircle2 size={16} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="task-filter-field">
            <label>
              <ActivityIcon size={15} /> Activité
            </label>
            <div className="task-filter-dropdown">
              <button
                type="button"
                className="task-filter-dropdown-trigger"
                onClick={() => setShowActivityDropdown((current) => !current)}
              >
                {selectedActivity ? (
                  `#${selectedActivity.id} — ${selectedActivity.description}`
                ) : (
                  <span>Toutes</span>
                )}
              </button>

              {showActivityDropdown && (
                <div className="task-filter-dropdown-panel">
                  <button
                    type="button"
                    className={`task-filter-dropdown-row ${
                      !filterActivityId ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFilterActivityId("");
                      setShowActivityDropdown(false);
                    }}
                  >
                    Toutes
                    {!filterActivityId && <CheckCircle2 size={16} />}
                  </button>

                  {activities.map((activity) => (
                    <button
                      type="button"
                      key={activity.id}
                      className={`task-filter-dropdown-row ${
                        filterActivityId === activity.id ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterActivityId(activity.id);
                        setShowActivityDropdown(false);
                      }}
                    >
                      #{activity.id} — {activity.description}
                      {filterActivityId === activity.id && (
                        <CheckCircle2 size={16} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="task-filter-field">
            <label>
              <CalendarCheck size={15} /> Plan de maintenance
            </label>
            <div className="task-filter-dropdown">
              <button
                type="button"
                className="task-filter-dropdown-trigger"
                onClick={() => setShowPlanDropdown((current) => !current)}
              >
                {selectedPlan ? (
                  `#${selectedPlan.id} — ${selectedPlan.description}`
                ) : (
                  <span>Tous</span>
                )}
              </button>

              {showPlanDropdown && (
                <div className="task-filter-dropdown-panel">
                  <button
                    type="button"
                    className={`task-filter-dropdown-row ${
                      !filterPlanId ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFilterPlanId("");
                      setShowPlanDropdown(false);
                    }}
                  >
                    Tous
                    {!filterPlanId && <CheckCircle2 size={16} />}
                  </button>

                  {plans.map((plan) => (
                    <button
                      type="button"
                      key={plan.id}
                      className={`task-filter-dropdown-row ${
                        filterPlanId === plan.id ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterPlanId(plan.id);
                        setShowPlanDropdown(false);
                      }}
                    >
                      #{plan.id} — {plan.description}
                      {filterPlanId === plan.id && (
                        <CheckCircle2 size={16} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="task-filter-field">
            <label>
              <Users size={15} /> Utilisateur
            </label>
            <div className="task-filter-dropdown">
              <button
                type="button"
                className="task-filter-dropdown-trigger"
                onClick={() => setShowUserDropdown((current) => !current)}
              >
                {selectedUser ? (
                  <>
                    <span
                      className="task-filter-avatar"
                      style={{ background: avatarColor(selectedUser.id) }}
                    >
                      {initials(selectedUser.firstName, selectedUser.lastName)}
                    </span>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </>
                ) : (
                  <span>Tous</span>
                )}
              </button>

              {showUserDropdown && (
                <div className="task-filter-dropdown-panel">
                  <button
                    type="button"
                    className={`task-filter-dropdown-row ${
                      !filterUserId ? "selected" : ""
                    }`}
                    onClick={() => {
                      setFilterUserId("");
                      setShowUserDropdown(false);
                    }}
                  >
                    Tous
                    {!filterUserId && <CheckCircle2 size={16} />}
                  </button>

                  {users.map((user) => (
                    <button
                      type="button"
                      key={user.id}
                      className={`task-filter-dropdown-row ${
                        filterUserId === user.id ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterUserId(user.id);
                        setShowUserDropdown(false);
                      }}
                    >
                      <span
                        className="task-filter-avatar"
                        style={{ background: avatarColor(user.id) }}
                      >
                        {initials(user.firstName, user.lastName)}
                      </span>
                      {user.firstName} {user.lastName}
                      {filterUserId === user.id && (
                        <CheckCircle2 size={16} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="task-filter-actions">
          <button
            type="button"
            className="task-filter-apply"
            onClick={() => void loadMovements()}
          >
            <SlidersHorizontal size={15} />
            Appliquer les filtres
          </button>

          <button
            type="button"
            className="task-filter-reset"
            onClick={() => {
              resetFilters();
              void loadMovements();
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
        </div>
      )}

      {loading ? (
        <div className="supplier-loading">Chargement des mouvements...</div>
      ) : (
        <div className="supplier-table-wrapper">
          <table className="supplier-table">
            <thead>
              <tr>
                <th>Pièce détachée</th>
                <th>Source</th>
                <th>ID Tâche</th>
                <th>ID Activité</th>
                <th>Plan de maintenance</th>
                <th>Description</th>
                <th>Utilisateur</th>
                <th>Quantité</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="spare-detail-table-empty">
                    Aucun mouvement trouvé pour ces filtres.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => {
                  const image = getFileUrl(movement.sparePartImage);
                  const [firstName, ...rest] = (movement.userName || "").split(
                    " ",
                  );
                  const lastName = rest.join(" ");

                  return (
                    <tr key={movement.id}>
                      <td>
                        <span className="task-equipment-cell">
                          <span className="task-equipment-thumb">
                            {image ? (
                              <img src={image} alt={movement.sparePartName} />
                            ) : (
                              <Boxes size={16} />
                            )}
                          </span>
                          {movement.sparePartName}
                        </span>
                      </td>
                      <td>{movement.source}</td>
                      <td>{movement.taskId ?? "-"}</td>
                      <td>{movement.activityId ?? "-"}</td>
                      <td>
                        {movement.maintenancePlanId
                          ? `#${movement.maintenancePlanId} — ${
                              movement.maintenancePlanDescription || ""
                            }`
                          : "-"}
                      </td>
                      <td>
                        {movement.activityDescription ||
                          movement.taskDescription ||
                          "-"}
                      </td>
                      <td>
                        {movement.userName ? (
                          <span className="task-equipment-cell">
                            <span
                              className="task-filter-avatar"
                              style={{
                                background: avatarColor(
                                  movement.userName.length,
                                ),
                              }}
                            >
                              {initials(firstName, lastName)}
                            </span>
                            {movement.userName}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{movement.quantity}</td>
                      <td>{formatDateTime(movement.movementDate)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default MovementHistoryPage;
