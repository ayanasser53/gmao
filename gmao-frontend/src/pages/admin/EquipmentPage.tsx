import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Link2,
  MapPin as MapPinIcon,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Tag as TagIcon,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  createEquipment,
  deleteEquipment,
  getEquipment,
  updateEquipment,
} from "../../services/equipmentService";

import { getTags } from "../../services/tagService";
import { getCostCenters } from "../../services/costCenterService";
import { getSpareParts } from "../../services/sparePartService";
import { getMaintenancePlans } from "../../services/maintenancePlanService";

import EquipmentSelect from "../../components/admin/EquipmentSelect";
import SparePartSelect from "../../components/admin/SparePartSelect";

import "./task-styles.css";

import type {
  Equipment,
  EquipmentPayload,
} from "../../types/equipment";

import type { Tag } from "../../types/tag";
import type { CostCenter } from "../../types/costCenter";
import type { SparePart } from "../../types/sparePart";

const BACKEND_URL = "http://localhost:8090";

const initialForm: EquipmentPayload = {
  name: "",
  description: "",
  costCenterId: null,
  gtinEanCode: "",
  itemCode: "",
  tagIds: [],
  linkedEquipmentIds: [],
  linkedSparePartIds: [],
  removeImage: false,
};

function getFileUrl(
  path: string | null,
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

  return `${BACKEND_URL}${
    path.startsWith("/") ? path : `/${path}`
  }`;
}

