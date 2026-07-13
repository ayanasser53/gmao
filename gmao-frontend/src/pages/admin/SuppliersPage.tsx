import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  CirclePlus,
  Globe2,
  Mail,
  Pencil,
  Phone,
  Search,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  deleteSupplier,
  getSuppliers,
} from "../../services/supplierService";

import type { Supplier } from "../../types/supplier";

function SuppliersPage() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadSuppliers(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const data = await getSuppliers();
      setSuppliers(data);
    } catch {
      setError("Impossible de charger les fournisseurs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const filteredSuppliers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return suppliers;
    }

    return suppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.email,
        supplier.reference,
        supplier.phone,
        supplier.city,
        supplier.country,
      ]
        .filter(Boolean)
        .some((field) =>
          field!.toLowerCase().includes(value),
        ),
    );
  }, [suppliers, search]);

  async function handleDelete(supplier: Supplier): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer le fournisseur "${supplier.name}" ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(supplier.id);
      await deleteSupplier(supplier.id);

      setSuppliers((currentSuppliers) =>
        currentSuppliers.filter((item) => item.id !== supplier.id),
      );
    } catch {
      setError("Impossible de supprimer ce fournisseur.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="suppliers-workspace">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <Building2 size={28} />
            <h1>Fournisseurs</h1>
          </div>
        </div>

        <button
          type="button"
          className="supplier-primary-button"
          onClick={() => navigate("/admin/suppliers/create")}
        >
          <CirclePlus size={19} />
          Ajouter un fournisseur
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
          placeholder="Rechercher un fournisseur..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <div className="supplier-loading">
          Chargement des fournisseurs...
        </div>
      ) : (
        <div className="supplier-table-wrapper">
          <table className="supplier-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Telephone</th>
                <th>Reference</th>
                <th>Ville</th>
                <th>Visibilite</th>
                <th className="supplier-actions-header">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="supplier-clickable-row"
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/admin/suppliers/${supplier.id}`)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      navigate(`/admin/suppliers/${supplier.id}`);
                    }
                  }}
                >
                  <td>
                    <div className="supplier-name-cell">
                      <div className="supplier-avatar">
                        {supplier.logoUrl ? (
                          <img src={supplier.logoUrl} alt={supplier.name} />
                        ) : (
                          <Building2 size={20} />
                        )}
                      </div>

                      <div>
                        <strong>{supplier.name}</strong>
                        <span>
                          {supplier.website || "Site web non defini"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="supplier-contact-cell">
                      <Mail size={16} />
                      {supplier.email}
                    </span>
                  </td>

                  <td>
                    {supplier.phone ? (
                      <span className="supplier-contact-cell">
                        <Phone size={16} />
                        {supplier.phone}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>{supplier.reference || "-"}</td>
                  <td>{supplier.city || "-"}</td>

                  <td>
                    <span
                      className={`supplier-visibility-badge ${
                        supplier.visibility === "PRIVATE"
                          ? "supplier-visibility-private"
                          : "supplier-visibility-public"
                      }`}
                    >
                      {supplier.visibility === "PRIVATE" ? (
                        <Building2 size={14} />
                      ) : (
                        <Globe2 size={14} />
                      )}

                      {supplier.visibility === "PRIVATE"
                        ? "Mon reseau"
                        : "Public"}
                    </span>
                  </td>

                  <td>
                    <div className="supplier-row-actions">
                      <button
                        type="button"
                        className="supplier-edit-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/admin/suppliers/${supplier.id}/edit`);
                        }}
                        title="Modifier"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="supplier-delete-button"
                        disabled={deletingId === supplier.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(supplier);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={7} className="supplier-empty-row">
                    Aucun fournisseur trouve.
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

export default SuppliersPage;
