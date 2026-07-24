import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  Link2,
  MapPin,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  DocumentPreviewModal,
  type PreviewDocument,
} from "../../components/admin/DocumentAttachmentField";
import { getTaskById } from "../../services/taskService";
import type { Task, TaskStatus } from "../../types/task";

import "../admin/task-styles.css";

const BACKEND_URL = "http://localhost:8090";

const TASK_STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  PLANNED: { label: "Planifiee", className: "task-status-planned" },
  IN_PROGRESS: { label: "En cours", className: "task-status-progress" },
  LATE: { label: "En retard", className: "task-status-late" },
  DONE: { label: "Terminee", className: "task-status-done" },
};

function getFileUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "-";
}

function OperatorTaskDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const taskId = Number(id);

  const [task, setTask] = useState<Task | null>(null);
  const [selectedTaskDocumentIndex, setSelectedTaskDocumentIndex] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTask(): Promise<void> {
      if (!Number.isFinite(taskId)) {
        setError("Tache introuvable.");
        setLoading(false);
        return;
      }

      try {
        setTask(await getTaskById(taskId));
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger les details de la tache.");
      } finally {
        setLoading(false);
      }
    }

    void loadTask();
  }, [taskId]);

  const equipmentImage = useMemo(
    () => getFileUrl(task?.equipment?.image),
    [task?.equipment?.image],
  );

  const taskPreviewDocuments = useMemo<PreviewDocument[]>(() => {
    if (!task) {
      return [];
    }

    return task.documents
      .filter((document) => !document.isLink)
      .map((document) => ({
        id: String(document.id),
        name: document.fileName,
        type: document.fileType || "",
        url: getFileUrl(document.filePath) || "",
        previewUrl: getFileUrl(document.previewPath) || null,
        previewType: document.previewType,
      }))
      .filter((document) => Boolean(document.url));
  }, [task]);

  if (loading) {
    return (
      <section className="admin-page">
        <div className="resource-loading">Chargement...</div>
      </section>
    );
  }

  if (error || !task) {
    return (
      <section className="admin-page">
        <div className="resource-error-message">
          {error || "Tache introuvable."}
        </div>
      </section>
    );
  }

  const status = TASK_STATUS_META[task.status];

  return (
    <section className="admin-page task-details-page">
      <div className="details-topbar">
        <button
          type="button"
          className="details-back-button"
          onClick={() => navigate("/operator/tasks")}
          aria-label="Retour aux taches"
        >
          <ArrowLeft size={22} />
        </button>

        <div>
          <div className="details-eyebrow">Fiche tache</div>
          <div className="details-title-row">
            <ClipboardList size={30} />
            <h1>Tache</h1>
            <span className="activity-id-badge">#{task.id}</span>
            <span className={`task-status-badge ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="task-details-grid">
        <div className="task-details-main">
          <article className="details-card task-info-card">
            <div className="task-detail-item">
              <CalendarDays size={21} />
              <div>
                <span>Date planifiee</span>
                <strong>
                  {formatDate(task.startDate)}
                  {task.startHour ? ` a ${formatTime(task.startHour)}` : ""}
                </strong>
              </div>
            </div>

            <div className="task-detail-item">
              <Wrench size={21} />
              <div>
                <span>Equipement concerne</span>
                <strong>{task.equipment?.name || "Non defini"}</strong>
              </div>
            </div>

            <div className="task-detail-item">
              <MapPin size={21} />
              <div>
                <span>Centre de cout</span>
                <strong>{task.costCenterName || "Non defini"}</strong>
              </div>
            </div>

            <div className="task-detail-item task-detail-wide">
              <FileText size={21} />
              <div>
                <span>Description saisie par l'operateur</span>
                <strong>{task.description || "Aucune description renseignee."}</strong>
              </div>
            </div>
          </article>

          <article className="details-card">
            <div className="details-section-header">
              <h2>Documents</h2>
            </div>

            <div className="details-subsection">
              {task.documents.length === 0 ? (
                <p className="task-empty-hint">Aucun document joint.</p>
              ) : (
                <div className="task-linked-list">
                  {task.documents.map((document) => {
                    const previewIndex = taskPreviewDocuments.findIndex(
                      (previewDocument) =>
                        previewDocument.id === String(document.id),
                    );

                    const content = (
                      <>
                        <span className="task-equipment-thumb">
                          {document.isLink ? (
                            <Link2 size={17} />
                          ) : (
                            <FileText size={17} />
                          )}
                        </span>
                        <div>
                          <strong>{document.fileName}</strong>
                          <span>
                            {document.isLink ? "Lien externe" : "Fichier joint"}
                          </span>
                        </div>
                      </>
                    );

                    if (document.isLink) {
                      return (
                        <a
                          key={document.id}
                          className="task-linked-row"
                          href={getFileUrl(document.filePath) ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {content}
                        </a>
                      );
                    }

                    return (
                      <button
                        key={document.id}
                        type="button"
                        className="task-linked-row"
                        disabled={previewIndex < 0}
                        onClick={() =>
                          previewIndex >= 0 &&
                          setSelectedTaskDocumentIndex(previewIndex)
                        }
                      >
                        {content}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </article>
        </div>

        <aside className="task-details-side">
          <article className="details-card">
            <h2>Equipement</h2>

            <div className="task-equipment-summary">
              <span className="task-equipment-thumb task-equipment-thumb-large">
                {equipmentImage ? (
                  <img src={equipmentImage} alt={task.equipment?.name} />
                ) : (
                  <Wrench size={20} />
                )}
              </span>
              <span>
                <em>Nom de l'equipement</em>
                <strong>{task.equipment?.name || "Non defini"}</strong>
              </span>
            </div>

            <div className="task-detail-item">
              <MapPin size={21} />
              <div>
                <span>Code article</span>
                <strong>{task.equipment?.itemCode || "Non defini"}</strong>
              </div>
            </div>

            <div className="task-detail-item">
              <MapPin size={21} />
              <div>
                <span>Centre de cout</span>
                <strong>{task.costCenterName || "Non defini"}</strong>
              </div>
            </div>
          </article>
        </aside>
      </div>

      <DocumentPreviewModal
        documents={taskPreviewDocuments}
        selectedIndex={selectedTaskDocumentIndex}
        onSelectIndex={setSelectedTaskDocumentIndex}
      />
    </section>
  );
}

export default OperatorTaskDetailsPage;
