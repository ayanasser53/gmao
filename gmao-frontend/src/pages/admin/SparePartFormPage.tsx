import {
  useEffect,
  useMemo,
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

import { getCostCenters } from "../../services/costCenterService";
import { getEquipment } from "../../services/equipmentService";
import { getTags } from "../../services/tagService";

import EquipmentSelect from "../../components/admin/EquipmentSelect";
import SparePartSelect from "../../components/admin/SparePartSelect";
import {
  createSparePart,
  getSparePartById,
  getSpareParts,
  updateSparePart,
} from "../../services/sparePartService";
import type { CostCenter } from "../../types/costCenter";
import type { Equipment } from "../../types/equipment";
import type {
  SparePart,
  SparePartRequest,
} from "../../types/sparePart";
import type { Tag } from "../../types/tag";

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
  tagIds: [],
  linkedEquipmentIds: [],
  linkedSparePartIds: [],
};

function SparePartFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState<SparePartFormState>(emptyForm);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [error, setError] = useState("");

  const selectedEquipment = useMemo(
    () => equipment.filter((item) => form.linkedEquipmentIds.includes(item.id)),
    [equipment, form.linkedEquipmentIds],
  );

  const selectedSpareParts = useMemo(
    () => spareParts.filter((item) => form.linkedSparePartIds.includes(item.id)),
    [spareParts, form.linkedSparePartIds],
  );

  const availableSpareParts = useMemo(
    () => spareParts.filter((item) => !id || item.id !== Number(id)),
    [id, spareParts],
  );

  const selectedTags = useMemo(
    () => tags.filter((tag) => form.tagIds.includes(tag.id)),
    [form.tagIds, tags],
  );

  useEffect(() => {
    async function loadOptions(): Promise<void> {
      try {
        const [costCenterData, equipmentData, sparePartData, tagData] = await Promise.all([
          getCostCenters(),
          getEquipment(),
          getSpareParts(),
          getTags(),
        ]);

        setCostCenters(costCenterData);
        setEquipment(equipmentData);
        setSpareParts(sparePartData);
        setTags(tagData);
      } catch {
        setCostCenters([]);
        setEquipment([]);
        setSpareParts([]);
        setTags([]);
      }
    }

    void loadOptions();
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
          tagIds: sparePart.tags?.map((tag) => tag.id) ?? [],
          linkedEquipmentIds: sparePart.linkedEquipments?.map((item) => item.id) ?? [],
          linkedSparePartIds: sparePart.linkedSpareParts?.map((item) => item.id) ?? [],
        });
      } catch {
        setError("Impossible de charger cette pièce détachée.");
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

  function addLinkedEquipment(value: string): void {
    const equipmentId = Number(value);

    if (!equipmentId || form.linkedEquipmentIds.includes(equipmentId)) {
      return;
    }

    updateField("linkedEquipmentIds", [...form.linkedEquipmentIds, equipmentId]);
  }

  function removeLinkedEquipment(equipmentId: number): void {
    updateField(
      "linkedEquipmentIds",
      form.linkedEquipmentIds.filter((itemId) => itemId !== equipmentId),
    );
  }

  function addLinkedSparePart(value: string): void {
    const sparePartId = Number(value);

    if (
      !sparePartId
      || form.linkedSparePartIds.includes(sparePartId)
      || (isEditMode && id && sparePartId === Number(id))
    ) {
      return;
    }

    updateField("linkedSparePartIds", [...form.linkedSparePartIds, sparePartId]);
  }

  function removeLinkedSparePart(sparePartId: number): void {
    updateField(
      "linkedSparePartIds",
      form.linkedSparePartIds.filter((itemId) => itemId !== sparePartId),
    );
  }

  function addTag(value: string): void {
    const tagId = Number(value);

    if (!tagId || form.tagIds.includes(tagId)) {
      return;
    }

    updateField("tagIds", [...form.tagIds, tagId]);
  }

  function removeTag(tagId: number): void {
    updateField(
      "tagIds",
      form.tagIds.filter((itemId) => itemId !== tagId),
    );
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

      const savedSparePart = isEditMode && id
        ? await updateSparePart(Number(id), request, imageFile)
        : await createSparePart(request, imageFile);

      navigate(`/admin/spare-parts/${savedSparePart.id}`, {
        replace: true,
      });
    } catch {
      setError(
        isEditMode
          ? "Impossible de modifier cette pièce détachée."
          : "Impossible de créer cette pièce détachée.",
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
        aria-label="Retour aux pièces détachées"
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
                aria-label="Retour aux pièces détachées"
              >
                <ArrowLeft size={22} />
              </button>

              <h2>
                {isEditMode
                  ? "Modifier la pièce détachée"
                  : "Créer une pièce détachée"}
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
                <span>Informations générales</span>
              </div>

              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label htmlFor="spare-part-name">
                    Nom <span>*</span>
                  </label>
                  <input
                    id="spare-part-name"
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Exemple : Roulement à rouleaux"
                    required
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-code">Code</label>
                  <input
                    id="spare-part-code"
                    value={form.code}
                    onChange={(event) => updateField("code", event.target.value)}
                    placeholder="Généré automatiquement"
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-brand">Marque</label>
                  <input
                    id="spare-part-brand"
                    value={form.brand}
                    onChange={(event) => updateField("brand", event.target.value)}
                    placeholder="Exemple : SNR"
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-reference">Référence fabricant</label>
                  <input
                    id="spare-part-reference"
                    value={form.manufacturerReference}
                    onChange={(event) => updateField("manufacturerReference", event.target.value)}
                    placeholder="Exemple : NJ312ECM/C3"
                  />
                </div>
              </div>

              <div className="measure-form-group">
                <label htmlFor="spare-part-image">Image</label>
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

              <div className="measure-form-group">
                <label htmlFor="spare-part-tags">Labels / tags</label>
                <select
                  id="spare-part-tags"
                  value=""
                  onChange={(event) => addTag(event.target.value)}
                >
                  <option value="">Sélectionner des labels</option>
                  {tags
                    .filter((tag) => !form.tagIds.includes(tag.id))
                    .map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                </select>

                {selectedTags.length > 0 && (
                  <div className="spare-part-selected-tags">
                    {selectedTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => removeTag(tag.id)}
                        style={{
                          borderColor: tag.color,
                          background: tag.color,
                        }}
                      >
                        {tag.name} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="supplier-drawer-section-title">
                <PackagePlus size={19} />
                <span>Stock et prix</span>
              </div>

              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label htmlFor="spare-part-unit-price">Prix unitaire</label>
                  <input
                    id="spare-part-unit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(event) => updateNumberField("unitPrice", event.target.value)}
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-currency">Devise</label>
                  <select
                    id="spare-part-currency"
                    value={form.currency}
                    onChange={(event) => updateField("currency", event.target.value)}
                  >
                    <option value="EUR">EUR</option>
                    <option value="MAD">MAD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-quantity">Quantité</label>
                  <input
                    id="spare-part-quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(event) => updateNumberField("quantity", event.target.value)}
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-reorder">Lot de réapprovisionnement</label>
                  <input
                    id="spare-part-reorder"
                    type="number"
                    min="0"
                    step="1"
                    value={form.reorderQuantity}
                    onChange={(event) => updateNumberField("reorderQuantity", event.target.value)}
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-min-stock">Stock minimum</label>
                  <input
                    id="spare-part-min-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.minimumStock}
                    onChange={(event) => updateNumberField("minimumStock", event.target.value)}
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-max-stock">Stock maximum</label>
                  <input
                    id="spare-part-max-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.maximumStock}
                    onChange={(event) => updateNumberField("maximumStock", event.target.value)}
                  />
                </div>
              </div>

              <div className="supplier-drawer-section-title">
                <PackagePlus size={19} />
                <span>Localisation et références</span>
              </div>

              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label htmlFor="spare-part-location">Emplacement</label>
                  <input
                    id="spare-part-location"
                    value={form.location}
                    onChange={(event) => updateField("location", event.target.value)}
                    placeholder="Exemple : 8"
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-cost-center">Centre de coûts</label>
                  <select
                    id="spare-part-cost-center"
                    value={form.costCenterId}
                    onChange={(event) => updateField("costCenterId", event.target.value)}
                  >
                    <option value="">Sélectionner un centre de coûts</option>
                    {costCenters.map((costCenter) => (
                      <option key={costCenter.id} value={costCenter.id}>
                        {costCenter.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-gtin">Code GTIN/EAN</label>
                  <input
                    id="spare-part-gtin"
                    value={form.gtin}
                    onChange={(event) => updateField("gtin", event.target.value)}
                  />
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-article-code">Code article</label>
                  <input
                    id="spare-part-article-code"
                    value={form.articleCode}
                    onChange={(event) => updateField("articleCode", event.target.value)}
                  />
                </div>
              </div>

              <div className="supplier-drawer-section-title">
                <PackagePlus size={19} />
                <span>Liaisons</span>
              </div>

              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label htmlFor="spare-part-linked-equipment">Équipements liés</label>
                  <div className="multi-select-box">
                    <EquipmentSelect
                      equipmentList={equipment.filter(
                        (item) => !form.linkedEquipmentIds.includes(item.id),
                      )}
                      value=""
                      onSelect={(item) => addLinkedEquipment(String(item.id))}
                      placeholder="Sélectionner un équipement"
                    />
                    <div className="multi-select-values">
                      {selectedEquipment.map((item) => (
                        <span key={item.id} className="multi-select-chip">
                          {item.name}
                          <button
                            type="button"
                            onClick={() => removeLinkedEquipment(item.id)}
                            aria-label={`Retirer ${item.name}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="measure-form-group">
                  <label htmlFor="spare-part-linked-spare-parts">Pièces détachées liées</label>
                  <div className="multi-select-box">
                    <SparePartSelect
                      spareParts={availableSpareParts}
                      excludedIds={[]}
                      onSelect={(item) => addLinkedSparePart(String(item.id))}
                      placeholder="Sélectionner une pièce détachée"
                    />
                    <div className="multi-select-values">
                      {selectedSpareParts.map((item) => (
                        <span key={item.id} className="multi-select-chip">
                          {item.name}
                          <button
                            type="button"
                            onClick={() => removeLinkedSparePart(item.id)}
                            aria-label={`Retirer ${item.name}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="measure-form-group">
                <label htmlFor="spare-part-description">Description</label>
                <div className="measure-editor">
                  <div className="measure-editor-toolbar">
                    <span>Aperçu</span>
                    <strong>B</strong>
                    <em>I</em>
                    <span>/</span>
                    <span>=</span>
                  </div>
                  <textarea
                    id="spare-part-description"
                    rows={6}
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
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
                    : "Créer la pièce"}
              </button>
            </div>
          </form>
        )}
      </aside>
    </section>
  );
}

export default SparePartFormPage;
