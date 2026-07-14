import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Building2,
  ImagePlus,
  Save,
  X,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createSupplier,
  getSupplierById,
  updateSupplier,
} from "../../services/supplierService";

import type { SupplierRequest } from "../../types/supplier";

const emptyForm: SupplierRequest = {
  name: "",
  description: "",
  email: "",
  website: "",
  sirenOrSiret: "",
  reference: "",
  phone: "",
  fax: "",
  address: "",
  postalCode: "",
  city: "",
  country: "",
  visibility: "PRIVATE",
  logoUrl: "",
};

function SupplierFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [form, setForm] = useState<SupplierRequest>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSupplier(): Promise<void> {
      if (!id) {
        return;
      }

      try {
        setPageLoading(true);

        const supplier = await getSupplierById(Number(id));

        setForm({
          name: supplier.name,
          description: supplier.description ?? "",
          email: supplier.email,
          website: supplier.website ?? "",
          sirenOrSiret: supplier.sirenOrSiret ?? "",
          reference: supplier.reference ?? "",
          phone: supplier.phone ?? "",
          fax: supplier.fax ?? "",
          address: supplier.address ?? "",
          postalCode: supplier.postalCode ?? "",
          city: supplier.city ?? "",
          country: supplier.country ?? "",
          visibility: supplier.visibility,
          logoUrl: supplier.logoUrl ?? "",
        });
      } catch {
        setError("Impossible de charger le fournisseur.");
      } finally {
        setPageLoading(false);
      }
    }

    void loadSupplier();
  }, [id]);

  function updateField(
    field: keyof SupplierRequest,
    value: string,
  ): void {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }

    if (!form.email.trim()) {
      setError("L'email est obligatoire.");
      return;
    }

    try {
      setLoading(true);

      const request: SupplierRequest = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        description: form.description.trim(),
        website: form.website.trim(),
        sirenOrSiret: form.sirenOrSiret.trim(),
        reference: form.reference.trim(),
        phone: form.phone.trim(),
        fax: form.fax.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        logoUrl: form.logoUrl.trim(),
      };

      if (isEditMode && id) {
        await updateSupplier(Number(id), request, logoFile);
      } else {
        await createSupplier(request, logoFile);
      }

      navigate("/admin/suppliers", {
        replace: true,
      });
    } catch {
      setError(
        isEditMode
          ? "Impossible de modifier le fournisseur."
          : "Impossible de creer le fournisseur.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="supplier-modal-page">
      <button
        type="button"
        className="supplier-form-backdrop"
        aria-label="Retour aux fournisseurs"
        onClick={() => navigate("/admin/suppliers")}
      />

      <aside className="supplier-form-drawer">
        {pageLoading ? (
          <div className="measure-loading">
            Chargement du formulaire...
          </div>
        ) : (
          <form
            className="measure-drawer-content"
            onSubmit={handleSubmit}
          >
            <div className="measure-drawer-header">
              <button
                type="button"
                className="measure-drawer-back"
                onClick={() => navigate("/admin/suppliers")}
                aria-label="Retour aux fournisseurs"
              >
                <ArrowLeft size={22} />
              </button>

              <h2>
                {isEditMode
                  ? "Modifier le fournisseur"
                  : "Creer un fournisseur"}
              </h2>

              <button
                type="button"
                className="measure-drawer-close"
                onClick={() => navigate("/admin/suppliers")}
                aria-label="Fermer"
              >
                <X size={21} />
              </button>
            </div>

            <div className="measure-drawer-body">
              {error && (
                <div className="measure-form-error">
                  {error}
                </div>
              )}

              <div className="supplier-drawer-section-title">
                <Building2 size={19} />
                <span>Informations generales</span>
              </div>

              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label htmlFor="supplier-name">
                    Nom <span>*</span>
                  </label>
                  <input
                    id="supplier-name"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="supplier-email">
                    Email <span>*</span>
                  </label>
                  <input
                    id="supplier-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="supplier-website">
                    Site web
                  </label>
                  <input
                    id="supplier-website"
                    value={form.website}
                    onChange={(event) =>
                      updateField("website", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="supplier-siren">
                    SIREN ou SIRET
                  </label>
                  <input
                    id="supplier-siren"
                    value={form.sirenOrSiret}
                    onChange={(event) =>
                      updateField("sirenOrSiret", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="supplier-reference">
                    Reference
                  </label>
                  <input
                    id="supplier-reference"
                    value={form.reference}
                    onChange={(event) =>
                      updateField("reference", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="supplier-phone">
                    Telephone
                  </label>
                  <input
                    id="supplier-phone"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="supplier-fax">
                    Fax
                  </label>
                  <input
                    id="supplier-fax"
                    value={form.fax}
                    onChange={(event) =>
                      updateField("fax", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="supplier-country">
                    Pays
                  </label>
                  <input
                    id="supplier-country"
                    value={form.country}
                    onChange={(event) =>
                      updateField("country", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="supplier-city">
                    Ville
                  </label>
                  <input
                    id="supplier-city"
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="supplier-postal-code">
                    Code postal
                  </label>
                  <input
                    id="supplier-postal-code"
                    value={form.postalCode}
                    onChange={(event) =>
                      updateField("postalCode", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="measure-form-group">
                <label htmlFor="supplier-address">
                  Adresse
                </label>
                <input
                  id="supplier-address"
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                />
              </div>

              <div className="measure-form-group">
                <label htmlFor="supplier-logo">
                  Logo
                </label>
                <label className="asset-image-picker" htmlFor="supplier-logo">
                  <ImagePlus size={30} />
                  <strong>
                    {logoFile?.name || form.logoUrl || "Choisir une image"}
                  </strong>
                  <input
                    id="supplier-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setLogoFile(file);
                      if (file) {
                        updateField("logoUrl", file.name);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="measure-form-group">
                <label htmlFor="supplier-description">
                  Description
                </label>
                <div className="measure-editor">
                  <div className="measure-editor-toolbar">
                    <span>Apercu</span>
                    <strong>B</strong>
                    <em>I</em>
                    <span>/</span>
                    <span>=</span>
                  </div>
                  <textarea
                    id="supplier-description"
                    rows={6}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="measure-drawer-footer">
              <button
                type="button"
                className="measure-cancel-button"
                onClick={() => navigate("/admin/suppliers")}
                disabled={loading}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="measure-primary-button"
                disabled={loading}
              >
                <Save size={19} />
                {loading
                  ? "Enregistrement..."
                  : isEditMode
                    ? "Enregistrer"
                    : "Creer le fournisseur"}
              </button>
            </div>
          </form>
        )}
      </aside>
    </section>
  );
}

export default SupplierFormPage;
