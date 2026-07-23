import { useEffect, useState } from "react";

import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Boxes,
  CircleDollarSign,
  FileText,
  Hash,
  Layers,
  MapPin,
  PackagePlus,
  Search,
  Shield,
  Tag,
} from "lucide-react";

import { Link, useParams, useSearchParams } from "react-router-dom";

import { getSparePartById } from "../../services/sparePartService";

import type { SparePart } from "../../types/sparePart";

import "./task-styles.css";

const BACKEND_URL = "http://localhost:8090";

type UploadFolder = "equipment" | "spare-parts";

function getImageUrl(
  imagePath: string | null | undefined,
  folder: UploadFolder,
): string | null {
  if (!imagePath) {
    return null;
  }

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("blob:")
  ) {
    return imagePath;
  }

  if (imagePath.startsWith("/uploads/") || imagePath.startsWith("uploads/")) {
    return `${BACKEND_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
  }

  if (imagePath.includes("/")) {
    return `${BACKEND_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
  }

  return `${BACKEND_URL}/uploads/${folder}/${imagePath}`;
}

function displayValue(value: string | null): string {
  return value && value.trim() ? value : "-";
}

function displayNumber(value: number | null): string {
  return value === null || value === undefined ? "-" : String(value);
}

function SparePartDetailsPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const equipmentId = searchParams.get("equipmentId");
  const backTarget =
    from === "equipment" && equipmentId
      ? {
          label: "Retour à l'équipement",
          path: `/admin/equipment/${equipmentId}`,
        }
      : {
          label: "Retour aux pièces détachées",
          path: "/admin/spare-parts",
        };

  const [sparePart, setSparePart] = useState<SparePart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeLinkedTab, setActiveLinkedTab] = useState<
    "equipment" | "spare-parts"
  >("equipment");

  useEffect(() => {
    async function loadSparePart(): Promise<void> {
      if (!id) {
        setError("Pièce détachée introuvable.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getSparePartById(Number(id));
        setSparePart(data);
      } catch {
        setError("Impossible de charger cette pièce détachée.");
      } finally {
        setLoading(false);
      }
    }

    void loadSparePart();
  }, [id]);

  if (loading) {
    return (
      <section className="supplier-detail-workspace">
        <div className="supplier-loading">Chargement de la pièce détachée...</div>
      </section>
    );
  }

  if (error || !sparePart) {
    return (
      <section className="supplier-detail-workspace">
        <div className="supplier-error-message">
          {error || "Pièce détachée introuvable."}
        </div>
      </section>
    );
  }

  const linkedEquipments = sparePart.linkedEquipments ?? [];
  const linkedSpareParts = sparePart.linkedSpareParts ?? [];

  return (
    <section className="supplier-detail-workspace">
      <div className="supplier-detail-header spare-detail-header-actions">
        <div className="supplier-detail-title">
          <Boxes size={22} />

          <h1>{sparePart.name}</h1>

          <span className="supplier-partner-badge">
            <BadgeCheck size={14} />
            Pièce détachée
          </span>
        </div>

        <Link to={backTarget.path} className="equipment-primary-button">
          <ArrowLeft size={17} />
          {backTarget.label}
        </Link>
      </div>

      <div className="supplier-detail-tabs">
        <button type="button" className="supplier-detail-tab-active">
          Détails
        </button>
      </div>

      <div className="supplier-detail-content">
        <div className="supplier-detail-logo-panel">
          {sparePart.image ? (
            <img
              src={getImageUrl(sparePart.image, "spare-parts") ?? ""}
              alt={sparePart.name}
              className="supplier-detail-logo"
            />
          ) : (
            <div className="supplier-detail-logo-placeholder">
              <PackagePlus size={95} />
              <span>{sparePart.name}</span>
            </div>
          )}
        </div>

        <div className="supplier-detail-info-grid">
          <div className="supplier-detail-info-item">
            <Hash size={18} />
            <div>
              <span>Code</span>
              <strong>{displayValue(sparePart.code)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Tag size={18} />
            <div>
              <span>Code article</span>
              <strong>{displayValue(sparePart.articleCode)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Layers size={18} />
            <div>
              <span>Quantité</span>
              <strong>{displayNumber(sparePart.quantity)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <CircleDollarSign size={18} />
            <div>
              <span>Prix unitaire</span>
              <strong>
                {sparePart.unitPrice} {sparePart.currency}
              </strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <MapPin size={18} />
            <div>
              <span>Emplacement</span>
              <strong>{displayValue(sparePart.location)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Shield size={18} />
            <div>
              <span>Visibilité</span>
              <strong>{sparePart.visibility === "PRIVATE" ? "Privé" : "Public"}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Layers size={18} />
            <div>
              <span>Stock minimum</span>
              <strong>{displayNumber(sparePart.minimumStock)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Layers size={18} />
            <div>
              <span>Stock maximum</span>
              <strong>{displayNumber(sparePart.maximumStock)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <PackagePlus size={18} />
            <div>
              <span>Lot de réapprovisionnement</span>
              <strong>{displayNumber(sparePart.reorderQuantity)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <MapPin size={18} />
            <div>
              <span>Centre de coûts</span>
              <strong>
                {displayValue(sparePart.costCenterId != null ? String(sparePart.costCenterId) : null)}
              </strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Tag size={18} />
            <div>
              <span>Marque</span>
              <strong>{displayValue(sparePart.brand)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Tag size={18} />
            <div>
              <span>Référence fabricant</span>
              <strong>{displayValue(sparePart.manufacturerReference)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item supplier-detail-wide">
            <Tag size={18} />
            <div>
              <span>Code GTIN/EAN</span>
              <strong>{displayValue(sparePart.gtin)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item supplier-detail-wide">
            <FileText size={18} />
            <div>
              <span>Description</span>
              <p>{sparePart.description?.trim() || "Aucune description renseignée."}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="spare-detail-linked-panel">
        <div className="spare-detail-linked-tabs">
          <button
            type="button"
            className={activeLinkedTab === "equipment" ? "active" : ""}
            onClick={() => setActiveLinkedTab("equipment")}
          >
            Équipements liés
          </button>

          <button
            type="button"
            className={activeLinkedTab === "spare-parts" ? "active" : ""}
            onClick={() => setActiveLinkedTab("spare-parts")}
          >
            Pièces détachées liées
          </button>
        </div>

        {activeLinkedTab === "equipment" && (
          <div className="spare-detail-tab-body">
            <div className="spare-detail-search">
              <Search size={18} />
              <span>Rechercher le nom ou la description d'un équipement lié</span>
            </div>

            {linkedEquipments.length === 0 ? (
              <p className="spare-detail-empty-line">Aucun équipement lié.</p>
            ) : (
              <div className="spare-detail-linked-list">
                {linkedEquipments.map((equipment) => {
                  const imageUrl = getImageUrl(equipment.image, "equipment");

                  return (
                    <div key={equipment.id} className="spare-detail-linked-row">
                      <div className="spare-detail-linked-thumb">
                        {imageUrl ? (
                          <img src={imageUrl} alt={equipment.name} />
                        ) : (
                          <Boxes size={24} />
                        )}
                      </div>

                      <div className="spare-detail-linked-main">
                        <strong>{equipment.name}</strong>
                        <div className="spare-detail-linked-meta">
                          <span>Code article : Non défini</span>
                          <span>Identifiant : {equipment.id}</span>
                        </div>
                      </div>

                      <Link className="spare-detail-linked-action" to={`/admin/equipment/${equipment.id}?from=spare-parts`}>
                        Voir le détail
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeLinkedTab === "spare-parts" && (
          <div className="spare-detail-tab-body">
            <div className="spare-detail-search">
              <Search size={18} />
              <span>Rechercher par nom, description ou code article</span>
            </div>

            {linkedSpareParts.length === 0 ? (
              <p className="spare-detail-empty-line">Aucune pièce détachée liée.</p>
            ) : (
              <div className="spare-detail-linked-list">
                {linkedSpareParts.map((part) => {
                  const imageUrl = getImageUrl(part.image, "spare-parts");

                  return (
                    <div key={part.id} className="spare-detail-linked-row">
                      <div className="spare-detail-linked-thumb">
                        {imageUrl ? (
                          <img src={imageUrl} alt={part.name} />
                        ) : (
                          <PackagePlus size={24} />
                        )}
                      </div>

                      <div className="spare-detail-linked-main">
                        <strong>{part.name}</strong>
                        <div className="spare-detail-linked-meta">
                          <span>Code article : {part.code || "Non défini"}</span>
                          <span>Identifiant : {part.id}</span>
                        </div>
                      </div>

                      <Link className="spare-detail-linked-action" to={`/admin/spare-parts/${part.id}`}>
                        Voir le détail
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default SparePartDetailsPage;
