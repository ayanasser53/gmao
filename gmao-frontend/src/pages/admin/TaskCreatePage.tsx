import { ArrowLeft, Plus, Trash2, X } from "lucide-react";

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  createTask,
  fetchOptionList,
  fetchTagOptions,
  type TagOption,
} from "../../services/taskService";

import { getEquipment } from "../../services/equipmentService";

import type {
  AssigneeInput,
  LinkInput,
} from "../../types/task";

import type { Equipment } from "../../types/equipment";

import EquipmentSelect from "../../components/admin/EquipmentSelect";

import "./task-styles.css";

interface OptionItem {
  id: number;
  label: string;
}

function TaskCreatePage() {
  const navigate = useNavigate();

  const [equipmentOnly] = useState(true);
  const [equipmentId, setEquipmentId] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startHour, setStartHour] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endHour, setEndHour] = useState("10:00");

  const maintenanceHours = 0;
  const maintenanceMinutes = 0;
  const stoppedHours = 0;
  const stoppedMinutes = 0;

  const [assignees, setAssignees] = useState<{ key: string; userId?: number; label: string }[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);

  const [links, setLinks] = useState<LinkInput[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const [notify] = useState(true);

  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([]);
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [userOptions, setUserOptions] = useState<OptionItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const [equipmentList, tagList, userList] =
        await Promise.all([
          getEquipment().catch((fetchError) => {
            console.error(fetchError);
            return [] as Equipment[];
          }),
          fetchTagOptions(),
          fetchOptionList("/api/users", (u) => `${u.firstName} ${u.lastName}`),
        ]);

      setEquipmentOptions(equipmentList);
      setTagOptions(tagList);
      setUserOptions(userList);
    })();
  }, []);

  function toggleTag(id: number): void {
    setTagIds((current) =>
      current.includes(id)
        ? current.filter((tagId) => tagId !== id)
        : [...current, id],
    );
  }

  function addAssignee(userId: number): void {
    const option = userOptions.find((option) => option.id === userId);

    if (!option || assignees.some((a) => a.userId === userId)) {
      return;
    }

    setAssignees((current) => [
      ...current,
      { key: `user-${userId}`, userId, label: option.label },
    ]);
  }

  async function handleSubmit(
    event: React.FormEvent,
    createAnother: boolean,
  ): Promise<void> {
    event.preventDefault();

    if (!equipmentId || !description.trim() || !startDate || !endDate) {
      setError("Merci de compléter les champs obligatoires.");
      return;
    }

    setSubmitting(true);
    setError("");

    const assigneeInputs: AssigneeInput[] = assignees.map((a) => ({
      userId: a.userId,
    }));

    try {
      await createTask(
        {
          equipmentOnly,
          equipmentId: Number(equipmentId),
          description: description.trim(),
          allDay,
          startDate,
          startHour: allDay ? null : startHour,
          endDate,
          endHour: allDay ? null : endHour,
          plannedMaintenanceHours: maintenanceHours,
          plannedMaintenanceMinutes: maintenanceMinutes,
          plannedStoppedHours: stoppedHours,
          plannedStoppedMinutes: stoppedMinutes,
          assignees: assigneeInputs,
          tagIds,
          spareParts: [],
          links,
          notifyAssignees: notify,
        },
        files,
      );

      if (createAnother) {
        setDescription("");
        setAssignees([]);
        setLinks([]);
        setFiles([]);
        setTagIds([]);
      } else {
        navigate("/admin/tasks");
      }
    } catch (submitError) {
      console.error(submitError);
      setError("La création de la tâche a échoué. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="supplier-modal-page">
      <button
        type="button"
        className="supplier-form-backdrop"
        aria-label="Retour aux tâches"
        onClick={() => navigate("/admin/tasks")}
      />

      <aside className="supplier-form-drawer task-form-drawer">
        <form
          className="measure-drawer-content"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="measure-drawer-header">
            <button
              type="button"
              className="measure-drawer-back"
              onClick={() => navigate("/admin/tasks")}
              aria-label="Retour aux tâches"
            >
              <ArrowLeft size={22} />
            </button>

            <h2>Créer une tâche</h2>

            <button
              type="button"
              className="measure-drawer-close"
              onClick={() => navigate("/admin/tasks")}
              aria-label="Fermer"
            >
              <X size={21} />
            </button>
          </div>

          <div className="measure-drawer-body">
            {error && <div className="measure-form-error">{error}</div>}

            {/* Search in */}
            <div className="task-form-section">
              <div className="supplier-drawer-section-title">
                <span>Rechercher dans</span>
              </div>

              <div className="measure-form-group">
                <label>
                  Équipement <span>*</span>
                </label>
                <EquipmentSelect
                  equipmentList={equipmentOptions}
                  value={equipmentId}
                  onSelect={(equipment) => setEquipmentId(equipment.id)}
                />
              </div>

              <div className="measure-form-group">
                <label>
                  Description de la tâche <span>*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Décrivez la panne, l'équipement concerné et tout détail utile..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Planning */}
            <div className="task-form-section">
              <div className="supplier-drawer-section-title">
                <span>Planification</span>
              </div>

              <label className="task-toggle-row">
                <span>Toute la journée</span>
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                />
              </label>

              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label>
                    Date de début <span>*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      const newStartDate = e.target.value;
                      setStartDate(newStartDate);

                      if (!endDate || endDate < newStartDate) {
                        setEndDate(newStartDate);
                      }
                    }}
                  />
                </div>

                {!allDay && (
                  <div className="measure-form-group">
                    <label>
                      Heure de début <span>*</span>
                    </label>
                    <input
                      type="time"
                      value={startHour}
                      onChange={(e) => {
                        const newStartHour = e.target.value;
                        setStartHour(newStartHour);

                        if (startDate && startDate === endDate && endHour < newStartHour) {
                          setEndHour(newStartHour);
                        }
                      }}
                    />
                  </div>
                )}

                <div className="measure-form-group">
                  <label>
                    Date de fin <span>*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {!allDay && (
                  <div className="measure-form-group">
                    <label>
                      Heure de fin <span>*</span>
                    </label>
                    <input
                      type="time"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Assignees */}
            <div className="task-form-section">
              <div className="supplier-drawer-section-title">
                <span>Signalé par</span>
              </div>

              <div className="task-chip-list">
                {assignees.length === 0 && (
                  <p className="task-empty-hint">Personne renseignée pour l'instant.</p>
                )}

                {assignees.map((assignee) => (
                  <span className="task-chip" key={assignee.key}>
                    {assignee.label}
                    <button
                      type="button"
                      onClick={() =>
                        setAssignees((current) =>
                          current.filter((a) => a.key !== assignee.key),
                        )
                      }
                      aria-label={`Retirer ${assignee.label}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>

              <select
                className="task-add-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) addAssignee(Number(e.target.value));
                }}
              >
                <option value="">+ Sélectionner un utilisateur</option>
                {userOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="task-form-section">
              <div className="supplier-drawer-section-title">
                <span>Tags</span>
              </div>

              <div className="task-tag-picker">
                {tagOptions.length === 0 && (
                  <p className="task-empty-hint">Aucun tag disponible.</p>
                )}

                {tagOptions.map((tag) => {
                  const selected = tagIds.includes(tag.id);

                  return (
                    <button
                      type="button"
                      key={tag.id}
                      className="task-tag-option task-tag-option-colored"
                      style={{
                        backgroundColor: tag.color,
                        borderColor: tag.color,
                        boxShadow: selected
                          ? "0 0 0 2px rgba(0,0,0,0.22)"
                          : "none",
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="task-form-section">
              <div className="supplier-drawer-section-title">
                <span>Documents</span>
              </div>

              <label className="task-dropzone">
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setFiles((current) => [
                      ...current,
                      ...Array.from(e.target.files ?? []),
                    ])
                  }
                />
                Déposer un fichier ici ou <span>parcourir</span>
              </label>

              {files.length > 0 && (
                <div className="task-chip-list" style={{ marginTop: 12 }}>
                  {files.map((file, index) => (
                    <span className="task-chip" key={`${file.name}-${index}`}>
                      {file.name}
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                        aria-label={`Retirer ${file.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="measure-drawer-footer">
            

            <button
              type="button"
              className="measure-primary-button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, false)}
            >
              <Plus size={16} />
              {submitting ? "Création..." : "Créer la tâche"}
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}

export default TaskCreatePage;


