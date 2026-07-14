import {
  useEffect,
  useState,
} from "react";

import {
  BadgeCheck,
  Boxes,
  CircleDollarSign,
  FileText,
  Hash,
  Layers,
  MapPin,
  PackagePlus,
  Shield,
  Tag,
} from "lucide-react";

import {
  useParams,
} from "react-router-dom";

import { getSparePartById } from "../../services/sparePartService";

import type { SparePart } from "../../types/sparePart";

const BACKEND_URL = "http://localhost:8090";

function getImageUrl(imagePath: string | null | undefined): string | null {
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

  return `${BACKEND_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}

function displayValue(value: string | null): string {
  return value && value.trim() ? value : "-";
}

function displayNumber(value: number | null): string {
  return value === null || value === undefined ? "-" : String(value);
}

function SparePartDetailsPage() {
  const { id } = useParams();

  const [sparePart, setSparePart] = useState<SparePart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <div className="supplier-loading">
          Chargement de la pièce détachée...
        </div>
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

  return (
    <section className="supplier-detail-workspace">
      <div className="supplier-detail-header">
        <div className="supplier-detail-title">
          <Boxes size={22} />

          <h1>{sparePart.name}</h1>

          <span className="supplier-partner-badge">
            <BadgeCheck size={14} />
            Pièce détachée
          </span>
        </div>
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
              src={getImageUrl(sparePart.image) ?? ""}
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
              <strong>
                {sparePart.visibility === "PRIVATE" ? "Privé" : "Public"}
              </strong>
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
              <strong>{displayValue(sparePart.costCenterId != null ? String(sparePart.costCenterId) : null)}</strong>
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
              <p>
                {sparePart.description?.trim() ||
                  "Aucune description renseignée."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SparePartDetailsPage;
