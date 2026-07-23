import {
  ArrowLeft,
  Camera,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  MapPin,
  Package,
  Tag as TagIcon,
  Wrench,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { getEquipmentById } from "../../services/equipmentService";
import { getMaintenancePlans } from "../../services/maintenancePlanService";
import {
  readEquipmentDocuments,
  type StoredEquipmentDocument,
} from "../../utils/equipmentDocuments";

import type { Equipment } from "../../types/equipment";

const BACKEND_URL = "http://localhost:8090";

type UploadFolder = "equipment" | "spare-parts";

type DetailTab =
  | "linked-equipment"
  | "linked-spare-parts";

function getDocumentExtension(document: StoredEquipmentDocument): string {
  return document.name.split(".").pop()?.toLowerCase() ?? "";
}

function isPdfDocument(document: StoredEquipmentDocument): boolean {
  return document.type === "application/pdf" || getDocumentExtension(document) === "pdf";
}

function isImageDocument(document: StoredEquipmentDocument): boolean {
  return document.isPhoto || document.type.startsWith("image/");
}

function isTextDocument(document: StoredEquipmentDocument): boolean {
  return document.type.startsWith("text/") || ["txt", "csv"].includes(getDocumentExtension(document));
}

function getFileUrl(
  path: string | null | undefined,
  folder?: UploadFolder,
): string | null {
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

  if (path.startsWith("/uploads/") || path.startsWith("uploads/") || path.includes("/")) {
    return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }

  if (folder) {
    return `${BACKEND_URL}/uploads/${folder}/${path}`;
  }

  return `${BACKEND_URL}/${path}`;
}

function EquipmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("from");
  const backTarget =
    source === "activities"
      ? { label: "Retour aux activités", path: "/admin/activities" }
      : source === "tasks"
      ? { label: "Retour aux tâches", path: "/admin/tasks" }
      : source === "spare-parts"
      ? { label: "Retour aux pièces détachées", path: "/admin/spare-parts" }
      : { label: "Retour aux équipements", path: "/admin/equipment" };

  const [equipment, setEquipment] =
    useState<Equipment | null>(null);
  const [activeTab, setActiveTab] =
    useState<DetailTab>("linked-equipment");
  const [equipmentDocuments, setEquipmentDocuments] =
    useState<StoredEquipmentDocument[]>([]);
  const [selectedDocumentIndex, setSelectedDocumentIndex] =
    useState<number | null>(null);
  const [loading, setLoading] =
    useState<boolean>(true);
  const [error, setError] =
    useState<string>("");
  const [maintenancePlanSparePartIds, setMaintenancePlanSparePartIds] =
    useState<Set<number>>(new Set());

  useEffect(() => {
    async function loadEquipment(): Promise<void> {
      if (!id || Number.isNaN(Number(id))) {
        setError("Identifiant d'équipement invalide.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const equipmentId = Number(id);
        const [data, maintenancePlans] = await Promise.all([
          getEquipmentById(equipmentId),
          getMaintenancePlans().catch(() => []),
        ]);

        const maintenanceSparePartIds = new Set(
          maintenancePlans
            .filter((plan) => plan.equipmentId === equipmentId)
            .flatMap((plan) =>
              (plan.spareParts ?? []).map((part) => part.sparePartId),
            ),
        );

        setEquipment(data);
        setEquipmentDocuments(readEquipmentDocuments(equipmentId));
        setMaintenancePlanSparePartIds(maintenanceSparePartIds);
        setActiveTab("linked-equipment");
      } catch (requestError) {
        console.error(
          "Erreur chargement équipement :",
          requestError,
        );

        setError(
          "Impossible de charger les informations de l'équipement.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadEquipment();
  }, [id]);

  if (loading) {
    return (
      <div className="equipment-detail-state">
        Chargement de l'équipement...
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="equipment-detail-state">
        <p>
          {error || "Équipement introuvable."}
        </p>

        <button
          type="button"
          className="equipment-primary-button"
          onClick={() => navigate(backTarget.path)}
        >
          {backTarget.label}
        </button>
      </div>
    );
  }

  const imageUrl = getFileUrl(equipment.image, "equipment");
  const linkedEquipment = equipment.linkedEquipment ?? [];
  const linkedSpareParts = (equipment.linkedSpareParts ?? []).filter(
    (part) => !maintenancePlanSparePartIds.has(part.id),
  );
  const tags = equipment.tags ?? [];
  const selectedDocument =
    selectedDocumentIndex !== null
      ? equipmentDocuments[selectedDocumentIndex] ?? null
      : null;

  function openDocumentPreview(documentId: string): void {
    const documentIndex = equipmentDocuments.findIndex(
      (document) => document.id === documentId,
    );

    if (documentIndex >= 0) {
      setSelectedDocumentIndex(documentIndex);
    }
  }

  function showPreviousDocument(): void {
    setSelectedDocumentIndex((current) => {
      if (current === null || equipmentDocuments.length === 0) {
        return current;
      }

      return current === 0 ? equipmentDocuments.length - 1 : current - 1;
    });
  }

  function showNextDocument(): void {
    setSelectedDocumentIndex((current) => {
      if (current === null || equipmentDocuments.length === 0) {
        return current;
      }

      return current === equipmentDocuments.length - 1 ? 0 : current + 1;
    });
  }

  return (
    <section className="equipment-detail-page">
      <div className="equipment-detail-header">
        <button
          type="button"
          className="equipment-detail-back"
          onClick={() => navigate(backTarget.path)}
          aria-label={backTarget.label}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="equipment-detail-title">
          <span className="admin-page-eyebrow">
            Fiche équipement
          </span>

          <h1>{equipment.name}</h1>
        </div>

        <Link
          to={backTarget.path}
          className="equipment-primary-button"
        >
          <ArrowLeft size={17} />
          {backTarget.label}
        </Link>
      </div>

      <div className="equipment-detail-summary">
        <div className="equipment-detail-main-card">
          <div className="equipment-detail-image">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={equipment.name}
              />
            ) : (
              <Wrench size={58} />
            )}
          </div>

          <div className="equipment-detail-information">
            <div className="equipment-detail-description">
              <span className="equipment-detail-label">
                Description
              </span>

              <p>
                {equipment.description ||
                  "Aucune description renseignée."}
              </p>
            </div>

            <div className="equipment-detail-data-grid">
              <div className="equipment-detail-data-card">
                <MapPin size={20} />

                <div>
                  <span>Centre de coût</span>

                  <strong>
                    {equipment.costCenterName || "Non défini"}
                  </strong>
                </div>
              </div>

              <div className="equipment-detail-data-card">
                <Package size={20} />

                <div>
                  <span>Code article</span>

                  <strong>
                    {equipment.itemCode || "-"}
                  </strong>
                </div>
              </div>

              <div className="equipment-detail-data-card">
                <CalendarDays size={20} />

                <div>
                  <span>GTIN/EAN</span>

                  <strong>
                    {equipment.gtinEanCode || "-"}
                  </strong>
                </div>
              </div>
            </div>

            <div>
              <span className="equipment-detail-label">
                Tags
              </span>

              <div className="equipment-detail-tags">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag.id}
                      style={{
                        backgroundColor: tag.color || "#7d8793",
                      }}
                    >
                      <TagIcon size={14} />
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <p className="equipment-detail-muted">
                    Aucun tag associé.
                  </p>
                )}
              </div>
            </div>

            <div className="equipment-detail-documents">
              <span className="equipment-detail-label">
                Documents et photos
              </span>

              {equipmentDocuments.length > 0 ? (
                <div className="equipment-documents-list">
                  {equipmentDocuments.map((document) => (
                    <span
                      key={document.id}
                      className={`equipment-document-chip ${
                        isPdfDocument(document)
                          ? "equipment-document-chip-pdf"
                          : isImageDocument(document)
                          ? "equipment-document-chip-image"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="equipment-document-open"
                        onClick={() => openDocumentPreview(document.id)}
                      >
                        {document.isPhoto ? (
                          <Camera size={16} />
                        ) : (
                          <FileText size={16} />
                        )}
                        <span>{document.name}</span>
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="equipment-detail-muted">
                  Aucun document ou photo associé.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="equipment-detail-tabs">
        <button
          type="button"
          className={
            activeTab === "linked-equipment"
              ? "equipment-detail-tab-active"
              : ""
          }
          onClick={() => setActiveTab("linked-equipment")}
        >
          Équipements liés
          <span>{linkedEquipment.length}</span>
        </button>

        <button
          type="button"
          className={
            activeTab === "linked-spare-parts"
              ? "equipment-detail-tab-active"
              : ""
          }
          onClick={() => setActiveTab("linked-spare-parts")}
        >
          Pièces liées
          <span>{linkedSpareParts.length}</span>
        </button>
      </div>

      <div className="equipment-detail-tab-content">
        {activeTab === "linked-equipment" && (
          <div className="linked-compact-list">
            {linkedEquipment.length > 0 ? (
              linkedEquipment.map((linked) => (
                <button
                  type="button"
                  key={linked.id}
                  className="linked-compact-row"
                  onClick={() => navigate(`/admin/equipment/${linked.id}`)}
                >
                  <div className="linked-compact-icon">
                    {getFileUrl(linked.image, "equipment") ? (
                      <img
                        src={getFileUrl(linked.image, "equipment") ?? ""}
                        alt={linked.name}
                      />
                    ) : (
                      <Wrench size={22} />
                    )}
                  </div>

                  <div className="linked-compact-content">
                    <strong>{linked.name}</strong>

                    <div className="linked-compact-meta">
                      <span>
                        Code article : {linked.itemCode || "Non défini"}
                      </span>

                      <span>Identifiant : {linked.id}</span>
                    </div>
                  </div>

                  <div className="linked-compact-action">
                    <span>Voir le détail</span>
                    <ChevronRight size={18} />
                  </div>
                </button>
              ))
            ) : (
              <div className="equipment-detail-empty">
                Aucun équipement lié.
              </div>
            )}
          </div>
        )}

        {activeTab === "linked-spare-parts" && (
          <div className="linked-compact-list">
            {linkedSpareParts.length > 0 ? (
              linkedSpareParts.map((part) => (
                <button
                  type="button"
                  key={part.id}
                  className="linked-compact-row"
                  onClick={() =>
                    navigate(`/admin/spare-parts/${part.id}?from=equipment&equipmentId=${equipment.id}`)
                  }
                >
                  <div className="linked-compact-icon">
                    {getFileUrl(part.imageUrl, "spare-parts") ? (
                      <img
                        src={getFileUrl(part.imageUrl, "spare-parts") ?? ""}
                        alt={part.name}
                      />
                    ) : (
                      <Package size={22} />
                    )}
                  </div>

                  <div className="linked-compact-content">
                    <strong>{part.name}</strong>

                    <div className="linked-compact-meta">
                      <span>Code : {part.code || "Non défini"}</span>

                      <span>Quantité en stock : {part.quantity ?? 0}</span>
                    </div>
                  </div>

                  <div className="linked-compact-action">
                    <span>Voir le détail</span>
                    <ChevronRight size={18} />
                  </div>
                </button>
              ))
            ) : (
              <div className="equipment-detail-empty">
                Aucune pièce de rechange liée.
              </div>
            )}
          </div>
        )}
      </div>

      {selectedDocument && (
        <div
          className="maintenance-photo-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu des documents"
        >
          <div className="maintenance-photo-preview">
            <div className="maintenance-photo-preview-header">
              <div>
                <strong>{selectedDocument.name}</strong>
                <span>
                  {selectedDocumentIndex! + 1} /{" "}
                  {equipmentDocuments.length}
                </span>
              </div>

              <div className="maintenance-document-preview-actions">
                <a
                  href={selectedDocument.dataUrl}
                  download={selectedDocument.name}
                  className="maintenance-document-download"
                  aria-label={`Télécharger ${selectedDocument.name}`}
                >
                  <Download size={18} />
                  Télécharger
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedDocumentIndex(null)}
                  aria-label="Fermer l'aperçu"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="maintenance-photo-preview-body">
              {equipmentDocuments.length > 1 && (
                <button
                  type="button"
                  className="maintenance-photo-preview-nav previous"
                  onClick={showPreviousDocument}
                  aria-label="Document précédent"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              {isImageDocument(selectedDocument) ? (
                <img
                  src={selectedDocument.dataUrl}
                  alt={selectedDocument.name}
                />
              ) : isPdfDocument(selectedDocument) ? (
                <iframe
                  src={selectedDocument.dataUrl}
                  title={selectedDocument.name}
                />
              ) : isTextDocument(selectedDocument) ? (
                <iframe
                  src={selectedDocument.dataUrl}
                  title={selectedDocument.name}
                />
              ) : (
                <div className="maintenance-document-preview-empty">
                  <FileText size={44} />
                  <strong>{selectedDocument.name}</strong>
                  <span>
                    Ce format ne peut pas être affiché directement dans le
                    navigateur.
                  </span>
                  <a
                    href={selectedDocument.dataUrl}
                    download={selectedDocument.name}
                  >
                    Télécharger
                  </a>
                </div>
              )}

              {equipmentDocuments.length > 1 && (
                <button
                  type="button"
                  className="maintenance-photo-preview-nav next"
                  onClick={showNextDocument}
                  aria-label="Document suivant"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default EquipmentDetailsPage;





