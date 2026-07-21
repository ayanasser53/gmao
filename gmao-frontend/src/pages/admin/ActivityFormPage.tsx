import {
  ArrowLeft,
  Clock,
  Coins,
  Gauge,
  ListChecks,
  PackagePlus,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  createActivity,
  createActivityAndFinishTask,
} from "../../services/activityService";
import { getMeasures } from "../../services/measureService";
import { getSpareParts } from "../../services/sparePartService";
import { getTasks } from "../../services/taskService";
import { getUsers } from "../../services/userService";
import type { Measure } from "../../types/measure";
import type { SparePart } from "../../types/sparePart";
import type { TaskListItem } from "../../types/task";
import type { UserSummary } from "../../types/user";

import "./task-styles.css";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function parseDecimal(value: string) {
  return Number(value.replace(",", "."));
}

function userLabel(user: UserSummary) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email || `Utilisateur ${user.id}`;
}

function ActivityFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetTaskId = searchParams.get("taskId");

  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [taskId, setTaskId] = useState(presetTaskId ?? "");
  const [description, setDescription] = useState("");
  const [performedDate, setPerformedDate] = useState(today());
  const [performedEndTime, setPerformedEndTime] = useState(currentTime());
  const [spentHours, setSpentHours] = useState(0);
  const [spentMinutes, setSpentMinutes] = useState(0);
  const [showSparePartLine, setShowSparePartLine] = useState(false);
  const [sparePartId, setSparePartId] = useState("");
  const [sparePartQuantity, setSparePartQuantity] = useState(1);
  const [showAdditionalCostLine, setShowAdditionalCostLine] = useState(false);
  const [additionalCostAmount, setAdditionalCostAmount] = useState("");
  const [additionalCostLabel, setAdditionalCostLabel] = useState("");
  const [showMeasureLine, setShowMeasureLine] = useState(false);
  const [measureId, setMeasureId] = useState("");
  const [measureValue, setMeasureValue] = useState("");
  const [measureDate, setMeasureDate] = useState(today());
  const [measureHour, setMeasureHour] = useState(currentTime());
  const [intervenantId, setIntervenantId] = useState("");
  const [intervenantIds, setIntervenantIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksData, sparePartsData, usersData, measuresData] = await Promise.all([
          getTasks(),
          getSpareParts(),
          getUsers(),
          getMeasures(),
        ]);

        setTasks(tasksData);
        setSpareParts(sparePartsData);
        setUsers(usersData.filter((user) => user.active));
        setMeasures(measuresData);
      } catch {
        setError("Impossible de charger les donnees.");
      }
    }

    void loadData();
  }, []);

  const selectedTask = useMemo(() => {
    return tasks.find((task) => task.id === Number(taskId));
  }, [tasks, taskId]);

  const selectedMeasure = useMemo(() => {
    return measures.find((measure) => measure.id === Number(measureId));
  }, [measures, measureId]);

  const selectedSparePart = useMemo(() => {
    return spareParts.find((sparePart) => sparePart.id === Number(sparePartId));
  }, [spareParts, sparePartId]);

  const selectedIntervenants = useMemo(() => {
    return users.filter((user) => intervenantIds.includes(user.id));
  }, [users, intervenantIds]);

  const availableIntervenants = useMemo(() => {
    return users.filter((user) => !intervenantIds.includes(user.id));
  }, [users, intervenantIds]);

  function closeForm() {
    navigate(presetTaskId ? `/admin/tasks/${presetTaskId}` : "/admin/activities");
  }

  function addMinutes(minutes: number) {
    const total = spentHours * 60 + spentMinutes + minutes;

    setSpentHours(Math.floor(total / 60));
    setSpentMinutes(total % 60);
  }

  function addIntervenant(value: string) {
    const nextId = Number(value);

    if (!nextId || intervenantIds.includes(nextId)) {
      setIntervenantId("");
      return;
    }

    setIntervenantIds((current) => [...current, nextId]);
    setIntervenantId("");
  }

  function removeIntervenant(userId: number) {
    setIntervenantIds((current) => current.filter((id) => id !== userId));
  }

  async function submit(finishTask: boolean) {
    if (!taskId || !description.trim()) {
      setError("Selectionnez une tache et saisissez une description.");
      return;
    }

    if (
      showSparePartLine &&
      (!sparePartId ||
        !Number.isFinite(sparePartQuantity) ||
        sparePartQuantity <= 0)
    ) {
      setError("Selectionnez une piece detachee et une quantite valide.");
      return;
    }

    const additionalCostAmountValue = parseDecimal(additionalCostAmount);

    if (
      showAdditionalCostLine &&
      (!Number.isFinite(additionalCostAmountValue) ||
        additionalCostAmountValue <= 0)
    ) {
      setError("Saisissez un cout additionnel superieur a 0.");
      return;
    }

    const measureValueParsed = parseDecimal(measureValue);

    if (
      showMeasureLine &&
      (!measureId || !Number.isFinite(measureValueParsed))
    ) {
      setError("Selectionnez une mesure et saisissez une valeur.");
      return;
    }

    const selectedSpareParts =
      showSparePartLine && sparePartId
        ? [
            {
              sparePartId: Number(sparePartId),
              quantity: sparePartQuantity,
            },
          ]
        : [];

    const selectedAdditionalCosts =
      showAdditionalCostLine && additionalCostAmount
        ? [
            {
              label: additionalCostLabel.trim() || "Cout additionnel",
              amount: additionalCostAmountValue,
              currency: "EUR",
            },
          ]
        : [];

    const selectedMeasureReadings =
      showMeasureLine && measureId
        ? [
            {
              measureId: Number(measureId),
              value: measureValueParsed,
              readingDate: measureDate,
              readingHour: measureHour,
            },
          ]
        : [];

    const payload = {
      taskId: Number(taskId),
      description: description.trim(),
      performedDate,
      performedEndTime,
      spentHours,
      spentMinutes,
      status: finishTask ? "DONE" as const : "IN_PROGRESS" as const,
      spareParts: selectedSpareParts,
      intervenantIds,
      additionalCosts: selectedAdditionalCosts,
      measureReadings: selectedMeasureReadings,
    };

    try {
      setSubmitting(true);
      setError("");

      if (finishTask) {
        await createActivityAndFinishTask(Number(taskId), payload);
      } else {
        await createActivity(payload);
      }

      navigate(presetTaskId ? `/admin/tasks/${presetTaskId}` : "/admin/activities");
    } catch (submitError) {
      console.error(submitError);
      setError("Impossible d'ajouter l'activite.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(false);
  }

  return (
    <section className="supplier-modal-page">
      <button
        type="button"
        className="supplier-form-backdrop"
        aria-label="Retour aux activites"
        onClick={closeForm}
      />

      <aside className="supplier-form-drawer task-form-drawer">
        <form className="measure-drawer-content" onSubmit={handleSubmit}>
          <div className="measure-drawer-header">
            <button
              type="button"
              className="measure-drawer-back"
              onClick={closeForm}
              aria-label="Retour aux activites"
            >
              <ArrowLeft size={22} />
            </button>

            <h2>Ajouter une activite</h2>

            <button
              type="button"
              className="measure-drawer-close"
              onClick={closeForm}
              aria-label="Fermer"
            >
              <X size={21} />
            </button>
          </div>

          <div className="measure-drawer-body">
            {error && <div className="measure-form-error">{error}</div>}

            <div className="task-form-section">
              <div className="task-section-title">
                <ListChecks size={18} />
                Activite
              </div>

              {!presetTaskId && (
                <div className="measure-form-group">
                  <label>
                    Tache <span>*</span>
                  </label>
                  <select
                    value={taskId}
                    onChange={(event) => setTaskId(event.target.value)}
                    required
                  >
                    <option value="">Selectionner une tache</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!presetTaskId && selectedTask && (
                <div className="form-info-box activity-task-info">
                  Equipement : {selectedTask.equipment?.name || "Non defini"}
                </div>
              )}

              <div className="measure-form-group">
                <label>
                  Description <span>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={2000}
                  placeholder="Description"
                  required
                />
                <small>{description.length} / 2000</small>
              </div>

              <div className="equipment-form-grid">
                <div className="measure-form-group">
                  <label>
                    Realisee le <span>*</span>
                  </label>
                  <input
                    type="date"
                    value={performedDate}
                    onChange={(event) => setPerformedDate(event.target.value)}
                    required
                  />
                </div>

                <div className="measure-form-group">
                  <label>
                    Heure de fin de realisation <span>*</span>
                  </label>
                  <input
                    type="time"
                    value={performedEndTime}
                    onChange={(event) =>
                      setPerformedEndTime(event.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="task-form-section">
              <div className="task-section-title">
                <Clock size={18} />
                Temps passe
              </div>

              <div className="equipment-form-grid">
                <div className="measure-form-group">
                  <label>Heures</label>
                  <input
                    type="number"
                    min={0}
                    value={spentHours}
                    onChange={(event) =>
                      setSpentHours(Number(event.target.value))
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label>Minutes</label>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={spentMinutes}
                    onChange={(event) =>
                      setSpentMinutes(Number(event.target.value))
                    }
                  />
                </div>
              </div>

              <div className="activity-time-actions">
                <button type="button" onClick={() => addMinutes(15)}>
                  +15min.
                </button>
                <button type="button" onClick={() => addMinutes(30)}>
                  +30min.
                </button>
                <button type="button" onClick={() => addMinutes(45)}>
                  +45min.
                </button>
                <button type="button" onClick={() => addMinutes(60)}>
                  +1h
                </button>
              </div>

              <div className="activity-extra-actions">
                <button
                  type="button"
                  onClick={() => setShowMeasureLine((current) => !current)}
                >
                  <Gauge size={18} />
                  Compteur
                </button>
                <button
                  type="button"
                  onClick={() => setShowSparePartLine((current) => !current)}
                >
                  <PackagePlus size={18} />
                  Piece detachee
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setShowAdditionalCostLine((current) => !current)
                  }
                >
                  <Coins size={18} />
                  Cout additionnel
                </button>
              </div>

              {showMeasureLine && (
                <div className="activity-extra-line">
                  <div className="measure-form-group">
                    <label>
                      Mesure <span>*</span>
                    </label>
                    <select
                      value={measureId}
                      onChange={(event) => setMeasureId(event.target.value)}
                    >
                      <option value="">Selectionner une mesure</option>
                      {measures.map((measure) => (
                        <option key={measure.id} value={measure.id}>
                          {measure.name} ({measure.unitSymbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="measure-form-group">
                    <label>
                      Valeur <span>*</span>
                    </label>
                    <div className="activity-money-input">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={measureValue}
                        onChange={(event) => setMeasureValue(event.target.value)}
                        placeholder="Ex : 12,50"
                      />
                      {selectedMeasure && <span>{selectedMeasure.unitSymbol}</span>}
                    </div>
                  </div>

                  <div className="measure-form-group">
                    <label>
                      Date du releve <span>*</span>
                    </label>
                    <input
                      type="date"
                      value={measureDate}
                      onChange={(event) => setMeasureDate(event.target.value)}
                    />
                  </div>

                  <div className="measure-form-group">
                    <label>
                      Heure <span>*</span>
                    </label>
                    <input
                      type="time"
                      value={measureHour}
                      onChange={(event) => setMeasureHour(event.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="activity-remove-line"
                    onClick={() => {
                      setShowMeasureLine(false);
                      setMeasureId("");
                      setMeasureValue("");
                    }}
                    aria-label="Retirer le releve de compteur"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}

              {showSparePartLine && (
                <div className="activity-extra-line">
                  <div className="measure-form-group">
                    <label>
                      Piece detachee <span>*</span>
                    </label>
                    <select
                      value={sparePartId}
                      onChange={(event) => setSparePartId(event.target.value)}
                    >
                      <option value="">Selectionner une piece detachee</option>
                      {spareParts.map((sparePart) => (
                        <option key={sparePart.id} value={sparePart.id}>
                          {sparePart.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="measure-form-group">
                    <label>Quantite</label>
                    <input
                      type="number"
                      min={1}
                      value={sparePartQuantity}
                      onChange={(event) =>
                        setSparePartQuantity(Number(event.target.value))
                      }
                    />
                  </div>

                  {selectedSparePart && (
                    <div className="form-info-box activity-task-info">
                      Cout : {selectedSparePart.unitPrice} {selectedSparePart.currency || "EUR"} x{" "}
                      {sparePartQuantity} ={" "}
                      {(selectedSparePart.unitPrice * sparePartQuantity).toFixed(2)}{" "}
                      {selectedSparePart.currency || "EUR"}
                    </div>
                  )}

                  <button
                    type="button"
                    className="activity-remove-line"
                    onClick={() => {
                      setShowSparePartLine(false);
                      setSparePartId("");
                      setSparePartQuantity(1);
                    }}
                    aria-label="Retirer la piece detachee"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}

              {showAdditionalCostLine && (
                <div className="activity-extra-line">
                  <div className="measure-form-group">
                    <label>
                      Cout additionnel <span>*</span>
                    </label>
                    <div className="activity-money-input">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={additionalCostAmount}
                        onChange={(event) =>
                          setAdditionalCostAmount(event.target.value)
                        }
                        placeholder="Ex : 12,50"
                      />
                      <span>EUR</span>
                    </div>
                  </div>

                  <div className="measure-form-group">
                    <label>Libelle</label>
                    <input
                      type="text"
                      maxLength={255}
                      value={additionalCostLabel}
                      onChange={(event) =>
                        setAdditionalCostLabel(event.target.value)
                      }
                      placeholder="Ex : Retrofit presse hydraulique"
                    />
                    <small>{additionalCostLabel.length} / 255</small>
                  </div>

                  <button
                    type="button"
                    className="activity-remove-line"
                    onClick={() => {
                      setShowAdditionalCostLine(false);
                      setAdditionalCostAmount("");
                      setAdditionalCostLabel("");
                    }}
                    aria-label="Retirer le cout additionnel"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}

              <div className="measure-form-group activity-intervenants-field">
                <label>Intervenants additionnels</label>
                <select
                  value={intervenantId}
                  onChange={(event) => addIntervenant(event.target.value)}
                >
                  <option value="">
                    Selectionnez un administrateur ou technicien
                  </option>
                  {availableIntervenants.map((user) => (
                    <option key={user.id} value={user.id}>
                      {userLabel(user)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedIntervenants.length > 0 && (
                <div className="activity-selected-users">
                  {selectedIntervenants.map((user) => (
                    <span key={user.id}>
                      <Users size={15} />
                      {userLabel(user)}
                      <button
                        type="button"
                        onClick={() => removeIntervenant(user.id)}
                        aria-label={`Retirer ${userLabel(user)}`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="measure-drawer-footer activity-drawer-footer">
            <button
              type="button"
              className="equipment-cancel-button"
              onClick={closeForm}
              disabled={submitting}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="equipment-primary-button"
              disabled={submitting}
            >
              <Save size={18} />
              Ajouter une activite
            </button>

            <button
              type="button"
              className="success-button"
              onClick={() => void submit(true)}
              disabled={submitting}
            >
              <Plus size={18} />
              Ajouter et terminer la tache
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}

export default ActivityFormPage;
