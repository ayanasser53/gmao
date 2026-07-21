import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  Clock,
  Info,
  Save,
  Scale,
  Wrench,
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
import type { Equipment } from "../../types/equipment";

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
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const loadInitialData = useCallback(async () => {
    try {
      const equipmentData = await getEquipment();
      setEquipments(equipmentData);

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

  return (
    <main className="admin-page">
      <button
        type="button"
        className="back-link"
        onClick={() => navigate("/admin/maintenance-plans")}
      >
        <ArrowLeft size={19} />
        Retour aux plans
      </button>

      <section className="form-header">
        <h1>
          <CalendarClock size={34} />
          {isEdit ? "Modifier le plan de maintenance" : "Créer un plan de maintenance"}
        </h1>

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
              <select
                value={form.equipmentId}
                onChange={(event) =>
                  updateField("equipmentId", Number(event.target.value))
                }
              >
                <option value={0}>Sélectionnez votre option</option>
                {equipments.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.name}
                  </option>
                ))}
              </select>
            </label>

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
                <Calendar size={22} />
                <h2>À partir de</h2>
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
                À partir du{" "}
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

              <p>À partir de {form.startDate || "-"}</p>
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
    </main>
  );
}
