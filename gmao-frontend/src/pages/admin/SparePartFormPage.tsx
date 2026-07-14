import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  ImagePlus,
  PackagePlus,
  Save,
  X,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createSparePart,
  getSparePartById,
  updateSparePart,
} from "../../services/sparePartService";


import { getCostCenters } from "../../services/costCenterService";
import type { CostCenter } from "../../types/costCenter";

import type { SparePartRequest } from "../../types/sparePart";

type SparePartFormState = Omit<SparePartRequest, "costCenterId"> & {
  costCenterId: string;
};

const emptyForm: SparePartFormState = {
  name: "",
  description: "",
  code: "",
  manufacturerReference: "",
  brand: "",
  image: "",
  unitPrice: 0,
  currency: "EUR",
  quantity: 0,
  minimumStock: 0,
  maximumStock: 0,
  reorderQuantity: 1,
  location: "",
  costCenterId: "",
  gtin: "",
  articleCode: "",
  visibility: "PRIVATE",
  supplierId: null,
};

function SparePartFormPage() {

  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [form, setForm] = useState<SparePartFormState>(emptyForm);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [error, setError] = useState("");

  useEffect(() => {
    getCostCenters()
      .then(setCostCenters)
      .catch(() => setCostCenters([]));
  }, []);

  useEffect(() => {
    async function loadSparePart(): Promise<void> {
      if (!id) {
        return;
      }

      try {
        setPageLoading(true);
        setError("");

        const sparePart = await getSparePartById(Number(id));

        setForm({
          name: sparePart.name ?? "",
          description: sparePart.description ?? "",
          code: sparePart.code ?? "",
          manufacturerReference: sparePart.manufacturerReference ?? "",
          brand: sparePart.brand ?? "",
          image: sparePart.image ?? "",
          unitPrice: sparePart.unitPrice ?? 0,
          currency: sparePart.currency ?? "EUR",
          quantity: sparePart.quantity ?? 0,
          minimumStock: sparePart.minimumStock ?? 0,
          maximumStock: sparePart.maximumStock ?? 0,
          reorderQuantity: sparePart.reorderQuantity ?? 1,
          location: sparePart.location ?? "",
          costCenterId: sparePart.costCenterId != null ? String(sparePart.costCenterId) : "",
          gtin: sparePart.gtin ?? "",
          articleCode: sparePart.articleCode ?? "",
          visibility: sparePart.visibility ?? "PRIVATE",
          supplierId: sparePart.supplierId,
        });
      } catch {
        setError("Impossible de charger cette piece detachee.");
      } finally {
        setPageLoading(false);
      }
    }

    void loadSparePart();
  }, [id]);

  function updateField<K extends keyof SparePartFormState>(
    field: K,
    value: SparePartFormState[K],
  ): void {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function updateNumberField(
    field: keyof Pick<
      SparePartFormState,
      | "unitPrice"
      | "quantity"
      | "minimumStock"
      | "maximumStock"
      | "reorderQuantity"
    >,
    value: string,
  ): void {
    updateField(field, Number(value || 0));
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

    try {
      setLoading(true);

      const request: SparePartRequest = {
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        code: form.code.trim(),
        manufacturerReference: form.manufacturerReference.trim(),
        brand: form.brand.trim(),
        image: form.image.trim(),
        currency: form.currency.trim().toUpperCase() || "EUR",
        location: form.location.trim(),
        costCenterId: form.costCenterId ? Number(form.costCenterId) : null,
        gtin: form.gtin.trim(),
        articleCode: form.articleCode.trim(),
      };

      if (isEditMode && id) {
        await updateSparePart(Number(id), request, imageFile);
      } else {
        await createSparePart(request, imageFile);
      }

      navigate("/admin/spare-parts", {
        replace: true,
      });
    } catch {
      setError(
        isEditMode
          ? "Impossible de modifier cette piece detachee."
          : "Impossible de creer cette piece detachee.",
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
        aria-label="Retour aux pieces detachees"
        onClick={() => navigate("/admin/spare-parts")}
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
                onClick={() => navigate("/admin/spare-parts")}
                aria-label="Retour aux pieces detachees"
              >
                <ArrowLeft size={22} />
              </button>

              <h2>
                {isEditMode
                  ? "Modifier la piece detachee"
                  : "Creer une piece detachee"}
              </h2>

              <button
                type="button"
                className="measure-drawer-close"
                onClick={() => navigate("/admin/spare-parts")}
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
                <PackagePlus size={19} />
                <span>Informations generales</span>
              </div>

              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label htmlFor="spare-part-name">
                    Nom <span>*</span>
                  </label>
                  <input
                    id="spare-part-name"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Exemple : Roulement a rouleaux"
                    required
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-code">
                    Code
                  </label>
                  <input
                    id="spare-part-code"
                    value={form.code}
                    onChange={(event) =>
                      updateField("code", event.target.value)
                    }
                    placeholder="Genere automatiquement"
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-brand">
                    Marque
                  </label>
                  <input
                    id="spare-part-brand"
                    value={form.brand}
                    onChange={(event) =>
                      updateField("brand", event.target.value)
                    }
                    placeholder="Exemple : SNR"
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-reference">
                    Reference fabricant
                  </label>
                  <input
                    id="spare-part-reference"
                    value={form.manufacturerReference}
                    onChange={(event) =>
                      updateField(
                        "manufacturerReference",
                        event.target.value,
                      )
                    }
                    placeholder="Exemple : NJ312ECM/C3"
                  />
                </div>
              </div>

              <div className="measure-form-group">
                <label htmlFor="spare-part-image">
                  Image
                </label>
                <label className="asset-image-picker" htmlFor="spare-part-image">
                  <ImagePlus size={30} />
                  <strong>
                    {imageFile?.name || form.image || "Choisir une image"}
                  </strong>
                  <input
                    id="spare-part-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setImageFile(file);
                      if (file) {
                        updateField("image", file.name);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="supplier-drawer-section-title">
                <PackagePlus size={19} />
                <span>Stock et prix</span>
              </div>

              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label htmlFor="spare-part-unit-price">
                    Prix unitaire
                  </label>
                  <input
                    id="spare-part-unit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(event) =>
                      updateNumberField("unitPrice", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-currency">
                    Devise
                  </label>
                  <select
                    id="spare-part-currency"
                    value={form.currency}
                    onChange={(event) =>
                      updateField("currency", event.target.value)
                    }
                  >
                    <option value="EUR">EUR</option>
                    <option value="MAD">MAD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-quantity">
                    Quantite
                  </label>
                  <input
                    id="spare-part-quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(event) =>
                      updateNumberField("quantity", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-reorder">
                    Lot de reapprovisionnement
                  </label>
                  <input
                    id="spare-part-reorder"
                    type="number"
                    min="0"
                    step="1"
                    value={form.reorderQuantity}
                    onChange={(event) =>
                      updateNumberField(
                        "reorderQuantity",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-min-stock">
                    Stock minimum
                  </label>
                  <input
                    id="spare-part-min-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.minimumStock}
                    onChange={(event) =>
                      updateNumberField(
                        "minimumStock",
                        event.target.value,
                      )
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-max-stock">
                    Stock maximum
                  </label>
                  <input
                    id="spare-part-max-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.maximumStock}
                    onChange={(event) =>
                      updateNumberField(
                        "maximumStock",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="supplier-drawer-section-title">
                <PackagePlus size={19} />
                <span>Localisation et references</span>
              </div>

              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label htmlFor="spare-part-location">
                    Emplacement
                  </label>
                  <input
                    id="spare-part-location"
                    value={form.location}
                    onChange={(event) =>
                      updateField("location", event.target.value)
                    }
                    placeholder="Exemple : 8"
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-cost-center">
                    Centre de couts
                  </label>
                  <select
                    id="spare-part-cost-center"
                    value={form.costCenterId}
                    onChange={(event) =>
                      updateField("costCenterId", event.target.value)
                    }
                  >
                    <option value="">Selectionner un centre de couts</option>
                    {costCenters.map((costCenter) => (
                      <option key={costCenter.id} value={costCenter.id}>
                        {costCenter.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-gtin">
                    Code GTIN/EAN
                  </label>
                  <input
                    id="spare-part-gtin"
                    value={form.gtin}
                    onChange={(event) =>
                      updateField("gtin", event.target.value)
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-article-code">
                    Code article
                  </label>
                  <input
                    id="spare-part-article-code"
                    value={form.articleCode}
                    onChange={(event) =>
                      updateField("articleCode", event.target.value)
                    }
                  />
                </div>
              </div>

              <div className="measure-form-group">
                <label htmlFor="spare-part-description">
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
                    id="spare-part-description"
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
                onClick={() => navigate("/admin/spare-parts")}
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
                    : "Creer la piece"}
              </button>
            </div>
          </form>
        )}
      </aside>
    </section>
  );
}

export default SparePartFormPage;