function EquipmentPage() {
  const navigate = useNavigate();

  const [equipment, setEquipment] =
    useState<Equipment[]>([]);

  const [tags, setTags] =
    useState<Tag[]>([]);

  const [costCenters, setCostCenters] =
    useState<CostCenter[]>([]);

  const [spareParts, setSpareParts] =
    useState<SparePart[]>([]);

  const [search, setSearch] =
    useState<string>("");

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

  const [equipmentIdsWithPlan, setEquipmentIdsWithPlan] = useState<
    Set<number>
  >(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterPlan, setFilterPlan] = useState<"all" | "without" | "with">(
    "all",
  );
  const [filterCostCenterId, setFilterCostCenterId] = useState("");
  const [filterTagId, setFilterTagId] = useState("");
  const [filterLinkedEquipmentId, setFilterLinkedEquipmentId] = useState("");
  const [filterLinkedSparePartId, setFilterLinkedSparePartId] = useState("");
  const [openFilterDropdown, setOpenFilterDropdown] = useState<
    "tags" | "equipment" | "spareParts" | null
  >(null);

  async function loadData(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const [
        equipmentData,
        tagData,
        costCenterData,
        sparePartData,
        maintenancePlanData,
      ] = await Promise.all([
        getEquipment(),
        getTags(),
        getCostCenters(),
        getSpareParts(),
        getMaintenancePlans().catch(() => []),
      ]);

      setEquipment(equipmentData);
      setTags(tagData);
      setCostCenters(costCenterData);
      setSpareParts(sparePartData);
      setEquipmentIdsWithPlan(
        new Set(maintenancePlanData.map((plan) => plan.equipmentId)),
      );
    } catch (requestError) {
      console.error(
        "Erreur chargement :",
        requestError,
      );

      setError(
        "Impossible de charger les données.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredEquipment = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    return equipment.filter((item) => {
      const matchesSearch =
        !value ||
        item.name.toLowerCase().includes(value) ||
        item.description
          ?.toLowerCase()
          .includes(value) ||
        item.itemCode
          ?.toLowerCase()
          .includes(value) ||
        item.gtinEanCode
          ?.toLowerCase()
          .includes(value) ||
        item.costCenterName
          ?.toLowerCase()
          .includes(value);

      if (!matchesSearch) {
        return false;
      }

      if (filterPlan === "with" && !equipmentIdsWithPlan.has(item.id)) {
        return false;
      }

      if (filterPlan === "without" && equipmentIdsWithPlan.has(item.id)) {
        return false;
      }

      if (
        filterCostCenterId &&
        item.costCenterId !== Number(filterCostCenterId)
      ) {
        return false;
      }

      if (
        filterTagId &&
        !item.tags.some((tag) => tag.id === Number(filterTagId))
      ) {
        return false;
      }

      if (
        filterLinkedEquipmentId &&
        !item.linkedEquipment.some(
          (linked) => linked.id === Number(filterLinkedEquipmentId),
        )
      ) {
        return false;
      }

      if (
        filterLinkedSparePartId &&
        !item.linkedSpareParts.some(
          (linked) => linked.id === Number(filterLinkedSparePartId),
        )
      ) {
        return false;
      }

      return true;
    });
  }, [
    equipment,
    search,
    filterPlan,
    equipmentIdsWithPlan,
    filterCostCenterId,
    filterTagId,
    filterLinkedEquipmentId,
    filterLinkedSparePartId,
  ]);

  function openCreateDrawer(): void {
    setEditingId(null);

    setForm({
      ...initialForm,
      tagIds: [],
      linkedEquipmentIds: [],
      linkedSparePartIds: [],
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

      tagIds:
        item.tags?.map((tag) => tag.id) ?? [],

      linkedEquipmentIds:
        item.linkedEquipment?.map(
          (linked) => linked.id,
        ) ?? [],

      linkedSparePartIds:
        item.linkedSpareParts?.map(
          (part) => part.id,
        ) ?? [],

      removeImage: false,
    });

    setImageFile(null);
    setImagePreview(getFileUrl(item.image));
    setError("");
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    if (saving) {
      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setDrawerOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setImageFile(null);
    setImagePreview(null);
  }

  function toggleTag(tagId: number): void {
    setForm((previous) => ({
      ...previous,

      tagIds: previous.tagIds.includes(tagId)
        ? previous.tagIds.filter(
            (id) => id !== tagId,
          )
        : [...previous.tagIds, tagId],
    }));
  }

  function addLinkedEquipment(
    id: number,
  ): void {
    if (
      !id ||
      form.linkedEquipmentIds.includes(id)
    ) {
      return;
    }

    setForm((previous) => ({
      ...previous,

      linkedEquipmentIds: [
        ...previous.linkedEquipmentIds,
        id,
      ],
    }));
  }

  function removeLinkedEquipment(
    id: number,
  ): void {
    setForm((previous) => ({
      ...previous,

      linkedEquipmentIds:
        previous.linkedEquipmentIds.filter(
          (equipmentId) =>
            equipmentId !== id,
        ),
    }));
  }

  function addLinkedSparePart(
    id: number,
  ): void {
    if (
      !id ||
      form.linkedSparePartIds.includes(id)
    ) {
      return;
    }

    setForm((previous) => ({
      ...previous,

      linkedSparePartIds: [
        ...previous.linkedSparePartIds,
        id,
      ],
    }));
  }

  function removeLinkedSparePart(
    id: number,
  ): void {
    setForm((previous) => ({
      ...previous,

      linkedSparePartIds:
        previous.linkedSparePartIds.filter(
          (sparePartId) =>
            sparePartId !== id,
        ),
    }));
  }

  function handleImageChange(
    file: File | null,
  ): void {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);

    setForm((previous) => ({
      ...previous,
      removeImage: false,
    }));

    setImagePreview(
      file
        ? URL.createObjectURL(file)
        : null,
    );
  }

  function removeImage(): void {
    if (imagePreview?.startsWith("blob:")) {
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
      };

      const saved =
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

      setEquipment((previous) =>
        editingId === null
          ? [saved, ...previous]
          : previous.map((item) =>
              item.id === saved.id
                ? saved
                : item,
            ),
      );

      closeDrawer();
    } catch (requestError) {
      console.error(
        "Erreur enregistrement :",
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
      await deleteEquipment(item.id);

      setEquipment((previous) =>
        previous.filter(
          (value) => value.id !== item.id,
        ),
      );
    } catch (requestError) {
      console.error(requestError);

      setError(
        "Impossible de supprimer l'équipement.",
      );
    }
  }
