import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  Clock,
  Info,
  RotateCcw,
  Save,
  Scale,
  Wrench,
} from "lucide-react";
import type {
  MaintenanceFrequencyUnit,
  MaintenancePlan,
  MaintenancePlanPayload,
  MaintenanceTriggerType,
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
};

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
  };
}

function addDays(dateValue: string | null, days: number) {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getFrequencyInDays(value: number, unit: MaintenanceFrequencyUnit) {
  if (unit === "WEEKS") return value * 7;
  if (unit === "MONTHS") return value * 30;
  if (unit === "YEARS") return value * 365;
  return value;
}

export default function MaintenancePlanFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<MaintenancePlanPayload>(defaultPayload);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  async function loadInitialData() {
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
  }

  function updateField<K extends keyof MaintenancePlanPayload>(
    key: K,
    value: MaintenancePlanPayload[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateFrequency(
    value: number,
    unit: MaintenanceFrequencyUnit = form.frequencyUnit
  ) {
    const safeValue = Math.max(1, value || 1);
    const days = getFrequencyInDays(safeValue, unit);

    setForm((current) => ({
      ...current,
      frequencyValue: safeValue,
      frequencyUnit: unit,
      nextDueDate: addDays(current.startDate, days),
    }));
  }

  function updateStartDate(value: string) {
    const days = getFrequencyInDays(form.frequencyValue, form.frequencyUnit);

    setForm((current) => ({
      ...current,
      startDate: value,
      nextDueDate: addDays(value, days),
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
        await createMaintenancePlan(form);
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
    const days = getFrequencyInDays(form.frequencyValue, form.frequencyUnit);
    let current = form.startDate || today();

    for (let index = 0; index < 10; index += 1) {
      dates.push(current);
      current = addDays(current, days) || current;
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

            <div className="form-actions">
              <button type="button" className="secondary-action" disabled>
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

              {(
                [
                  ["FIXED_DATE", "Date fixe"],
                  ["TASK_CLOSURE", "Clôture de la tâche"],
                  ["EXTERNAL_API", "Déclencheur externe (API)"],
                  ["COUNTER", "Déclenché par un compteur"],
                ] as [MaintenanceTriggerType, string][]
              ).map(([value, label]) => (
                <label key={value} className="radio-line">
                  <input
                    type="radio"
                    checked={form.triggerType === value}
                    onChange={() => updateField("triggerType", value)}
                  />
                  <span>{label}</span>
                </label>
              ))}

              <div className="form-section-title">
                <RotateCcw size={22} />
                <h2>Répéter</h2>
              </div>

              <div className="form-grid two">
                <label className="form-field">
                  <span>Fréquence</span>
                  <input
                    type="number"
                    min={1}
                    value={form.frequencyValue}
                    onChange={(event) =>
                      updateFrequency(Number(event.target.value))
                    }
                  />
                </label>

                <label className="form-field">
                  <span>Unité</span>
                  <select
                    value={form.frequencyUnit}
                    onChange={(event) =>
                      updateFrequency(
                        form.frequencyValue,
                        event.target.value as MaintenanceFrequencyUnit
                      )
                    }
                  >
                    <option value="DAYS">Jours</option>
                    <option value="WEEKS">Semaines</option>
                    <option value="MONTHS">Mois</option>
                    <option value="YEARS">Années</option>
                  </select>
                </label>
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
                  <span>Heures d’arrêt</span>
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
                  <span>Minutes d’arrêt</span>
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
                Tous les {form.frequencyValue}{" "}
                {form.frequencyUnit === "DAYS"
                  ? "jours"
                  : form.frequencyUnit === "WEEKS"
                  ? "semaines"
                  : form.frequencyUnit === "MONTHS"
                  ? "mois"
                  : "années"}
              </strong>

              <span>
                À partir du{" "}
                {new Intl.DateTimeFormat("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(form.startDate || today()))}
              </span>

              <ol>
                {previewDates.map((date, index) => (
                  <li key={`${date}-${index}`}>
                    <span>{index + 1}</span>
                    {new Intl.DateTimeFormat("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(new Date(date))}
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
                Tous les {form.frequencyValue} {form.frequencyUnit.toLowerCase()}
              </p>

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
                Temps de maintenance planifié :{" "}
                {form.plannedMaintenanceHours}h{" "}
                {form.plannedMaintenanceMinutes}mn.
              </p>
              <p>
                Temps d’arrêt planifié : {form.plannedStoppedHours}h{" "}
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