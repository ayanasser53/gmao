import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Filter,
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Tag as TagIcon,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  updateEquipment,
} from "../../services/equipmentService";

import { getTags } from "../../services/tagService";
import { getCostCenters } from "../../services/costCenterService";

import type {
  Equipment,
  EquipmentPayload,
  EquipmentVisibility,
} from "../../types/equipment";

import type { Tag } from "../../types/tag";
import type { CostCenter } from "../../types/costCenter";

const BACKEND_URL = "http://localhost:8090";

const initialForm: EquipmentPayload = {
  name: "",
  description: "",
  costCenterId: null,
  gtinEanCode: "",
  itemCode: "",
  parentEquipmentId: null,
  visibility: "PRIVATE",
  tagIds: [],
  removeImage: false,
};

function getEquipmentImageUrl(
  imagePath: string | null,
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

  return `${BACKEND_URL}${
    imagePath.startsWith("/")
      ? imagePath
      : `/${imagePath}`
  }`;
}

function EquipmentPage() {
  const [equipment, setEquipment] =
    useState<Equipment[]>([]);

  const [tags, setTags] =
    useState<Tag[]>([]);

  const [costCenters, setCostCenters] =
    useState<CostCenter[]>([]);

  const [search, setSearch] =
    useState<string>("");

  const [selectedTagIds, setSelectedTagIds] =
    useState<number[]>([]);

  const [selectedCostCenterId, setSelectedCostCenterId] =
    useState<number | null>(null);

  const [filtersOpen, setFiltersOpen] =
    useState<boolean>(false);

  const [drawerOpen, setDrawerOpen] =
    useState<boolean>(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<EquipmentPayload>(initialForm);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imagePreview, setImagePreview] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [saving, setSaving] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string>("");

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const [
        equipmentData,
        tagData,
        costCenterData,
      ] = await Promise.all([
        getEquipment(),
        getTags(),
        getCostCenters(),
      ]);

      setEquipment(equipmentData);
      setTags(tagData);
      setCostCenters(costCenterData);
    } catch (requestError) {
      console.error(
        "Erreur chargement des données :",
        requestError,
      );

      setError(
        "Impossible de charger les équipements.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredEquipment = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return equipment.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.name
          .toLowerCase()
          .includes(searchValue) ||
        item.description
          ?.toLowerCase()
          .includes(searchValue) ||
        item.itemCode
          ?.toLowerCase()
          .includes(searchValue) ||
        item.gtinEanCode
          ?.toLowerCase()
          .includes(searchValue) ||
        item.costCenterName
          ?.toLowerCase()
          .includes(searchValue);

      const matchesTags =
        selectedTagIds.length === 0 ||
        selectedTagIds.every((tagId) =>
          item.tags.some(
            (tag) => tag.id === tagId,
          ),
        );

      const matchesCostCenter =
        selectedCostCenterId === null ||
        item.costCenterId ===
          selectedCostCenterId;

      return (
        matchesSearch &&
        matchesTags &&
        matchesCostCenter
      );
    });
  }, [
    equipment,
    search,
    selectedTagIds,
    selectedCostCenterId,
  ]);

  function openCreateDrawer(): void {
    setEditingId(null);

    setForm({
      ...initialForm,
      tagIds: [],
    });

    setImageFile(null);
    setImagePreview(null);
    setError("");
    setDrawerOpen(true);
  }

  function openEditDrawer(
    item: Equipment,
  ): void {
    setEditingId(item.id);

    setForm({
      name: item.name,
      description: item.description ?? "",
      costCenterId: item.costCenterId,
      gtinEanCode: item.gtinEanCode ?? "",
      itemCode: item.itemCode ?? "",
      parentEquipmentId:
        item.parentEquipmentId,
      visibility: item.visibility,
      tagIds: item.tags.map(
        (tag) => tag.id,
      ),
      removeImage: false,
    });

    setImageFile(null);

    setImagePreview(
      getEquipmentImageUrl(item.image),
    );

    setError("");
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    if (saving) {
      return;
    }

    if (
      imagePreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setDrawerOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setImageFile(null);
    setImagePreview(null);
  }

  function toggleTag(
    tagId: number,
  ): void {
    setForm((previous) => ({
      ...previous,

      tagIds: previous.tagIds.includes(
        tagId,
      )
        ? previous.tagIds.filter(
            (id) => id !== tagId,
          )
        : [
            ...previous.tagIds,
            tagId,
          ],
    }));
  }

  function toggleFilterTag(
    tagId: number,
  ): void {
    setSelectedTagIds((previous) =>
      previous.includes(tagId)
        ? previous.filter(
            (id) => id !== tagId,
          )
        : [...previous, tagId],
    );
  }

  function handleImageChange(
    file: File | null,
  ): void {
    if (
      imagePreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);

    setForm((previous) => ({
      ...previous,
      removeImage: false,
    }));

    if (!file) {
      setImagePreview(null);
      return;
    }

    setImagePreview(
      URL.createObjectURL(file),
    );
  }

  function removeCurrentImage(): void {
    if (
      imagePreview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(null);
    setImagePreview(null);

    setForm((previous) => ({
      ...previous,
      removeImage: true,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!form.name.trim()) {
      setError(
        "Le nom de l'équipement est obligatoire.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload: EquipmentPayload = {
        ...form,

        name: form.name.trim(),

        description:
          form.description.trim(),

        gtinEanCode:
          form.gtinEanCode.trim(),

        itemCode:
          form.itemCode.trim(),

        tagIds: [...form.tagIds],
      };

      const savedEquipment =
        editingId === null
          ? await createEquipment(
              payload,
              imageFile,
            )
          : await updateEquipment(
              editingId,
              payload,
              imageFile,
            );

      setEquipment((previous) => {
        if (editingId === null) {
          return [
            savedEquipment,
            ...previous,
          ];
        }

        return previous.map((item) =>
          item.id === savedEquipment.id
            ? savedEquipment
            : item,
        );
      });

      closeDrawer();
    } catch (requestError) {
      console.error(
        "Erreur enregistrement équipement :",
        requestError,
      );

      setError(
        "Impossible d'enregistrer l'équipement.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    item: Equipment,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer l'équipement "${item.name}" ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteEquipment(item.id);

      setEquipment((previous) =>
        previous.filter(
          (equipmentItem) =>
            equipmentItem.id !== item.id,
        ),
      );
    } catch (requestError) {
      console.error(
        "Erreur suppression équipement :",
        requestError,
      );

      setError(
        "Impossible de supprimer l'équipement.",
      );
    }
  }

  return (
    <section className="equipment-workspace">
      <div className="equipment-page-header">
        <div>
          <span className="admin-page-eyebrow">
            Gestion des actifs
          </span>

          <h1>Équipements</h1>

          <p>
            {filteredEquipment.length} équipement(s)
          </p>
        </div>

        <button
          type="button"
          className="equipment-primary-button"
          onClick={openCreateDrawer}
        >
          <Plus size={19} />
          Créer un équipement
        </button>
      </div>

      {error && (
        <div
          className="equipment-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="equipment-toolbar">
        <div className="equipment-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Rechercher un équipement"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <button
          type="button"
          className="equipment-filter-button"
          onClick={() =>
            setFiltersOpen(
              (previous) => !previous,
            )
          }
        >
          <Filter size={18} />
          Filtrer
        </button>
      </div>

      {filtersOpen && (
        <div className="equipment-filters">
          <div className="equipment-filter-field">
            <strong>Centre de coût</strong>

            <select
              value={
                selectedCostCenterId ?? ""
              }
              onChange={(event) =>
                setSelectedCostCenterId(
                  event.target.value
                    ? Number(
                        event.target.value,
                      )
                    : null,
                )
              }
            >
              <option value="">
                Tous les centres de coût
              </option>

              {costCenters.map(
                (costCenter) => (
                  <option
                    key={costCenter.id}
                    value={costCenter.id}
                  >
                    {costCenter.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="equipment-filter-field">
            <strong>Tags</strong>

            <div className="equipment-tag-selector">
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  className={
                    selectedTagIds.includes(
                      tag.id,
                    )
                      ? "equipment-tag-chip equipment-tag-chip-selected"
                      : "equipment-tag-chip"
                  }
                  onClick={() =>
                    toggleFilterTag(tag.id)
                  }
                >
                  <TagIcon size={14} />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="equipment-clear-filter"
            onClick={() => {
              setSelectedTagIds([]);
              setSelectedCostCenterId(null);
            }}
          >
            Effacer les filtres
          </button>
        </div>
      )}

      {loading ? (
        <div className="equipment-loading">
          Chargement des équipements...
        </div>
      ) : (
        <div className="equipment-list">
          {filteredEquipment.map(
            (item) => {
              const imageUrl =
                getEquipmentImageUrl(
                  item.image,
                );

              return (
                <article
                  className="equipment-card"
                  key={item.id}
                >
                  <div className="equipment-card-image">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <Wrench size={34} />
                    )}
                  </div>

                  <div className="equipment-card-content">
                    <div className="equipment-card-title-row">
                      <div>
                        <h2>{item.name}</h2>

                        <p>
                          {item.description ||
                            "Aucune description"}
                        </p>
                      </div>

                      <span className="equipment-visibility-badge">
                        {item.visibility ===
                        "PUBLIC" ? (
                          <Eye size={15} />
                        ) : (
                          <EyeOff size={15} />
                        )}

                        {item.visibility ===
                        "PUBLIC"
                          ? "Public"
                          : "Privé"}
                      </span>
                    </div>

                    <div className="equipment-card-meta">
                      <span>
                        Centre de coût :{" "}
                        {item.costCenterName ??
                          "Non défini"}
                      </span>

                      <span>
                        Code article :{" "}
                        {item.itemCode ?? "—"}
                      </span>

                      <span>
                        GTIN/EAN :{" "}
                        {item.gtinEanCode ?? "—"}
                      </span>

                      <span>
                        Équipement lié :{" "}
                        {item.parentEquipmentName ??
                          "Aucun"}
                      </span>
                    </div>

                    <div className="equipment-card-tags">
                      {item.tags.map((tag) => (
                        <span
    key={tag.id}
    className="equipment-tag"
    style={{
        backgroundColor: tag.color,
        borderColor: tag.color,
        color: "#fff",
    }}
>
    {tag.name}
</span>
                      ))}
                    </div>
                  </div>

                  <div className="equipment-card-actions">
                    <button
                      type="button"
                      title="Modifier"
                      onClick={() =>
                        openEditDrawer(item)
                      }
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      type="button"
                      className="equipment-delete-button"
                      title="Supprimer"
                      onClick={() =>
                        void handleDelete(item)
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            },
          )}

          {filteredEquipment.length ===
            0 && (
            <div className="equipment-empty">
              Aucun équipement trouvé.
            </div>
          )}
        </div>
      )}

      {drawerOpen && (
        <button
          type="button"
          className="equipment-drawer-overlay"
          onClick={closeDrawer}
          aria-label="Fermer le formulaire"
        />
      )}

      <aside
        className={
          drawerOpen
            ? "equipment-drawer equipment-drawer-open"
            : "equipment-drawer"
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="equipment-drawer-header">
            <button
              type="button"
              onClick={closeDrawer}
              disabled={saving}
            >
              <ArrowLeft size={21} />
            </button>

            <h2>
              {editingId === null
                ? "Créer un équipement"
                : "Modifier l'équipement"}
            </h2>

            <button
              type="button"
              onClick={closeDrawer}
              disabled={saving}
            >
              <X size={20} />
            </button>
          </div>

          <div className="equipment-drawer-body">
            <div className="equipment-form-field">
              <label>Image</label>

              <label className="equipment-image-dropzone">
                <ImagePlus size={28} />

                <span>
                  {imagePreview
                    ? "Changer l'image"
                    : "Choisir une image"}
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    handleImageChange(
                      event.target
                        .files?.[0] ?? null,
                    )
                  }
                  disabled={saving}
                />
              </label>

              {imagePreview && (
                <div className="equipment-image-preview">
                  <img
                    src={imagePreview}
                    alt="Aperçu de l'équipement"
                  />

                  <button
                    type="button"
                    onClick={removeCurrentImage}
                    disabled={saving}
                  >
                    Supprimer l'image
                  </button>
                </div>
              )}
            </div>

            <div className="equipment-form-field">
              <label htmlFor="equipment-name">
                Nom *
              </label>

              <input
                id="equipment-name"
                value={form.name}
                maxLength={255}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                disabled={saving}
                required
              />
            </div>

            <div className="equipment-form-field">
              <label htmlFor="equipment-description">
                Description
              </label>

              <textarea
                id="equipment-description"
                rows={6}
                maxLength={5000}
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description:
                      event.target.value,
                  }))
                }
                disabled={saving}
              />
            </div>

            <div className="equipment-form-grid">
              <div className="equipment-form-field">
                <label htmlFor="equipment-cost-center">
                  Centre de coût
                </label>

                <select
                  id="equipment-cost-center"
                  value={
                    form.costCenterId ?? ""
                  }
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,

                      costCenterId:
                        event.target.value
                          ? Number(
                              event.target
                                .value,
                            )
                          : null,
                    }))
                  }
                  disabled={saving}
                >
                  <option value="">
                    Aucun centre de coût
                  </option>

                  {costCenters.map(
                    (costCenter) => (
                      <option
                        key={costCenter.id}
                        value={costCenter.id}
                      >
                        {costCenter.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="equipment-form-field">
                <label htmlFor="equipment-parent">
                  Équipement lié
                </label>

                <select
                  id="equipment-parent"
                  value={
                    form.parentEquipmentId ??
                    ""
                  }
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,

                      parentEquipmentId:
                        event.target.value
                          ? Number(
                              event.target
                                .value,
                            )
                          : null,
                    }))
                  }
                  disabled={saving}
                >
                  <option value="">
                    Aucun équipement lié
                  </option>

                  {equipment
                    .filter(
                      (item) =>
                        item.id !== editingId,
                    )
                    .map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="equipment-form-grid">
              <div className="equipment-form-field">
                <label htmlFor="equipment-gtin">
                  GTIN/EAN
                </label>

                <input
                  id="equipment-gtin"
                  value={form.gtinEanCode}
                  maxLength={100}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      gtinEanCode:
                        event.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="equipment-form-field">
                <label htmlFor="equipment-item-code">
                  Code article
                </label>

                <input
                  id="equipment-item-code"
                  value={form.itemCode}
                  maxLength={100}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      itemCode:
                        event.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className="equipment-form-field">
              <label>Tags</label>

              <div className="equipment-tag-selector">
                {tags.map((tag) => (
                  <button
    type="button"
    key={tag.id}
    className={
        form.tagIds.includes(tag.id)
            ? "equipment-tag-chip equipment-tag-chip-selected"
            : "equipment-tag-chip"
    }
    style={{
        backgroundColor: tag.color,
        borderColor: tag.color,
        color: "#fff",
    }}
    onClick={() => toggleTag(tag.id)}
>
    <TagIcon size={14}/>
    {tag.name}
</button>
                ))}
              </div>
            </div>

            <div className="equipment-form-field">
              <label>Visibilité</label>

              <div className="equipment-visibility-options">
                {(
                  [
                    "PUBLIC",
                    "PRIVATE",
                  ] as EquipmentVisibility[]
                ).map((visibility) => (
                  <button
                    type="button"
                    key={visibility}
                    className={
                      form.visibility ===
                      visibility
                        ? "equipment-visibility-option equipment-visibility-option-active"
                        : "equipment-visibility-option"
                    }
                    onClick={() =>
                      setForm((previous) => ({
                        ...previous,
                        visibility,
                      }))
                    }
                    disabled={saving}
                  >
                    {visibility ===
                    "PUBLIC" ? (
                      <Eye size={21} />
                    ) : (
                      <EyeOff size={21} />
                    )}

                    <strong>
                      {visibility ===
                      "PUBLIC"
                        ? "Public"
                        : "Privé"}
                    </strong>

                    <span>
                      {visibility ===
                      "PUBLIC"
                        ? "Visible par les utilisateurs autorisés."
                        : "Visible uniquement dans votre réseau."}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="equipment-drawer-footer">
            <button
              type="button"
              className="equipment-cancel-button"
              onClick={closeDrawer}
              disabled={saving}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="equipment-primary-button"
              disabled={saving}
            >
              {saving
                ? "Enregistrement..."
                : editingId === null
                  ? "Créer l'équipement"
                  : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}

export default EquipmentPage;