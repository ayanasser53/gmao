import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  Clock,
  Info,
  Package,
  Plus,
  Save,
  Search,
  Scale,
  Tag,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type {
  MaintenanceFrequencyUnit,
  MaintenancePlan,
  MaintenancePlanPayload,
  MaintenancePlanStatus,
} from "../../types/maintenancePlan";
import {
  createMaintenancePlan,
  getMaintenancePlanById,
  updateMaintenancePlan,
} from "../../services/maintenancePlanService";
import { getEquipment } from "../../services/equipmentService";
import { getSpareParts } from "../../services/sparePartService";
import { getTags } from "../../services/tagService";
import { createTeam } from "../../services/teamService";
import { getUsersDetailed } from "../../services/userService";
import EquipmentSelect from "../../components/admin/EquipmentSelect";
import SparePartSelect from "../../components/admin/SparePartSelect";
import type { Equipment } from "../../types/equipment";
import type { SparePart } from "../../types/sparePart";
import type { Tag as TagItem } from "../../types/tag";
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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getStatusForForm(plan: MaintenancePlan): MaintenancePlanStatus {
  if (
    plan.status === "DONE" ||
    plan.status === "IN_PROGRESS" ||
    plan.status === "LATE"
  ) {
    return plan.status;
  }

  const referenceDate = plan.nextDueDate || plan.startDate;
  if (referenceDate && referenceDate.slice(0, 10) <= today()) {
    return "LATE";
  }

  return "PLANNED";
}
const defaultPayload: MaintenancePlanPayload = {
  equipmentId: 0,
  description: "",
  equipmentOnly: true,
  regulatory: false,
  triggerType: "FIXED_DATE",
  frequencyValue: 1,
  frequencyUnit: "DAYS",
  startDate: today(),
  nextDueDate: today(),
  plannedMaintenanceHours: 0,
  plannedMaintenanceMinutes: 0,
  plannedStoppedHours: 0,
  plannedStoppedMinutes: 0,
  status: "PLANNED",
  spareParts: [],
};

type MaintenanceSchedulePreset =
  | "FIXED_DATE"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY";

const scheduleOptions: {
  value: MaintenanceSchedulePreset;
  label: string;
  frequencyValue: number;
  frequencyUnit: MaintenanceFrequencyUnit;
}[] = [
  { value: "FIXED_DATE", label: "Quotidien", frequencyValue: 1, frequencyUnit: "DAYS" },
  { value: "WEEKLY", label: "Hebdomadaire", frequencyValue: 1, frequencyUnit: "WEEKS" },
  { value: "MONTHLY", label: "Mensuel", frequencyValue: 1, frequencyUnit: "MONTHS" },
  { value: "QUARTERLY", label: "Trimestriel", frequencyValue: 3, frequencyUnit: "MONTHS" },
  { value: "YEARLY", label: "Annuel", frequencyValue: 1, frequencyUnit: "YEARS" },
];

