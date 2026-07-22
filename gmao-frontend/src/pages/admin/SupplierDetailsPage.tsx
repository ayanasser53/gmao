import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  FileText,
  Globe2,
  Hash,
  Mail,
  MapPin,
  Phone,
  Printer,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { getSupplierById } from "../../services/supplierService";

import type { Supplier } from "../../types/supplier";

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

function formatAddress(supplier: Supplier): string {
  return [
    supplier.address,
    supplier.postalCode,
    supplier.city,
    supplier.country,
  ]
    .filter(Boolean)
    .join(" ");
}

function displayValue(value: string | null): string {
  return value && value.trim() ? value : "-";
}

function SupplierDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSupplier(): Promise<void> {
      if (!id) {
        setError("Fournisseur introuvable.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getSupplierById(Number(id));
        setSupplier(data);
      } catch {
        setError("Impossible de charger le fournisseur.");
      } finally {
        setLoading(false);
      }
    }

    void loadSupplier();
  }, [id]);

  if (loading) {
    return (
      <section className="supplier-detail-workspace">
        <div className="supplier-loading">
          Chargement du fournisseur...
        </div>
      </section>
    );
  }

  if (error || !supplier) {
    return (
      <section className="supplier-detail-workspace">
        <div className="supplier-error-message">
          {error || "Fournisseur introuvable."}
        </div>
      </section>
    );
  }

  return (
    <section className="supplier-detail-workspace">
      <div className="supplier-detail-header">
        <div className="supplier-detail-title">
          <Building2 size={22} />

          <h1>{supplier.name}</h1>

          <span className="supplier-partner-badge">
            <BadgeCheck size={14} />
            Partenaire
          </span>
        </div>

        <div className="supplier-detail-actions">
          <button
            type="button"
            className="supplier-detail-back"
            onClick={() => navigate("/admin/suppliers")}
          >
            <ArrowLeft size={17} />
            Retour aux fournisseurs
          </button>
        </div>
      </div>

      <div className="supplier-detail-tabs">
        <button type="button" className="supplier-detail-tab-active">
          Profil
        </button>
      </div>

      <div className="supplier-detail-content">
        <div className="supplier-detail-logo-panel">
          {supplier.logoUrl ? (
            <img
              src={getImageUrl(supplier.logoUrl) ?? ""}
              alt={supplier.name}
              className="supplier-detail-logo"
            />
          ) : (
            <div className="supplier-detail-logo-placeholder">
              <Building2 size={95} />
              <span>{supplier.name}</span>
            </div>
          )}
        </div>

        <div className="supplier-detail-info-grid">
          <div className="supplier-detail-info-item">
            <Hash size={18} />
            <div>
              <span>Reference</span>
              <strong>{displayValue(supplier.reference)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <FileText size={18} />
            <div>
              <span>SIREN ou SIRET</span>
              <strong>{displayValue(supplier.sirenOrSiret)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Phone size={18} />
            <div>
              <span>Telephone</span>
              <strong>{displayValue(supplier.phone)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Printer size={18} />
            <div>
              <span>Fax</span>
              <strong>{displayValue(supplier.fax)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Mail size={18} />
            <div>
              <span>E-mail</span>
              <strong>{supplier.email}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item">
            <Globe2 size={18} />
            <div>
              <span>Site web</span>
              <strong>{displayValue(supplier.website)}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item supplier-detail-wide">
            <MapPin size={18} />
            <div>
              <span>Adresse</span>
              <strong>{displayValue(formatAddress(supplier))}</strong>
            </div>
          </div>

          <div className="supplier-detail-info-item supplier-detail-wide">
            <FileText size={18} />
            <div>
              <span>Description</span>
              <p>
                {supplier.description?.trim() ||
                  "Aucune description renseignee."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SupplierDetailsPage;