return (
    <section className="equipment-workspace">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <Wrench size={28} />
            <h1>Équipements</h1>
          </div>
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
        <div className="supplier-error-message">
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
          className={`task-filter-toggle ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters((current) => !current)}
        >
          <SlidersHorizontal size={16} />
          Filtrer
        </button>
      </div>

      {showFilters && (
        <div className="task-filter-panel">
          <div className="equipment-filter-columns">
            <div className="equipment-filter-radios">
              <label className="equipment-filter-radio">
                <input
                  type="radio"
                  name="equipment-plan-filter"
                  checked={filterPlan === "all"}
                  onChange={() => setFilterPlan("all")}
                />
                Tous les équipements
              </label>
              <label className="equipment-filter-radio">
                <input
                  type="radio"
                  name="equipment-plan-filter"
                  checked={filterPlan === "without"}
                  onChange={() => setFilterPlan("without")}
                />
                Équipements sans plan de maintenance
              </label>
              <label className="equipment-filter-radio">
                <input
                  type="radio"
                  name="equipment-plan-filter"
                  checked={filterPlan === "with"}
                  onChange={() => setFilterPlan("with")}
                />
                Équipements avec plan de maintenance
              </label>

              <div className="task-filter-field">
                <label>
                  <MapPinIcon size={15} /> Centre de coût
                </label>
                <select
                  value={filterCostCenterId}
                  onChange={(e) => setFilterCostCenterId(e.target.value)}
                >
                  <option value="">Tous</option>
                  {costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="task-filter-field">
              <label>
                <TagIcon size={15} /> Tags
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenFilterDropdown((current) =>
                      current === "tags" ? null : "tags",
                    )
                  }
                >
                  {(() => {
                    const tag = tags.find(
                      (t) => t.id === Number(filterTagId),
                    );

                    return tag ? (
                      <span
                        className="task-filter-tag-chip"
                        style={{
                          color: tag.color ?? "#617287",
                          borderColor: tag.color ?? "#cfdbe6",
                          background: `${tag.color ?? "#617287"}1a`,
                        }}
                      >
                        {tag.name}
                      </span>
                    ) : (
                      <span>Tous</span>
                    );
                  })()}
                </button>

                {openFilterDropdown === "tags" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterTagId ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterTagId("");
                        setOpenFilterDropdown(null);
                      }}
                    >
                      Tous
                      {!filterTagId && <CheckCircle2 size={16} />}
                    </button>

                    {tags.map((tag) => {
                      const isSelected = filterTagId === String(tag.id);

                      return (
                        <button
                          type="button"
                          key={tag.id}
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterTagId(String(tag.id));
                            setOpenFilterDropdown(null);
                          }}
                        >
                          <span
                            className="task-filter-tag-chip"
                            style={{
                              color: tag.color ?? "#617287",
                              borderColor: tag.color ?? "#cfdbe6",
                              background: `${tag.color ?? "#617287"}1a`,
                            }}
                          >
                            {tag.name}
                          </span>
                          {isSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="task-filter-field">
              <label>
                <Link2 size={15} /> Équipement lié
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenFilterDropdown((current) =>
                      current === "equipment" ? null : "equipment",
                    )
                  }
                >
                  {(() => {
                    const item = equipment.find(
                      (e) => e.id === Number(filterLinkedEquipmentId),
                    );

                    if (!item) {
                      return <span>Tous</span>;
                    }

                    const image = getFileUrl(item.image);

                    return (
                      <>
                        <span className="task-filter-equip-thumb">
                          {image ? (
                            <img src={image} alt={item.name} />
                          ) : (
                            <Wrench size={13} />
                          )}
                        </span>
                        {item.name}
                      </>
                    );
                  })()}
                </button>

                {openFilterDropdown === "equipment" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterLinkedEquipmentId ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterLinkedEquipmentId("");
                        setOpenFilterDropdown(null);
                      }}
                    >
                      Tous
                      {!filterLinkedEquipmentId && <CheckCircle2 size={16} />}
                    </button>

                    {equipment.map((item) => {
                      const isSelected =
                        filterLinkedEquipmentId === String(item.id);
                      const image = getFileUrl(item.image);

                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterLinkedEquipmentId(String(item.id));
                            setOpenFilterDropdown(null);
                          }}
                        >
                          <span className="task-filter-equip-thumb">
                            {image ? (
                              <img src={image} alt={item.name} />
                            ) : (
                              <Wrench size={13} />
                            )}
                          </span>
                          {item.name}
                          {isSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <label className="equipment-filter-spacer">
                <Package size={15} /> Pièce liée
              </label>
              <div className="task-filter-dropdown">
                <button
                  type="button"
                  className="task-filter-dropdown-trigger"
                  onClick={() =>
                    setOpenFilterDropdown((current) =>
                      current === "spareParts" ? null : "spareParts",
                    )
                  }
                >
                  {(() => {
                    const part = spareParts.find(
                      (p) => p.id === Number(filterLinkedSparePartId),
                    );

                    if (!part) {
                      return <span>Tous</span>;
                    }

                    const image = getFileUrl(part.image);

                    return (
                      <>
                        <span className="task-filter-equip-thumb">
                          {image ? (
                            <img src={image} alt={part.name} />
                          ) : (
                            <Package size={13} />
                          )}
                        </span>
                        {part.name}
                      </>
                    );
                  })()}
                </button>

                {openFilterDropdown === "spareParts" && (
                  <div className="task-filter-dropdown-panel">
                    <button
                      type="button"
                      className={`task-filter-dropdown-row ${
                        !filterLinkedSparePartId ? "selected" : ""
                      }`}
                      onClick={() => {
                        setFilterLinkedSparePartId("");
                        setOpenFilterDropdown(null);
                      }}
                    >
                      Tous
                      {!filterLinkedSparePartId && <CheckCircle2 size={16} />}
                    </button>

                    {spareParts.map((part) => {
                      const isSelected =
                        filterLinkedSparePartId === String(part.id);
                      const image = getFileUrl(part.image);

                      return (
                        <button
                          type="button"
                          key={part.id}
                          className={`task-filter-dropdown-row ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => {
                            setFilterLinkedSparePartId(String(part.id));
                            setOpenFilterDropdown(null);
                          }}
                        >
                          <span className="task-filter-equip-thumb">
                            {image ? (
                              <img src={image} alt={part.name} />
                            ) : (
                              <Package size={13} />
                            )}
                          </span>
                          {part.name}
                          {isSelected && <CheckCircle2 size={16} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="task-filter-actions">
            <button
              type="button"
              className="task-filter-reset"
              onClick={() => {
                setFilterPlan("all");
                setFilterCostCenterId("");
                setFilterTagId("");
                setFilterLinkedEquipmentId("");
                setFilterLinkedSparePartId("");
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="equipment-loading">
          Chargement des équipements...
        </div>
      ) : (
        <div className="equipment-list">
          {filteredEquipment.map((item) => {
            const imageUrl =
              getFileUrl(item.image);

            return (
              <article
                className="equipment-card"
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(
                    `/admin/equipment/${item.id}`,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    navigate(
                      `/admin/equipment/${item.id}`,
                    );
                  }
                }}
              >
                <div className="equipment-card-image">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.name}
                    />
                  ) : (
                    <Wrench size={35} />
                  )}
                </div>

                <div className="equipment-card-content">
                  <h2>{item.name}</h2>

                  <p>
                    {item.description ||
                      "Aucune description"}
                  </p>

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
                      Équipements liés :{" "}
                      {item.linkedEquipment
                        ?.length ?? 0}
                    </span>

                    <span>
                      Pièces liées :{" "}
                      {item.linkedSpareParts
                        ?.length ?? 0}
                    </span>
                  </div>

                  <div className="equipment-card-tags">
                    {item.tags?.map((tag) => (
                      <span
                        key={tag.id}
                        style={{
                          backgroundColor:
                            tag.color ||
                            "#7d8793",
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
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditDrawer(item);
                    }}
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    type="button"
                    className="equipment-delete-button"
                    title="Supprimer"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDelete(item);
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            );
          })}

          {filteredEquipment.length === 0 && (
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
          aria-label="Fermer"
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
                />
              </label>

              {imagePreview && (
                <div className="equipment-image-preview">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                  >
                    Supprimer l’image
                  </button>
                </div>
              )}
            </div>

            <div className="equipment-form-field">
              <label>Nom *</label>

              <input
                value={form.name}
                maxLength={255}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="equipment-form-field">
              <label>Description</label>

              <textarea
                rows={5}
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="equipment-form-grid">
              <div className="equipment-form-field">
                <label>Centre de coût</label>

                <select
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
                <label>GTIN/EAN</label>

                <input
                  value={form.gtinEanCode}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,

                      gtinEanCode:
                        event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="equipment-form-field">
              <label>Code article</label>

              <input
                value={form.itemCode}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    itemCode:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="equipment-form-field">
              <label>Tags</label>

              <div className="equipment-tag-selector">
                {tags.map((tag) => {
                  const selected =
                    form.tagIds.includes(tag.id);

                  return (
                    <button
                      type="button"
                      key={tag.id}
                      className={
                        selected
                          ? "equipment-tag-chip equipment-tag-chip-selected"
                          : "equipment-tag-chip"
                      }
                      style={{
                        backgroundColor:
                          tag.color ||
                          "#7d8793",
                        color: "#ffffff",
                      }}
                      onClick={() =>
                        toggleTag(tag.id)
                      }
                    >
                      <TagIcon size={14} />
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="equipment-form-field">
              <label>
                <Link2 size={16} />
                Équipements liés
              </label>

              <div className="multi-select-box">
                <div className="multi-select-values">
                  {equipment
                    .filter((item) =>
                      form.linkedEquipmentIds.includes(
                        item.id,
                      ),
                    )
                    .map((item) => (
                      <span
                        className="multi-select-chip"
                        key={item.id}
                      >
                        {item.name}

                        <button
                          type="button"
                          onClick={() =>
                            removeLinkedEquipment(
                              item.id,
                            )
                          }
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                </div>

                <EquipmentSelect
                  equipmentList={equipment.filter(
                    (item) =>
                      item.id !== editingId &&
                      !form.linkedEquipmentIds.includes(item.id),
                  )}
                  value=""
                  onSelect={(item) => addLinkedEquipment(item.id)}
                  placeholder="Ajouter un équipement"
                />
              </div>
            </div>

            <div className="equipment-form-field">
              <label>
                <Package size={16} />
                Pièces de rechange liées
              </label>

              <div className="multi-select-box">
                <div className="multi-select-values">
                  {spareParts
                    .filter((part) =>
                      form.linkedSparePartIds.includes(
                        part.id,
                      ),
                    )
                    .map((part) => (
                      <span
                        className="multi-select-chip"
                        key={part.id}
                      >
                        {part.code
                          ? `${part.code} — `
                          : ""}
                        {part.name}

                        <button
                          type="button"
                          onClick={() =>
                            removeLinkedSparePart(
                              part.id,
                            )
                          }
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                </div>

                <SparePartSelect
                  spareParts={spareParts}
                  excludedIds={form.linkedSparePartIds}
                  onSelect={(part) => addLinkedSparePart(part.id)}
                  placeholder="Ajouter une pièce"
                />
              </div>
            </div>
          </div>

          <div className="equipment-drawer-footer">
            <button
              type="button"
              className="equipment-cancel-button"
              onClick={closeDrawer}
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
                  ? "Créer l’équipement"
                  : "Enregistrer"}
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}

export default EquipmentPage;