function toPayload(plan: MaintenancePlan): MaintenancePlanPayload {
  return {
    equipmentId: plan.equipmentId,
    description: plan.description,
    equipmentOnly: plan.equipmentOnly,
    regulatory: plan.regulatory,
    triggerType: plan.triggerType,
    frequencyValue: plan.frequencyValue,
    frequencyUnit: plan.frequencyUnit as MaintenanceFrequencyUnit,
    startDate: plan.startDate || today(),
    nextDueDate: plan.nextDueDate || plan.startDate || today(),
    plannedMaintenanceHours: plan.plannedMaintenanceHours,
    plannedMaintenanceMinutes: plan.plannedMaintenanceMinutes,
    plannedStoppedHours: plan.plannedStoppedHours,
    plannedStoppedMinutes: plan.plannedStoppedMinutes,
    status: getStatusForForm(plan),
    spareParts: (plan.spareParts ?? []).map((part) => ({
      sparePartId: part.sparePartId,
      quantity: part.quantity,
    })),
  };
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addInterval(
  dateValue: string | null,
  value: number,
  unit: MaintenanceFrequencyUnit,
) {
  if (!dateValue) return null;

  const date = new Date(`${dateValue}T00:00:00`);

  if (unit === "DAYS") {
    date.setDate(date.getDate() + value);
  } else if (unit === "WEEKS") {
    date.setDate(date.getDate() + value * 7);
  } else if (unit === "MONTHS") {
    date.setMonth(date.getMonth() + value);
  } else {
    date.setFullYear(date.getFullYear() + value);
  }

  return toDateInputValue(date);
}

function getUnitLabel(unit: MaintenanceFrequencyUnit) {
  if (unit === "DAYS") return "jours";
  if (unit === "WEEKS") return "semaines";
  if (unit === "MONTHS") return "mois";
  return "années";
}

export default function MaintenancePlanFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<MaintenancePlanPayload>(defaultPayload);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [observerIds, setObserverIds] = useState<number[]>([]);
  const [labelIds, setLabelIds] = useState<number[]>([]);
  const [assigneePanelOpen, setAssigneePanelOpen] = useState(false);
  const [assigneeMode, setAssigneeMode] = useState<"manual" | "labels">("manual");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [assigneeLabelIds, setAssigneeLabelIds] = useState<number[]>([]);
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamMemberIds, setTeamMemberIds] = useState<number[]>([]);
  const [teamLabelIds, setTeamLabelIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [showObserverDropdown, setShowObserverDropdown] = useState(false);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [showEquipmentImageZoom, setShowEquipmentImageZoom] = useState(false);

  const loadInitialData = useCallback(async () => {
    try {
      const [equipmentData, sparePartData, userData, tagData] = await Promise.all([
        getEquipment(),
        getSpareParts().catch(() => [] as SparePart[]),
        getUsersDetailed().catch(() => [] as UserDetail[]),
        getTags().catch(() => [] as TagItem[]),
      ]);

      setEquipments(equipmentData);
      setSpareParts(sparePartData);
      setUsers(userData);
      setTags(tagData);

      if (id) {
        const plan = await getMaintenancePlanById(Number(id));
        setForm(toPayload(plan));
      }
    } catch {
      setError("Impossible de charger les données.");
    }
  }, [id]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  function updateField<K extends keyof MaintenancePlanPayload>(
    key: K,
    value: MaintenancePlanPayload[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function getSchedulePreset(): MaintenanceSchedulePreset {
    if (form.frequencyUnit === "WEEKS" && form.frequencyValue === 1) return "WEEKLY";
    if (form.frequencyUnit === "MONTHS" && form.frequencyValue === 1) return "MONTHLY";
    if (form.frequencyUnit === "MONTHS" && form.frequencyValue === 3) return "QUARTERLY";
    if (form.frequencyUnit === "YEARS" && form.frequencyValue === 1) return "YEARLY";
    return "FIXED_DATE";
  }

  function updateSchedulePreset(value: MaintenanceSchedulePreset) {
    const option = scheduleOptions.find((item) => item.value === value) ?? scheduleOptions[0];

    setForm((current) => ({
      ...current,
      triggerType: "FIXED_DATE",
      frequencyValue: option.frequencyValue,
      frequencyUnit: option.frequencyUnit,
      nextDueDate: addInterval(
        current.startDate || today(),
        option.frequencyValue,
        option.frequencyUnit,
      ),
    }));
  }

  function toggleNumber(setter: Dispatch<SetStateAction<number[]>>, idValue: number) {
    setter((current) =>
      current.includes(idValue)
        ? current.filter((item) => item !== idValue)
        : [...current, idValue],
    );
  }

  function getUserName(user: UserDetail) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  }

  const AVATAR_COLORS = [
    "#087fbd",
    "#6b46c1",
    "#198754",
    "#a3660f",
    "#b42318",
    "#0f766e",
  ];

  function avatarColor(id: number) {
    return AVATAR_COLORS[id % AVATAR_COLORS.length];
  }

  function initials(label: string) {
    return label
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }

  function applyAssigneeLabels() {
    if (assigneeLabelIds.length === 0) {
      return;
    }

    const matchedUsers = users
      .filter((user) => user.tags.some((tag) => assigneeLabelIds.includes(tag.id)))
      .map((user) => user.id);

    setAssigneeIds(Array.from(new Set([...assigneeIds, ...matchedUsers])));
  }

  async function handleCreateTeam() {
    if (!teamName.trim()) {
      setError("Veuillez renseigner le nom de l'équipe.");
      return;
    }

    try {
      await createTeam({
        name: teamName.trim(),
        description: teamDescription.trim(),
        memberIds: teamMemberIds,
        tagIds: teamLabelIds,
      });

      setTeamName("");
      setTeamDescription("");
      setTeamMemberIds([]);
      setTeamLabelIds([]);
      setTeamPanelOpen(false);
      setAssigneePanelOpen(true);
    } catch {
      setError("Impossible de créer l'équipe.");
    }
  }

  function addSparePart(sparePartId: number) {
    if (!sparePartId || form.spareParts?.some((item) => item.sparePartId === sparePartId)) {
      return;
    }

    updateField("spareParts", [
      ...(form.spareParts ?? []),
      { sparePartId, quantity: 1 },
    ]);
  }

  function updateSparePartQuantity(sparePartId: number, quantity: number) {
    updateField(
      "spareParts",
      (form.spareParts ?? []).map((item) =>
        item.sparePartId === sparePartId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      ),
    );
  }

  function removeSparePart(sparePartId: number) {
    updateField(
      "spareParts",
      (form.spareParts ?? []).filter((item) => item.sparePartId !== sparePartId),
    );
  }

  function updateStartDate(value: string) {
    setForm((current) => ({
      ...current,
      startDate: value,
      nextDueDate: addInterval(value, current.frequencyValue, current.frequencyUnit),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.equipmentId || !form.description.trim()) {
      setError("Veuillez remplir les champs obligatoires.");
      setStep(1);
      return;
    }

    try {
      setError("");

      if (isEdit && id) {
        await updateMaintenancePlan(Number(id), form);
      } else {
        const creationPayload: MaintenancePlanPayload = {
          ...form,
          status: "PLANNED",
        };
        await createMaintenancePlan(creationPayload);
      }

      navigate("/admin/maintenance-plans");
    } catch {
      setError(
        isEdit
          ? "Impossible de modifier le plan de maintenance."
          : "Impossible de créer le plan de maintenance."
      );
    }
  }

  const previewDates = useMemo(() => {
    const dates: string[] = [];
    let current = addInterval(
      form.startDate || today(),
      form.frequencyValue,
      form.frequencyUnit,
    );

    for (let index = 0; index < 10; index += 1) {
      if (!current) break;

      dates.push(current);
      current = addInterval(current, form.frequencyValue, form.frequencyUnit);
    }

    return dates;
  }, [form.startDate, form.frequencyValue, form.frequencyUnit]);

  const filteredAssigneeUsers = useMemo(() => {
    const value = assigneeSearch.trim().toLowerCase();
    if (!value) return users;

    return users.filter((user) =>
      `${getUserName(user)} ${user.email}`.toLowerCase().includes(value),
    );
  }, [assigneeSearch, users]);

  const selectedAssigneeLabels = useMemo(
    () => tags.filter((tag) => assigneeLabelIds.includes(tag.id)),
    [assigneeLabelIds, tags],
  );

  const selectedTeamLabels = useMemo(
    () => tags.filter((tag) => teamLabelIds.includes(tag.id)),
    [teamLabelIds, tags],
  );

  return (
    <main className="admin-page">
      <section className="form-header maintenance-form-header">
        <h1>
          <CalendarClock size={34} />
          {isEdit ? "Modifier le plan de maintenance" : "Créer un plan de maintenance"}
        </h1>

        <button
          type="button"
          className="maintenance-form-back-button"
          onClick={() => navigate("/admin/maintenance-plans")}
        >
          <ArrowLeft size={19} />
          Retour aux plans de maintenance
        </button>

        <div className="wizard-steps">
          <button
            type="button"
            className={step === 1 ? "active" : ""}
            onClick={() => setStep(1)}
          >
            1 Informations générales
          </button>
          <button
            type="button"
            className={step === 2 ? "active" : ""}
            onClick={() => setStep(2)}
          >
            2 Planification
          </button>
          <button
            type="button"
            className={step === 3 ? "active" : ""}
            onClick={() => setStep(3)}
          >
            3 Validation
          </button>
        </div>
      </section>

      {error && <div className="form-error">{error}</div>}

      <form className="maintenance-form" onSubmit={handleSubmit}>
        {step === 1 && (
          <section className="form-card">
            <div className="form-section-title">
              <Wrench size={22} />
              <h2>Informations générales</h2>
            </div>

            <div className="info-box">
              <Info size={20} />
              <span>
                Vous pourrez choisir le type de déclenchement de votre plan de
                maintenance à la page suivante.
              </span>
            </div>

            <label className="form-field">
              <span>Équipement *</span>
              <EquipmentSelect
                equipmentList={equipments}
                value={form.equipmentId}
                onSelect={(equipment) =>
                  updateField("equipmentId", equipment.id)
                }
                placeholder="Sélectionnez votre option"
              />
            </label>

            {(() => {
              const selectedEquipment = equipments.find(
                (item) => item.id === form.equipmentId,
              );
              const image = getFileUrl(selectedEquipment?.image ?? null);

              if (!selectedEquipment || !image) {
                return null;
              }

              return (
                <button
                  type="button"
                  className="maintenance-equipment-preview"
                  onClick={() => setShowEquipmentImageZoom(true)}
                >
                  <img src={image} alt={selectedEquipment.name} />
                  <span>Cliquer pour agrandir</span>
                </button>
              );
            })()}

            {showEquipmentImageZoom &&
              (() => {
                const selectedEquipment = equipments.find(
                  (item) => item.id === form.equipmentId,
                );
                const image = getFileUrl(selectedEquipment?.image ?? null);

                if (!image) {
                  return null;
                }

                return (
                  <div
                    className="image-zoom-overlay"
                    onClick={() => setShowEquipmentImageZoom(false)}
                  >
                    <button
                      type="button"
                      className="image-zoom-close"
                      onClick={() => setShowEquipmentImageZoom(false)}
                      aria-label="Fermer"
                    >
                      <X size={22} />
                    </button>
                    <img src={image} alt={selectedEquipment?.name} />
                  </div>
                );
              })()}

            <label className="form-field">
              <span>Description *</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                maxLength={3000}
                placeholder="Décrivez le plan de maintenance..."
              />
              <small>{form.description.length} / 3000</small>
            </label>

            <label className="toggle-field">
              <input
                type="checkbox"
                checked={form.regulatory}
                onChange={(event) =>
                  updateField("regulatory", event.target.checked)
                }
              />
              <span>Ce plan de maintenance est réglementaire</span>
            </label>

            <div className="form-section-title">
              <Users size={22} />
              <h2>Assignés</h2>
            </div>

            <div className="maintenance-choice-panel">
              <span>Sélectionner les assignés</span>
              {assigneeIds.length > 0 && (
                <div className="maintenance-selected-line">
                  {assigneeIds.map((userId) => {
                    const user = users.find((item) => item.id === userId);
                    return (
                      <button
                        key={`user-${userId}`}
                        type="button"
                        className="maintenance-selected-user"
                        onClick={() => toggleNumber(setAssigneeIds, userId)}
                      >
                        {user ? getUserName(user) : userId} ×
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                className="maintenance-select-button"
                onClick={() => setAssigneePanelOpen(true)}
              >
                Sélectionner
              </button>
            </div>

            <label className="form-field">
              <span>Observateurs</span>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setShowObserverDropdown((current) => !current)
                  }
                >
                  + Ajouter un observateur
                </button>

                {showObserverDropdown && (
                  <div className="task-filter-dropdown-panel">
                    {users
                      .filter((user) => !observerIds.includes(user.id))
                      .map((user) => (
                        <button
                          type="button"
                          key={user.id}
                          className="task-filter-dropdown-row"
                          onClick={() => {
                            toggleNumber(setObserverIds, user.id);
                            setShowObserverDropdown(false);
                          }}
                        >
                          <span
                            className="task-filter-avatar"
                            style={{ background: avatarColor(user.id) }}
                          >
                            {initials(getUserName(user))}
                          </span>
                          {getUserName(user)}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <small>Ces utilisateurs recevront un e-mail pour chaque tâche terminée</small>
            </label>

            {observerIds.length > 0 && (
              <div className="maintenance-selected-line">
                {observerIds.map((userId) => {
                  const user = users.find((item) => item.id === userId);
                  return (
                    <button
                      key={userId}
                      type="button"
                      className="maintenance-selected-user"
                      onClick={() => toggleNumber(setObserverIds, userId)}
                    >
                      {user ? getUserName(user) : userId} ×
                    </button>
                  );
                })}
              </div>
            )}

            <div className="form-section-title">
              <Tag size={22} />
              <h2>Labels</h2>
            </div>

            <label className="form-field">
              <span>Labels</span>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() => setShowLabelDropdown((current) => !current)}
                >
                  + Sélectionner des labels
                </button>

                {showLabelDropdown && (
                  <div className="task-filter-dropdown-panel">
                    {tags
                      .filter((tag) => !labelIds.includes(tag.id))
                      .map((tag) => (
                        <button
                          type="button"
                          key={tag.id}
                          className="task-filter-dropdown-row"
                          onClick={() => {
                            toggleNumber(setLabelIds, tag.id);
                            setShowLabelDropdown(false);
                          }}
                        >
                          <span
                            className="task-filter-tag-chip"
                            style={{
                              color: tag.color ?? "#617287",
                              borderColor: tag.color ?? "#cfdbe6",
                              background: `${tag.color ?? "#617287"}1a`,
                            }}
                          >
                            {tag.name}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </label>

            {labelIds.length > 0 && (
              <div className="maintenance-selected-line">
                {labelIds.map((tagId) => {
                  const tag = tags.find((item) => item.id === tagId);
                  return (
                    <button
                      key={tagId}
                      type="button"
                      className="maintenance-selected-label"
                      onClick={() => toggleNumber(setLabelIds, tagId)}
                      style={{
                        borderColor: tag?.color || "#d6e2ed",
                        background: tag?.color || undefined,
                      }}
                    >
                      {tag?.name || tagId} ×
                    </button>
                  );
                })}
              </div>
            )}

            <div className="form-section-title">
              <Clock size={22} />
              <h2>Durée estimée de chaque tâche</h2>
            </div>

            <div className="form-grid two">
              <label className="form-field">
                <span>Heures de maintenance</span>
                <input
                  type="number"
                  min={0}
                  value={form.plannedMaintenanceHours}
                  onChange={(event) =>
                    updateField(
                      "plannedMaintenanceHours",
                      Number(event.target.value)
                    )
                  }
                />
              </label>

              <label className="form-field">
                <span>Minutes de maintenance</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={form.plannedMaintenanceMinutes}
                  onChange={(event) =>
                    updateField(
                      "plannedMaintenanceMinutes",
                      Number(event.target.value)
                    )
                  }
                />
              </label>

              <label className="form-field">
                <span>Heures d'arrêt</span>
                <input
                  type="number"
                  min={0}
                  value={form.plannedStoppedHours}
                  onChange={(event) =>
                    updateField("plannedStoppedHours", Number(event.target.value))
                  }
                />
              </label>

              <label className="form-field">
                <span>Minutes d'arrêt</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={form.plannedStoppedMinutes}
                  onChange={(event) =>
                    updateField(
                      "plannedStoppedMinutes",
                      Number(event.target.value)
                    )
                  }
                />
              </label>
            </div>

            <div className="form-section-title">
              <Package size={22} />
              <h2>Pièces détachées à prévoir</h2>
            </div>

            <label className="form-field">
              <span>Ajouter une pièce détachée</span>
              <SparePartSelect
                spareParts={spareParts}
                excludedIds={(form.spareParts ?? []).map(
                  (item) => item.sparePartId,
                )}
                onSelect={(part) => addSparePart(part.id)}
                placeholder="Sélectionner une pièce détachée"
              />
            </label>

            {(form.spareParts ?? []).length > 0 && (
              <div className="maintenance-spare-lines">
                {(form.spareParts ?? []).map((line) => {
                  const part = spareParts.find((item) => item.id === line.sparePartId);
                  return (
                    <div key={line.sparePartId}>
                      <span>{part?.name || `Pièce #${line.sparePartId}`}</span>
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(event) =>
                          updateSparePartQuantity(
                            line.sparePartId,
                            Number(event.target.value),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeSparePart(line.sparePartId)}
                      >
                        Supprimer
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <label className="form-field">
              <span>Statut utilisateur</span>
              <select
                value={form.status || "PLANNED"}
                onChange={(event) =>
                  updateField("status", event.target.value as MaintenancePlanStatus)
                }
              >
                <option value="PLANNED">Planifié</option>
                {isEdit && (
                  <>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="LATE">En retard</option>
                    <option value="DONE">Terminé</option>
                  </>
                )}
              </select>
            </label>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => navigate("/admin/maintenance-plans")}
              >
                Annuler
              </button>

              <button
                type="button"
                className="primary-action"
                onClick={() => setStep(2)}
              >
                Planification
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="maintenance-form-grid">
            <div className="form-card">
              <div className="form-section-title">
                <Clock size={22} />
                <h2>Déclencheur</h2>
              </div>

              <div className="maintenance-schedule-options">
                {scheduleOptions.map((option) => (
                  <label key={option.value} className="radio-line">
                    <input
                      type="radio"
                      checked={getSchedulePreset() === option.value}
                      onChange={() => updateSchedulePreset(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>


              <div className="form-section-title">
                <Calendar size={22} />
                <h2>ì partir de</h2>
              </div>

              <label className="form-field">
                <span>Date de début</span>
                <input
                  type="date"
                  value={form.startDate || ""}
                  onChange={(event) => updateStartDate(event.target.value)}
                />
              </label>
            </div>

            <aside className="form-card maintenance-preview">
              <h2>Prévisualisation</h2>

              <strong>
                Tous les {form.frequencyValue} {getUnitLabel(form.frequencyUnit)}
              </strong>

              <span>
                ì partir du{" "}
                {new Intl.DateTimeFormat("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(`${form.startDate || today()}T00:00:00`))}
              </span>

              <ol>
                {previewDates.map((date, index) => (
                  <li key={`${date}-${index}`}>
                    <span>{index + 1}</span>
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(`${date}T00:00:00`))}
                  </li>
                ))}
              </ol>
            </aside>

            <div className="form-actions wide">
              <button
                type="button"
                className="secondary-action"
                onClick={() => setStep(1)}
              >
                Précédent
              </button>

              <button
                type="button"
                className="primary-action"
                onClick={() => setStep(3)}
              >
                Validation
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="maintenance-form-grid">
            <div className="form-card">
              <div className="form-section-title">
                <CalendarClock size={22} />
                <h2>Plans de maintenance</h2>
              </div>

              <p>{form.description || "Aucune description."}</p>
              <p>
                Tous les {form.frequencyValue} {getUnitLabel(form.frequencyUnit)}
              </p>
              <p>Statut : {form.status === "DONE" ? "Terminé" : form.status === "LATE" ? "En retard" : form.status === "PLANNED" ? "Planifié" : "En cours"}</p>

              <div className="soft-pill">
                <Scale size={16} />
                {form.regulatory ? "Réglementaire" : "Non réglementaire"}
              </div>
            </div>

            <aside className="form-card">
              <div className="form-section-title">
                <Check size={22} />
                <h2>Tâches</h2>
              </div>

              <p>ì partir de {form.startDate || "-"}</p>
              <p>
                Temps de maintenance planifié : {form.plannedMaintenanceHours}h{" "}
                {form.plannedMaintenanceMinutes}mn.
              </p>
              <p>
                Temps d'arrêt planifié : {form.plannedStoppedHours}h{" "}
                {form.plannedStoppedMinutes}mn.
              </p>
            </aside>

            <div className="form-actions wide">
              <button
                type="button"
                className="secondary-action"
                onClick={() => setStep(2)}
              >
                Précédent
              </button>

              <button type="submit" className="primary-action">
                <Save size={18} />
                {isEdit ? "Enregistrer" : "Créer un plan de maintenance"}
              </button>
            </div>
          </section>
        )}
      </form>

      {assigneePanelOpen && (
        <div className="maintenance-side-overlay">
          <aside className="maintenance-side-panel">
            <div className="maintenance-side-header">
              <button
                type="button"
                onClick={() => setAssigneePanelOpen(false)}
                aria-label="Retour"
              >
                <ArrowLeft size={20} />
              </button>
              <h2>Sélectionner des éléments</h2>
            </div>

            <div className="info-box">
              <Info size={18} />
              <span>Recherchez et sélectionnez des éléments.</span>
            </div>

            <div className="maintenance-assign-modes">
              <button
                type="button"
                className={assigneeMode === "manual" ? "active" : ""}
                onClick={() => setAssigneeMode("manual")}
              >
                <Users size={19} />
                Sélection manuelle
              </button>
              <button
                type="button"
                className={assigneeMode === "labels" ? "active" : ""}
                onClick={() => setAssigneeMode("labels")}
              >
                <Tag size={19} />
                Sélection par label(s)
              </button>
            </div>

            {assigneeMode === "manual" ? (
              <>
                <label className="maintenance-panel-search">
                  <Search size={18} />
                  <input
                    value={assigneeSearch}
                    onChange={(event) => setAssigneeSearch(event.target.value)}
                    placeholder="Rechercher..."
                  />
                </label>

                <div className="maintenance-panel-list">
                  <button
                    type="button"
                    className="maintenance-create-team-button"
                    onClick={() => {
                      setTeamPanelOpen(true);
                      setAssigneePanelOpen(false);
                    }}
                  >
                    <Plus size={17} />
                    Créer une équipe
                  </button>

                  <h3>Collègues</h3>
                  {filteredAssigneeUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className={assigneeIds.includes(user.id) ? "selected" : ""}
                      onClick={() => toggleNumber(setAssigneeIds, user.id)}
                    >
                      <span className="maintenance-user-avatar">
                        {initials(getUserName(user))}
                      </span>
                      {getUserName(user)}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="maintenance-label-panel">
                <label className="form-field">
                  <span>Labels</span>
                  <select
                    value=""
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (value) toggleNumber(setAssigneeLabelIds, value);
                    }}
                  >
                    <option value="">Sélectionnez un label...</option>
                    {tags.map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </label>

                <strong>Labels sélectionnés</strong>
                {assigneeLabelIds.length === 0 && <p>Aucun label sélectionné.</p>}
                {selectedAssigneeLabels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    className="maintenance-match-pill maintenance-match-button maintenance-selected-label"
                    onClick={() => toggleNumber(setAssigneeLabelIds, label.id)}
                    style={{
                      borderColor: label.color || "#d6e2ed",
                      background: label.color || undefined,
                    }}
                  >
                    {label.name} ×
                  </button>
                ))}
              </div>
            )}

            <div className="maintenance-side-footer">
              <span>
                {assigneeMode === "labels"
                  ? assigneeLabelIds.length === 0
                    ? "Aucun label sélectionné."
                    : `${assigneeLabelIds.length} label(s) sélectionné(s).`
                  : assigneeIds.length === 0
                  ? "Aucun élément sélectionné."
                  : `${assigneeIds.length} élément(s) sélectionné(s).`}
              </span>
              <div>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => setAssigneePanelOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => {
                    if (assigneeMode === "labels") applyAssigneeLabels();
                    setAssigneePanelOpen(false);
                  }}
                >
                  Sélectionner
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {teamPanelOpen && (
        <div className="maintenance-side-overlay">
          <aside className="maintenance-side-panel maintenance-team-panel">
            <div className="maintenance-side-header">
              <button
                type="button"
                onClick={() => {
                  setTeamPanelOpen(false);
                  setAssigneePanelOpen(true);
                }}
                aria-label="Retour"
              >
                <ArrowLeft size={20} />
              </button>
              <h2>Créer une équipe</h2>
            </div>

            <div className="info-box">
              <Info size={18} />
              <span>
                Une équipe est dynamique : vous pouvez faire évoluer les collègues
                la composant.
              </span>
            </div>

            <label className="form-field">
              <span>Nom de l'équipe *</span>
              <input
                value={teamName}
                maxLength={255}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Ex : Équipe hydraulique"
              />
              <small>{teamName.length} / 255</small>
            </label>

            <label className="form-field">
              <span>Description</span>
              <textarea
                value={teamDescription}
                maxLength={5000}
                onChange={(event) => setTeamDescription(event.target.value)}
                placeholder="Ex : Ceci est l'équipe hydraulique"
              />
              <small>{teamDescription.length} / 5000</small>
            </label>

            <label className="form-field">
              <span>Collègues</span>
              <select
                value=""
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (value) toggleNumber(setTeamMemberIds, value);
                }}
              >
                <option value="">Sélectionnez un collègue...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getUserName(user)}
                  </option>
                ))}
              </select>
            </label>

            {teamMemberIds.length > 0 && (
              <div className="maintenance-selected-line">
                {teamMemberIds.map((userId) => {
                  const user = users.find((item) => item.id === userId);
                  return (
                    <button
                      key={userId}
                      type="button"
                      className="maintenance-selected-user"
                      onClick={() => toggleNumber(setTeamMemberIds, userId)}
                    >
                      {user ? getUserName(user) : userId} ×
                    </button>
                  );
                })}
              </div>
            )}

            <label className="form-field">
              <span>Labels</span>
              <select
                value=""
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (value) toggleNumber(setTeamLabelIds, value);
                }}
              >
                <option value="">Sélectionnez un label...</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedTeamLabels.length > 0 && (
              <div className="maintenance-selected-line">
                {selectedTeamLabels.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className="maintenance-selected-label"
                    onClick={() => toggleNumber(setTeamLabelIds, tag.id)}
                    style={{
                      borderColor: tag.color || "#d6e2ed",
                      background: tag.color || undefined,
                    }}
                  >
                    {tag.name} ×
                  </button>
                ))}
              </div>
            )}

            <div className="maintenance-side-footer">
              <span />
              <button
                type="button"
                className="primary-action"
                onClick={handleCreateTeam}
              >
                Créer une équipe
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}