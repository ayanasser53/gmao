import type { Dispatch, SetStateAction } from "react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  CirclePlus,
  CircleDollarSign,
  Download,
  Hash,
  ListChecks,
  MapPin,
  PackagePlus,
  Pencil,
  Search,
  SlidersHorizontal,
  Tag as TagIcon,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  deleteSparePart,
  getSpareParts,
} from "../../services/sparePartService";
import { getTags } from "../../services/tagService";
import { getTaskById, getTasks } from "../../services/taskService";

import type { SparePart } from "../../types/sparePart";
import type { Tag } from "../../types/tag";
import type { Task } from "../../types/task";
import { exportTableCsv, exportTablePdf } from "../../utils/exportFiles";

import "./task-styles.css";


const BACKEND_URL = "http://localhost:8090";

type SparePartLabelFilterDropdown = "labels" | "excludedLabels" | "taskLabels" | null;

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
  const [tags, setTags] = useState<Tag[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [showFilters, setShowFilters] = useState(false);
  const [filterMinQuantity, setFilterMinQuantity] = useState("");
  const [filterMaxQuantity, setFilterMaxQuantity] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [filterLabelIds, setFilterLabelIds] = useState<number[]>([]);
  const [filterExcludedLabelIds, setFilterExcludedLabelIds] = useState<number[]>([]);
  const [filterTaskLabelIds, setFilterTaskLabelIds] = useState<number[]>([]);
  const [openLabelFilter, setOpenLabelFilter] =
    useState<SparePartLabelFilterDropdown>(null);

  async function loadSpareParts(): Promise<void> {
    try {
      setLoading(true);
      setError("");

      const [data, availableTags, taskList] = await Promise.all([
        getSpareParts(),
        getTags(),
        getTasks(),
      ]);
      const detailedTasks = await Promise.all(
        taskList.map((task) => getTaskById(task.id).catch(() => null)),
      );

      setSpareParts(data);
      setTags(availableTags);
      setTasks(
        detailedTasks.filter((task): task is Task => task !== null),
      );
    } catch {
      setError("Impossible de charger les pièces détachées.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSpareParts();
  }, []);

  const taskLabelIdsBySparePart = useMemo(() => {
    const labelIdsBySparePart = new Map<number, Set<number>>();

    tasks.forEach((task) => {
      const taskLabelIds = task.tags.map((tag) => tag.id);

      if (taskLabelIds.length === 0) {
        return;
      }

      task.spareParts.forEach((line) => {
        const existing =
          labelIdsBySparePart.get(line.sparePartId) ?? new Set<number>();

        taskLabelIds.forEach((tagId) => existing.add(tagId));
        labelIdsBySparePart.set(line.sparePartId, existing);
      });
    });

    return labelIdsBySparePart;
  }, [tasks]);

  const filteredSpareParts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return spareParts.filter((part) => {
      const partLabelIds = (part.tags ?? []).map((tag) => tag.id);
      const taskLabelIds =
        taskLabelIdsBySparePart.get(part.id) ?? new Set<number>();
      const matchesSearch =
        !value ||
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
          .some((field) => String(field).toLowerCase().includes(value));

      if (!matchesSearch) {
        return false;
      }

      if (filterMinQuantity && part.quantity < Number(filterMinQuantity)) {
        return false;
      }

      if (filterMaxQuantity && part.quantity > Number(filterMaxQuantity)) {
        return false;
      }

      if (filterMinPrice && part.unitPrice < Number(filterMinPrice)) {
        return false;
      }

      if (filterMaxPrice && part.unitPrice > Number(filterMaxPrice)) {
        return false;
      }

      if (filterLowStockOnly && part.quantity >= part.minimumStock) {
        return false;
      }

      if (
        filterLabelIds.length > 0 &&
        !filterLabelIds.every((tagId) => partLabelIds.includes(tagId))
      ) {
        return false;
      }

      if (
        filterExcludedLabelIds.length > 0 &&
        filterExcludedLabelIds.some((tagId) => partLabelIds.includes(tagId))
      ) {
        return false;
      }

      if (
        filterTaskLabelIds.length > 0 &&
        !filterTaskLabelIds.every((tagId) => taskLabelIds.has(tagId))
      ) {
        return false;
      }

      return true;
    });
  }, [
    spareParts,
    search,
    filterMinQuantity,
    filterMaxQuantity,
    filterMinPrice,
    filterMaxPrice,
    filterLowStockOnly,
    filterLabelIds,
    filterExcludedLabelIds,
    filterTaskLabelIds,
    taskLabelIdsBySparePart,
  ]);

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

  function renderLabelFilterDropdown(
    placeholder: string,
    tagIds: number[],
    setter: Dispatch<SetStateAction<number[]>>,
    dropdownKey: Exclude<SparePartLabelFilterDropdown, null>,
  ) {
    const selectedTags = tags.filter((tag) => tagIds.includes(tag.id));

    return (
      <div className="task-filter-dropdown spare-part-label-dropdown">
        <button
          type="button"
          className="task-filter-dropdown-trigger spare-part-label-trigger"
          onClick={() =>
            setOpenLabelFilter((current) =>
              current === dropdownKey ? null : dropdownKey,
            )
          }
        >
          {selectedTags.length === 0 ? (
            <span>{placeholder}</span>
          ) : (
            <span className="spare-part-filter-chip-list">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="task-filter-tag-chip"
                  style={{
                    color: tag.color || "#087fbd",
                    borderColor: tag.color || "#087fbd",
                    background: `${tag.color || "#087fbd"}1a`,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </span>
          )}
        </button>

        {openLabelFilter === dropdownKey && (
          <div className="task-filter-dropdown-panel spare-part-label-panel">
            <button
              type="button"
              className={`task-filter-dropdown-row ${
                tagIds.length === 0 ? "selected" : ""
              }`}
              onClick={() => {
                setter([]);
                setOpenLabelFilter(null);
              }}
            >
              Tous
              {tagIds.length === 0 && <CheckCircle2 size={16} />}
            </button>

            {tags.map((tag) => {
              const isSelected = tagIds.includes(tag.id);

              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`task-filter-dropdown-row ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => {
                    setter((current) =>
                      current.includes(tag.id)
                        ? current.filter((id) => id !== tag.id)
                        : [...current, tag.id],
                    );
                  }}
                >
                  <span
                    className="task-filter-tag-chip"
                    style={{
                      color: tag.color || "#087fbd",
                      borderColor: tag.color || "#087fbd",
                      background: `${tag.color || "#087fbd"}1a`,
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
    );
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

  function getExportOptions() {
    return {
      title: "Pieces detachees",
      fileName: "pieces-detachees",
      headers: ["Piece detachee", "Code", "Stock", "Emplacement", "Prix"],
      rows: filteredSpareParts.map((part) => [
        part.name,
        part.code || "-",
        part.quantity,
        part.location || "-",
        `${part.unitPrice} ${part.currency}`,
      ]),
    };
  }

  function exportCsv() {
    exportTableCsv(getExportOptions());
  }

  function exportPdf() {
    exportTablePdf(getExportOptions());
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

        <div className="resource-header-actions">
          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportPdf}
            disabled={filteredSpareParts.length === 0}
          >
            <Download size={16} />
            PDF
          </button>

          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportCsv}
            disabled={filteredSpareParts.length === 0}
          >
            <Download size={16} />
            CSV
          </button>

          <button
            type="button"
            className="supplier-primary-button"
            onClick={() => navigate("/admin/spare-parts/create")}
          >
            <CirclePlus size={19} />
            Ajouter une pièce détachée
          </button>
        </div>
      </div>

      {error && (
        <div className="supplier-error-message">
          {error}
        </div>
      )}

      <div className="supplier-toolbar-row">
        <div className="supplier-search-bar">
          <Search size={18} />

          <input
            type="search"
            placeholder="Rechercher une pièce détachée..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
        <div className="task-filter-panel spare-parts-filter-panel">
          <div className="task-filter-grid">
            <div className="task-filter-field">
              <label>
                <Hash size={15} />
                Quantité minimum
              </label>
              <input
                type="number"
                min={0}
                value={filterMinQuantity}
                onChange={(e) => setFilterMinQuantity(e.target.value)}
              />
            </div>

            <div className="task-filter-field">
              <label>
                <Hash size={15} />
                Quantité maximum
              </label>
              <input
                type="number"
                min={0}
                value={filterMaxQuantity}
                onChange={(e) => setFilterMaxQuantity(e.target.value)}
              />
            </div>

            <div className="task-filter-field">
              <label>
                <CircleDollarSign size={15} />
                Prix unitaire minimum
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={filterMinPrice}
                onChange={(e) => setFilterMinPrice(e.target.value)}
              />
            </div>

            <div className="task-filter-field">
              <label>
                <CircleDollarSign size={15} />
                Prix unitaire maximum
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(e.target.value)}
              />
            </div>

            <div className="task-filter-field">
              <label>
                <TagIcon size={15} />
                Labels
              </label>
              {renderLabelFilterDropdown(
                "Tous",
                filterLabelIds,
                setFilterLabelIds,
                "labels",
              )}
            </div>

            <div className="task-filter-field">
              <label>
                <TagIcon size={15} />
                Labels exclus
              </label>
              {renderLabelFilterDropdown(
                "Tous",
                filterExcludedLabelIds,
                setFilterExcludedLabelIds,
                "excludedLabels",
              )}
            </div>

            <div className="task-filter-field">
              <label>
                <ListChecks size={15} />
                Labels des tâches
              </label>
              {renderLabelFilterDropdown(
                "Tous",
                filterTaskLabelIds,
                setFilterTaskLabelIds,
                "taskLabels",
              )}
            </div>
          </div>

          <div className="task-toggle-row">
            <span>
              <AlertTriangle size={16} />
              Le stock est inférieur au minimum
            </span>
            <input
              type="checkbox"
              checked={filterLowStockOnly}
              onChange={(e) => setFilterLowStockOnly(e.target.checked)}
            />
          </div>

          <div className="task-filter-actions">
            <button
              type="button"
              className="task-filter-reset"
              onClick={() => {
                setFilterMinQuantity("");
                setFilterMaxQuantity("");
                setFilterMinPrice("");
                setFilterMaxPrice("");
                setFilterLowStockOnly(false);
                setFilterLabelIds([]);
                setFilterExcludedLabelIds([]);
                setFilterTaskLabelIds([]);
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

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
