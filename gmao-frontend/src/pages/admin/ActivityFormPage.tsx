import {
  ArrowLeft,
  Clock,
  ListChecks,
  Plus,
  Save,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  createActivity,
  createActivityAndFinishTask,
} from "../../services/activityService";
import { getTasks } from "../../services/taskService";
import type { TaskListItem } from "../../types/task";

import "./task-styles.css";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function ActivityFormPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [taskId, setTaskId] = useState("");
  const [description, setDescription] = useState("");
  const [performedDate, setPerformedDate] = useState(today());
  const [performedEndTime, setPerformedEndTime] = useState(currentTime());
  const [spentHours, setSpentHours] = useState(0);
  const [spentMinutes, setSpentMinutes] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTasks() {
      try {
        const data = await getTasks();
        setTasks(data);
      } catch {
        setError("Impossible de charger les taches.");
      }
    }

    void loadTasks();
  }, []);

  const selectedTask = useMemo(() => {
    return tasks.find((task) => task.id === Number(taskId));
  }, [tasks, taskId]);

  function closeForm() {
    navigate("/admin/activities");
  }

  function addMinutes(minutes: number) {
    const total = spentHours * 60 + spentMinutes + minutes;

    setSpentHours(Math.floor(total / 60));
    setSpentMinutes(total % 60);
  }

  async function submit(finishTask: boolean) {
    if (!taskId || !description.trim()) {
      setError("Selectionnez une tache et saisissez une description.");
      return;
    }

    const payload = {
      taskId: Number(taskId),
      description: description.trim(),
      performedDate,
      performedEndTime,
      spentHours,
      spentMinutes,
      status: finishTask ? "DONE" as const : "IN_PROGRESS" as const,
    };

    try {
      setSubmitting(true);
      setError("");

      if (finishTask) {
        await createActivityAndFinishTask(Number(taskId), payload);
      } else {
        await createActivity(payload);
      }

      navigate("/admin/activities");
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

              {selectedTask && (
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
