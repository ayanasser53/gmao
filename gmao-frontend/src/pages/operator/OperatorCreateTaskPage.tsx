import { ArrowLeft, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DocumentAttachmentField from "../../components/admin/DocumentAttachmentField";
import EquipmentSelect from "../../components/admin/EquipmentSelect";
import { getAuthenticatedUserId } from "../../services/authService";
import { getEquipment } from "../../services/equipmentService";
import { createTask } from "../../services/taskService";
import type { Equipment } from "../../types/equipment";
import type { AssigneeInput } from "../../types/task";

import "../admin/task-styles.css";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function OperatorCreateTaskPage() {
  const navigate = useNavigate();
  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([]);
  const [equipmentId, setEquipmentId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setEquipmentOptions(await getEquipment());
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger les equipements.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    if (!equipmentId || !description.trim()) {
      setError("Merci de choisir un equipement et de decrire la tache.");
      return;
    }

    setSubmitting(true);
    setError("");

    const currentUserId = getAuthenticatedUserId();
    const assignees: AssigneeInput[] = currentUserId
      ? [{ userId: currentUserId }]
      : [];
    const date = todayIsoDate();

    try {
      await createTask(
        {
          equipmentOnly: true,
          equipmentId: Number(equipmentId),
          description: description.trim(),
          allDay: true,
          startDate: date,
          startHour: null,
          endDate: date,
          endHour: null,
          plannedMaintenanceHours: 0,
          plannedMaintenanceMinutes: 0,
          plannedStoppedHours: 0,
          plannedStoppedMinutes: 0,
          assignees,
          assignedTo: [],
          tagIds: [],
          spareParts: [],
          links: [],
          notifyAssignees: true,
        },
        files,
      );

      navigate("/operator/tasks");
    } catch (submitError) {
      console.error(submitError);
      setError("La creation de la tache a echoue. Reessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="supplier-modal-page">
      <button
        type="button"
        className="supplier-form-backdrop"
        aria-label="Retour aux taches"
        onClick={() => navigate("/operator/tasks")}
      />

      <aside className="supplier-form-drawer task-form-drawer">
        <form className="measure-drawer-content" onSubmit={handleSubmit}>
          <div className="measure-drawer-header">
            <button
              type="button"
              className="measure-drawer-back"
              onClick={() => navigate("/operator/tasks")}
              aria-label="Retour aux taches"
            >
              <ArrowLeft size={22} />
            </button>

            <h2>Creer une tache</h2>

            <button
              type="button"
              className="measure-drawer-close"
              onClick={() => navigate("/operator/tasks")}
              aria-label="Fermer"
            >
              <X size={21} />
            </button>
          </div>

          <div className="measure-drawer-body">
            {error && <div className="measure-form-error">{error}</div>}

            <div className="task-form-section">
              <div className="supplier-drawer-section-title">
                <span>Equipement</span>
              </div>

              <div className="measure-form-group">
                <label>
                  Equipement concerne <span>*</span>
                </label>
                <EquipmentSelect
                  equipmentList={equipmentOptions}
                  value={equipmentId}
                  onSelect={(equipment) => setEquipmentId(equipment.id)}
                />
              </div>
            </div>

            <div className="task-form-section">
              <div className="supplier-drawer-section-title">
                <span>Observation</span>
              </div>

              <div className="measure-form-group">
                <label>
                  Description de la tache <span>*</span>
                </label>
                <textarea
                  rows={6}
                  placeholder="Ex : bruit anormal, arret machine, fuite, voyant rouge..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </div>

            <div className="task-form-section">
              <DocumentAttachmentField
                files={files}
                setFiles={setFiles}
                title="Photos et documents"
              />
            </div>
          </div>

          <div className="measure-drawer-footer">
            <button
              type="button"
              className="measure-cancel-button"
              disabled={submitting}
              onClick={() => navigate("/operator/tasks")}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="measure-primary-button"
              disabled={loading || submitting}
            >
              <Send size={18} />
              {submitting ? "Creation..." : "Creer la tache"}
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}

export default OperatorCreateTaskPage;
