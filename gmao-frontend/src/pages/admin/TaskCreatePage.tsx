import {
  ArrowLeft,
  CalendarDays,
  Clock,
  FileText,
  Link2,
  Package,
  Plus,
  Tag as TagIcon,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { createTask, fetchOptionList } from "../../services/taskService";

import type {
  AssigneeInput,
  LinkInput,
  SparePartLineInput,
} from "../../types/task";

import "./task-styles.css";

interface OptionItem {
  id: number;
  label: string;
}

function TaskCreatePage() {
  const navigate = useNavigate();

  const [equipmentOnly, setEquipmentOnly] = useState(true);
  const [equipmentId, setEquipmentId] = useState<number | "">("");
  const [description, setDescription] = useState("");

  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [startHour, setStartHour] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endHour, setEndHour] = useState("10:00");

  const [maintenanceHours, setMaintenanceHours] = useState(0);
  const [maintenanceMinutes, setMaintenanceMinutes] = useState(0);
  const [stoppedHours, setStoppedHours] = useState(0);
  const [stoppedMinutes, setStoppedMinutes] = useState(0);

  const [assignees, setAssignees] = useState<
    { key: string; userId?: number; label: string }[]
  >([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [spareLines, setSpareLines] = useState<
    { sparePartId: number; label: string; quantity: number }[]
  >([]);

  const [links, setLinks] = useState<LinkInput[]>([]);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [notify, setNotify] = useState(true);

  const [equipmentOptions, setEquipmentOptions] = useState<OptionItem[]>([]);
  const [tagOptions, setTagOptions] = useState<OptionItem[]>([]);
  const [userOptions, setUserOptions] = useState<OptionItem[]>([]);
  const [sparePartOptions, setSparePartOptions] = useState<OptionItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const [equipmentList, tagList, userList, sparePartList] =
        await Promise.all([
          fetchOptionList("/api/equipment", (e) => e.name),
          fetchOptionList("/api/tags", (t) => t.name),
          fetchOptionList("/api/users", (u) => `${u.firstName} ${u.lastName}`),
          fetchOptionList("/api/spare-parts", (s) => s.name),
        ]);

      setEquipmentOptions(equipmentList);
      setTagOptions(tagList);
      setUserOptions(userList);
      setSparePartOptions(sparePartList);
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

  function addSparePart(sparePartId: number): void {
    const option = sparePartOptions.find(
      (option) => option.id === sparePartId,
    );

    if (
      !option ||
      spareLines.some((line) => line.sparePartId === sparePartId)
    ) {
      return;
    }

    setSpareLines((current) => [
      ...current,
      { sparePartId, label: option.label, quantity: 1 },
    ]);
  }

  function addLink(): void {
    if (!linkName.trim() || !linkUrl.trim()) {
      return;
    }

    setLinks((current) => [
      ...current,
      { name: linkName.trim(), url: linkUrl.trim() },
    ]);
    setLinkName("");
    setLinkUrl("");
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

    const sparePartInputs: SparePartLineInput[] = spareLines.map((line) => ({
      sparePartId: line.sparePartId,
      quantity: line.quantity,
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
          spareParts: sparePartInputs,
          links,
          notifyAssignees: notify,
        },
        files,
      );

      if (createAnother) {
        setDescription("");
        setAssignees([]);
        setSpareLines([]);
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
    <section className="admin-page">
      <button
        type="button"
        className="resource-back-button"
        onClick={() => navigate("/admin/tasks")}
      >
        <ArrowLeft size={16} />
        Retour aux tâches
      </button>

      <div className="resource-form-heading">
        <div className="resource-form-heading-icon">
          <Wrench size={22} />
        </div>

        <div>
          <span className="admin-page-eyebrow">Maintenance</span>
          <h1>Créer une tâche</h1>
          <p>Décrivez l'intervention, planifiez-la et assignez-la.</p>
        </div>
      </div>

      <form className="resource-form-card">
        {/* Search in */}
        <div className="task-form-section">
          <h3 className="task-section-title">
            <Wrench size={16} />
            Rechercher dans
          </h3>

          <label className="task-toggle-row">
            <span>Équipement uniquement</span>
            <input
              type="checkbox"
              checked={equipmentOnly}
              onChange={(e) => setEquipmentOnly(e.target.checked)}
            />
          </label>

          <div className="resource-form-group">
            <label>Équipement *</label>
            <select
              value={equipmentId}
              onChange={(e) =>
                setEquipmentId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Sélectionner un équipement</option>
              {equipmentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="resource-form-group">
            <label>Description de la tâche *</label>
            <textarea
              rows={5}
              placeholder="Décrivez la panne, l'équipement concerné et tout détail utile…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Planning */}
        <div className="task-form-section">
          <h3 className="task-section-title">
            <CalendarDays size={16} />
            Planification
          </h3>

          <label className="task-toggle-row">
            <span>Toute la journée</span>
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
          </label>

          <div className="resource-form-grid">
            <div className="resource-form-group">
              <label>Date de début *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {!allDay && (
              <div className="resource-form-group">
                <label>Heure de début *</label>
                <input
                  type="time"
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                />
              </div>
            )}

            <div className="resource-form-group">
              <label>Date de fin *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {!allDay && (
              <div className="resource-form-group">
                <label>Heure de fin *</label>
                <input
                  type="time"
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="resource-form-grid">
            <div className="resource-form-group">
              <label>Temps de maintenance planifié — heures</label>
              <input
                type="number"
                min={0}
                value={maintenanceHours}
                onChange={(e) =>
                  setMaintenanceHours(Number(e.target.value) || 0)
                }
              />
            </div>

            <div className="resource-form-group">
              <label>Minutes</label>
              <input
                type="number"
                min={0}
                max={59}
                value={maintenanceMinutes}
                onChange={(e) =>
                  setMaintenanceMinutes(Number(e.target.value) || 0)
                }
              />
            </div>

            <div className="resource-form-group">
              <label>Temps d'arrêt planifié — heures</label>
              <input
                type="number"
                min={0}
                value={stoppedHours}
                onChange={(e) => setStoppedHours(Number(e.target.value) || 0)}
              />
            </div>

            <div className="resource-form-group">
              <label>Minutes</label>
              <input
                type="number"
                min={0}
                max={59}
                value={stoppedMinutes}
                onChange={(e) =>
                  setStoppedMinutes(Number(e.target.value) || 0)
                }
              />
            </div>
          </div>
        </div>

        {/* Assignees */}
        <div className="task-form-section">
          <h3 className="task-section-title">
            <Users size={16} />
            Assignés
          </h3>

          <div className="task-chip-list">
            {assignees.length === 0 && (
              <p className="task-empty-hint">Aucun assigné.</p>
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
          <h3 className="task-section-title">
            <TagIcon size={16} />
            Tags
          </h3>

          <div className="task-tag-picker">
            {tagOptions.length === 0 && (
              <p className="task-empty-hint">Aucun tag disponible.</p>
            )}

            {tagOptions.map((tag) => (
              <button
                type="button"
                key={tag.id}
                className={
                  tagIds.includes(tag.id)
                    ? "task-tag-option task-tag-option-active"
                    : "task-tag-option"
                }
                onClick={() => toggleTag(tag.id)}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spare parts */}
        <div className="task-form-section">
          <h3 className="task-section-title">
            <Package size={16} />
            Pièces de rechange à fournir
          </h3>

          <div className="task-chip-list">
            {spareLines.length === 0 && (
              <p className="task-empty-hint">Aucune pièce liée.</p>
            )}

            {spareLines.map((line) => (
              <span className="task-spare-line" key={line.sparePartId}>
                {line.label}

                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    setSpareLines((current) =>
                      current.map((l) =>
                        l.sparePartId === line.sparePartId
                          ? { ...l, quantity: Number(e.target.value) || 1 }
                          : l,
                      ),
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setSpareLines((current) =>
                      current.filter(
                        (l) => l.sparePartId !== line.sparePartId,
                      ),
                    )
                  }
                  aria-label={`Retirer ${line.label}`}
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
              if (e.target.value) addSparePart(Number(e.target.value));
            }}
          >
            <option value="">+ Ajouter une pièce de rechange</option>
            {sparePartOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Documents */}
        <div className="task-form-section">
          <h3 className="task-section-title">
            <FileText size={16} />
            Documents
          </h3>

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

          <div className="task-link-row">
            <Link2 size={16} />
            <input
              type="text"
              placeholder="Nom du lien"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
            />
            <input
              type="text"
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <button type="button" onClick={addLink}>
              Ajouter le lien
            </button>
          </div>

          {links.length > 0 && (
            <div className="task-chip-list" style={{ marginTop: 12 }}>
              {links.map((link, index) => (
                <span className="task-chip" key={`${link.url}-${index}`}>
                  {link.name}
                  <button
                    type="button"
                    onClick={() =>
                      setLinks((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                    aria-label={`Retirer ${link.name}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="task-form-section">
          <label className="task-toggle-row">
            <span>
              <Clock size={16} />
              Notifier les assignés de cette tâche par email
            </span>
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
            />
          </label>

          {error && <div className="resource-error-message">{error}</div>}

          <div className="resource-form-actions">
            <button
              type="button"
              className="resource-cancel-button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, true)}
            >
              Créer et créer une autre
            </button>

            <button
              type="button"
              className="resource-primary-button"
              disabled={submitting}
              onClick={(e) => handleSubmit(e, false)}
            >
              <Plus size={16} />
              {submitting ? "Création…" : "Créer la tâche"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export default TaskCreatePage;
