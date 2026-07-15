import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  CirclePlus,
  MapPin,
  PackagePlus,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  deleteSparePart,
  getSpareParts,
} from "../../services/sparePartService";

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

function SparePartsPage() {
  const navigate = useNavigate();

  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadSpareParts(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const data = await getSpareParts();
      setSpareParts(data);
    } catch {
      setError("Impossible de charger les pièces détachées.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSpareParts();
  }, []);

  const filteredSpareParts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return spareParts;
    }

    return spareParts.filter((part) =>
      [
        part.name,
        part.code,
        part.articleCode,
        part.brand,
        part.manufacturerReference,
        part.location,
        part.costCenterId,
      ]
        .filter(Boolean)
        .some((field) =>
          String(field).toLowerCase().includes(value),
        ),
    );
  }, [spareParts, search]);

  async function handleDelete(part: SparePart): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer la pièce détachée "${part.name}" ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(part.id);
      await deleteSparePart(part.id);

      setSpareParts((currentParts) =>
        currentParts.filter((item) => item.id !== part.id),
      );
    } catch {
      setError("Impossible de supprimer cette pièce détachée.");
    } finally {
      setDeletingId(null);
    }
  }

  function getStockStatus(part: SparePart): "low" | "ok" | "high" {
  if (part.quantity < part.minimumStock) {
    return "low";
  }

  if (part.quantity > part.maximumStock) {
    return "high";
  }

  return "ok";
}

function getStockDotClass(part: SparePart): string {
  const status = getStockStatus(part);

  return `spare-stock-dot spare-stock-dot-${status}`;
}

  return (
    <section className="suppliers-workspace">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <Boxes size={28} />
            <h1>Pièces détachées</h1>
          </div>
        </div>

        <button
          type="button"
          className="supplier-primary-button"
          onClick={() => navigate("/admin/spare-parts/create")}
        >
          <CirclePlus size={19} />
          Ajouter une pièce détachée
        </button>
      </div>

      {error && (
        <div className="supplier-error-message">
          {error}
        </div>
      )}

      <div className="supplier-search-bar">
        <Search size={18} />

        <input
          type="search"
          placeholder="Rechercher une pièce détachée..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="supplier-loading">
          Chargement des pièces détachées...
        </div>
      ) : (
        <div className="supplier-table-wrapper">
          <table className="supplier-table">
            <thead>
              <tr>
                <th>Pièce détachée</th>
                <th>Code</th>
                <th>Stock</th>
                <th>Emplacement</th>
                <th>Prix</th>
              <th className="supplier-actions-header">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSpareParts.map((part) => (
                <tr
                  key={part.id}
                  className="supplier-clickable-row"
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/admin/spare-parts/${part.id}`)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      navigate(`/admin/spare-parts/${part.id}`);
                    }
                  }}
                >
                  <td>
                    <div className="supplier-name-cell">
                      <div className="supplier-avatar">
                        {part.image ? (
                          <img src={getImageUrl(part.image) ?? ""} alt={part.name} />
                        ) : (
                          <PackagePlus size={20} />
                        )}
                      </div>

                      <div>
                        <strong>{part.name}</strong>
                        <span>
                          {part.brand || "Marque non définie"}
                          {part.manufacturerReference
                            ? ` - Réf. ${part.manufacturerReference}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>{part.code || "-"}</td>

                <td>
  <div className="spare-stock-hover">
    <span className="spare-stock-trigger">
      <span className={getStockDotClass(part)} />
      {part.quantity}
    </span>

    <div className="spare-stock-popover">
      <span>Détail du stock</span>

      <div className="spare-stock-bar">
        <div className="spare-stock-danger" />
        <div className="spare-stock-ok">
          {getStockStatus(part) === "ok" ? part.quantity : ""}
        </div>
        <div className="spare-stock-warning">
          {getStockStatus(part) === "high" ? part.quantity : ""}
        </div>
      </div>

      <div className="spare-stock-values">
        <span>0</span>
        <span>{part.minimumStock}</span>
        <span>{part.maximumStock}</span>
      </div>
    </div>
  </div>
</td>

                  <td>
                    <span className="supplier-contact-cell">
                      <MapPin size={16} />
                      {part.location || "-"}
                    </span>
                  </td>

                  <td>
                    {part.unitPrice} {part.currency}
                  </td>

                  
                  <td>
                    <div className="supplier-row-actions">
                      <button
                        type="button"
                        className="supplier-edit-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/admin/spare-parts/${part.id}/edit`);
                        }}
                        title="Modifier"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="supplier-delete-button"
                        disabled={deletingId === part.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(part);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSpareParts.length === 0 && (
                <tr>
                  <td colSpan={7} className="supplier-empty-row">
                    Aucune pièce détachée trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default SparePartsPage;
