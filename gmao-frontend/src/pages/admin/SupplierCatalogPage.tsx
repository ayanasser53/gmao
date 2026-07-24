import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

import {
  ArrowLeft,
  BatteryCharging,
  BookOpen,
  Building2,
  Cable,
  Copy,
  Factory,
  Info,
  Mail,
  Package,
  Search,
  ShieldCheck,
  Shirt,
  Trash2,
  Upload,
} from "lucide-react";

import {
  deleteSupplierCatalogItem,
  getImportedSupplierCatalog,
  importSupplierCatalog,
  uploadSupplierCatalogItemImage,
  type SupplierCatalogItemRequest,
} from "../../services/supplierCatalogService";

type CatalogItem = {
  id: number;
  equipment: string;
  category: string | null;
  brand: string | null;
  manufacturerReference: string | null;
  gtin: string | null;
  supplierId: number;
  image: string | null;
};

type CatalogSupplier = {
  id: number;
  name: string;
  logo: string | null;
  siren: string | null;
  phone: string | null;
  description: string | null;
  official: boolean;
};

type StoredCatalog = {
  items: CatalogItem[];
  suppliers: CatalogSupplier[];
};

const catalogItemsPerPage = 5;
const BACKEND_URL = "http://localhost:8090";

const officialSuppliers: CatalogSupplier[] = [
  {
    id: -1,
    name: "RS Components SAS",
    logo: "RS",
    siren: "334 534 039 00030",
    phone: "+33684780535",
    description:
      "RS Components est distributeur de materiel et composants electriques, electroniques et electromecaniques. Nous proposons une gamme de 600 000 produits venant de marques leaders.",
    official: true,
  },
  {
    id: -2,
    name: "Rexel France",
    logo: "Rexel",
    siren: "309 304 616 00045",
    phone: "+33141858000",
    description:
      "Rexel France accompagne les professionnels dans leurs besoins en materiel electrique, automatisme, energie et maintenance industrielle.",
    official: true,
  },
  {
    id: -3,
    name: "Siemens Industry",
    logo: "Siemens",
    siren: "562 016 774 00030",
    phone: "+33185570000",
    description:
      "Siemens Industry fournit des solutions industrielles, automatismes, composants et equipements pour la production et la maintenance.",
    official: true,
  },
];

const officialCatalogItems: CatalogItem[] = [
  {
    id: -1,
    equipment: "Alphashield S1BH Small",
    category: "Vetements de protection",
    brand: "Alpha Solway",
    manufacturerReference: "Alphashield S1BH S",
    gtin: "",
    supplierId: -1,
    image: null,
  },
  {
    id: -2,
    equipment: "Connecteurs pour CI pas < 5mm - Weidmuller",
    category: "PROCESS INDUSTRIEL",
    brand: "Weidmuller",
    manufacturerReference: "",
    gtin: "4050118549942",
    supplierId: -2,
    image: null,
  },
  {
    id: -3,
    equipment: "500VA VALUE UPS",
    category: "Alimentations interruptibles",
    brand: "OPTI",
    manufacturerReference: "TS500B",
    gtin: "5056070937161",
    supplierId: -1,
    image: null,
  },
  {
    id: -4,
    equipment: "CABLE DE SIGNAUX PREEQUIPE",
    category: "Automatisme industriel",
    brand: "Siemens",
    manufacturerReference: "6FX50022DC101DB5",
    gtin: "",
    supplierId: -3,
    image: null,
  },
];

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line: string, separator: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && quoted && nextChar === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === separator && !quoted) {
      values.push(value.trim());
      value = "";
      continue;
    }

    value += char;
  }

  values.push(value.trim());
  return values;
}

function parseCsv(content: string) {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    return [];
  }

  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = parseCsvLine(lines[0], separator).map(normalizeHeader);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line, separator);

    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

async function parseExcel(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  return rows.map((row) => {
    return Object.entries(row).reduce<Record<string, unknown>>((normalizedRow, [key, value]) => {
      normalizedRow[normalizeHeader(key)] = value;
      return normalizedRow;
    }, {});
  });
}

function pickField(row: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function getLogoClass(logo: string | null) {
  return (logo || "import").toLowerCase().replace(/[^a-z0-9]/g, "") || "import";
}

function getImportedLogo(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "FC";
}

function SupplierLogo({ supplier }: { supplier: CatalogSupplier }) {
  return (
    <div className={`catalog-logo catalog-logo-${getLogoClass(supplier.logo)}`}>
      {supplier.logo || getImportedLogo(supplier.name)}
    </div>
  );
}

function getCatalogImageUrl(image: string | null) {
  if (!image) {
    return null;
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:")
  ) {
    return image;
  }

  return `${BACKEND_URL}${image.startsWith("/") ? image : `/${image}`}`;
}

function CatalogItemVisual({ item }: { item: CatalogItem }) {
  const imageUrl = getCatalogImageUrl(item.image);

  return (
    <div className="catalog-item-visual">
      {imageUrl ? (
        <img src={imageUrl} alt={item.equipment} />
      ) : (
        <CatalogItemIcon category={item.category} />
      )}
    </div>
  );
}

function CatalogItemIcon({ category }: { category: string | null }) {
  const lowerCategory = (category || "").toLowerCase();

  if (lowerCategory.includes("vetement")) {
    return <Shirt size={38} />;
  }

  if (lowerCategory.includes("alimentation")) {
    return <BatteryCharging size={42} />;
  }

  if (lowerCategory.includes("automatisme")) {
    return <Cable size={42} />;
  }

  return <Package size={42} />;
}

function SupplierCatalogPage() {
  const [search, setSearch] = useState("");
  const [selectedOption, setSelectedOption] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState<CatalogSupplier | null>(null);
  const [storedCatalog, setStoredCatalog] = useState<StoredCatalog>({
    items: [],
    suppliers: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const suppliers = useMemo(
    () => [...officialSuppliers, ...storedCatalog.suppliers],
    [storedCatalog.suppliers],
  );

  const catalogItems = useMemo(
    () => [...officialCatalogItems, ...storedCatalog.items],
    [storedCatalog.items],
  );

  const supplierById = useMemo(() => {
    return new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  }, [suppliers]);

  const supplierReferenceCounts = useMemo(() => {
    const counts = new Map<number, number>();

    catalogItems.forEach((item) => {
      counts.set(item.supplierId, (counts.get(item.supplierId) ?? 0) + 1);
    });

    return counts;
  }, [catalogItems]);

  useEffect(() => {
    getImportedSupplierCatalog()
      .then((catalog) => {
        setStoredCatalog({
          items: catalog.items,
          suppliers: catalog.suppliers,
        });
      })
      .catch(() => {
        setImportError("Impossible de charger le catalogue importe depuis la base.");
      });
  }, []);

  const getSupplier = useCallback(
    (id: number) => supplierById.get(id) ?? officialSuppliers[0],
    [supplierById],
  );

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    return catalogItems.filter((item) => {
      const supplier = getSupplier(item.supplierId);
      const fields = [
        item.equipment,
        item.category,
        item.brand,
        item.manufacturerReference,
        item.gtin,
        supplier.name,
      ];
      const matchesSearch =
        !value || fields.some((field) => String(field ?? "").toLowerCase().includes(value));

      if (selectedOption === "official") {
        return matchesSearch && supplier.official;
      }

      if (selectedOption === "imported") {
        return matchesSearch && !supplier.official;
      }

      if (selectedOption.startsWith("supplier-")) {
        return matchesSearch && item.supplierId === Number(selectedOption.slice(9));
      }

      return matchesSearch;
    });
  }, [catalogItems, getSupplier, search, selectedOption]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedOption]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / catalogItemsPerPage));

  const paginatedItems = useMemo(() => {
    const safePage = Math.min(currentPage, pageCount);
    const start = (safePage - 1) * catalogItemsPerPage;

    return filteredItems.slice(start, start + catalogItemsPerPage);
  }, [currentPage, filteredItems, pageCount]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const selectedReferenceLabel = useMemo(() => {
    if (selectedOption === "official") {
      return "References officielles";
    }

    if (selectedOption === "imported") {
      return "References importees";
    }

    if (selectedOption.startsWith("supplier-")) {
      const supplier = getSupplier(Number(selectedOption.slice(9)));
      return supplier.name;
    }

    return "Toutes les references";
  }, [getSupplier, selectedOption]);

  async function handleImportCatalog(file: File | null) {
    if (!file) {
      return;
    }

    setImportError("");
    setImportMessage("");

    try {
      const fileName = file.name.toLowerCase();
      const isExcelFile = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
      const content = isExcelFile ? "" : await file.text();
      const parsedValue = isExcelFile
        ? await parseExcel(file)
        : fileName.endsWith(".json")
          ? JSON.parse(content)
          : parseCsv(content);
      const rows = Array.isArray(parsedValue)
        ? parsedValue
        : Array.isArray(parsedValue.items)
          ? parsedValue.items
          : [];

      if (rows.length === 0) {
        throw new Error("empty");
      }

      const importItems: SupplierCatalogItemRequest[] = [];

      rows.forEach((rawRow: unknown) => {
        const row = rawRow as Record<string, unknown>;
        const equipment = pickField(row, [
          "equipement",
          "equipment",
          "nom",
          "name",
          "article",
        ]);

        if (!equipment) {
          return;
        }

        const supplierName =
          pickField(row, ["fournisseur", "supplier", "supplierName"]) ||
          "Fournisseur importe";

        importItems.push({
          equipment,
          category: pickField(row, ["categorie", "category"]),
          brand: pickField(row, ["marque", "brand"]),
          manufacturerReference: pickField(row, [
            "referenceFabricant",
            "reference fabricant",
            "manufacturerReference",
            "manufacturer reference",
            "ref fabricant",
          ]),
          gtin: pickField(row, [
            "gtin",
            "ean",
            "gtin ean",
            "gtin / ean",
            "codeGtinEan",
            "code gtin ean",
          ]),
          supplierName,
          supplierLogo:
            pickField(row, [
              "logoFournisseur",
              "logo fournisseur",
              "supplierLogo",
              "supplier logo",
              "logo",
            ]) || getImportedLogo(supplierName),
          supplierSiren: pickField(row, ["siren", "siret", "siren siret", "siren / siret"]),
          supplierPhone: pickField(row, ["telephone", "phone"]),
          supplierDescription: pickField(row, ["description"]),
          image: pickField(row, ["image", "photo", "imageProduit", "image produit", "imageUrl", "image url"]),
        });
      });

      if (importItems.length === 0) {
        throw new Error("empty");
      }

      const savedCatalog = await importSupplierCatalog(importItems);

      setStoredCatalog({
        suppliers: savedCatalog.suppliers,
        items: savedCatalog.items,
      });
      setSelectedOption("all");
      setImportMessage(
        `${importItems.length.toLocaleString("fr-FR")} reference(s) importee(s) dans MySQL.`,
      );
    } catch {
      setImportError(
        "Import impossible. Utilisez un fichier CSV, Excel ou JSON avec une colonne equipement.",
      );
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  }

  async function copyReference(item: CatalogItem) {
    const reference = item.manufacturerReference || item.gtin || item.equipment;

    try {
      await navigator.clipboard.writeText(reference);
      setImportMessage("Reference copiee.");
      setImportError("");
    } catch {
      setImportError("Impossible de copier la reference.");
    }
  }

  async function deleteCatalogItem(item: CatalogItem) {
    if (item.id <= 0) {
      setImportError("Les references officielles ne sont pas supprimees localement.");
      setImportMessage("");
      return;
    }

    const confirmed = window.confirm(`Supprimer la reference "${item.equipment}" ?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteSupplierCatalogItem(item.id);

      setStoredCatalog((currentCatalog) => ({
        suppliers: currentCatalog.suppliers,
        items: currentCatalog.items.filter((currentItem) => currentItem.id !== item.id),
      }));
      setImportMessage("Reference supprimee.");
      setImportError("");
    } catch {
      setImportError("Suppression impossible dans la base.");
      setImportMessage("");
    }
  }

  async function uploadCatalogImage(item: CatalogItem, file: File | null) {
    if (!file) {
      return;
    }

    if (item.id <= 0) {
      setImportError("Importez d'abord cette reference dans MySQL avant d'ajouter une photo.");
      setImportMessage("");
      return;
    }

    try {
      const updatedItem = await uploadSupplierCatalogItemImage(item.id, file);

      setStoredCatalog((currentCatalog) => ({
        suppliers: currentCatalog.suppliers,
        items: currentCatalog.items.map((currentItem) =>
          currentItem.id === updatedItem.id
            ? {
                ...currentItem,
                image: updatedItem.image,
              }
            : currentItem,
        ),
      }));
      setImportMessage("Photo catalogue enregistree dans MySQL.");
      setImportError("");
    } catch {
      setImportError("Enregistrement de la photo impossible.");
      setImportMessage("");
    } finally {
      const input = imageInputRefs.current[item.id];
      if (input) {
        input.value = "";
      }
    }
  }

  if (selectedSupplier) {
    return (
      <section className="supplier-catalog-workspace">
        <div className="catalog-detail-header">
          <div className="catalog-detail-title">
            {selectedSupplier.official && <span className="catalog-official-badge">Officiel</span>}
            <h1>{selectedSupplier.name}</h1>
          </div>

          <button
            type="button"
            className="catalog-back-button"
            onClick={() => setSelectedSupplier(null)}
          >
            <ArrowLeft size={18} />
            Retour au catalogue
          </button>
        </div>

        <div className="catalog-detail-card">
          <div className="catalog-detail-main">
            <button type="button" className="catalog-contact-button">
              <Mail size={18} />
              Contact
            </button>

            <div className="catalog-detail-info">
              <p>
                <strong>SIREN ou SIRET:</strong> {selectedSupplier.siren || "-"}
              </p>
              <p>
                <strong>Telephone:</strong> {selectedSupplier.phone || "-"}
              </p>
              <p className="catalog-detail-description">
                {selectedSupplier.description || "Aucune description renseignee."}
              </p>
            </div>
          </div>

          <SupplierLogo supplier={selectedSupplier} />
        </div>
      </section>
    );
  }

  return (
    <section className="supplier-catalog-workspace">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <BookOpen size={30} />
            <h1>Catalogue fournisseurs</h1>
          </div>
        </div>
      </div>

      <div className="catalog-toolbar">
        <div className="supplier-search-bar catalog-search-bar">
          <Search size={18} />
          <input
            type="search"
            placeholder="Rechercher dans le catalogue"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="catalog-select"
          value={selectedOption}
          onChange={(event) => setSelectedOption(event.target.value)}
        >
          <option value="all">Toutes les references</option>
          <option value="official">References officielles</option>
          <option value="imported">References importees</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={`supplier-${supplier.id}`}>
              {supplier.name} ({supplierReferenceCounts.get(supplier.id) ?? 0})
            </option>
          ))}
        </select>

        <input
          ref={importInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/json"
          className="catalog-import-input"
          onChange={(event) => {
            void handleImportCatalog(event.target.files?.[0] ?? null);
          }}
        />

        <button
          type="button"
          className="catalog-import-button"
          onClick={() => importInputRef.current?.click()}
        >
          <Upload size={18} />
          Importer le catalogue
        </button>
      </div>

      {(importMessage || importError) && (
        <div className={`catalog-import-feedback ${importError ? "error" : ""}`}>
          {importError || importMessage}
        </div>
      )}

      <div className="catalog-reference-card">
        <div className="catalog-reference-header">
          <ShieldCheck size={22} />
          <span>{selectedReferenceLabel}</span>
          <strong>{filteredItems.length.toLocaleString("fr-FR")}</strong>
        </div>

        <div className="catalog-table-wrapper">
          <table className="catalog-table">
            <thead>
              <tr>
                <th></th>
                <th>
                  <Factory size={20} />
                  Equipement
                </th>
                <th>Categorie</th>
                <th>Marque</th>
                <th>Reference fabricant</th>
                <th>Code GTIN/EAN</th>
                <th>
                  <Building2 size={18} />
                  Fournisseur
                </th>
                <th className="catalog-actions-header">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedItems.map((item) => {
                const supplier = getSupplier(item.supplierId);

                return (
                  <tr key={item.id}>
                    <td>
                      <CatalogItemVisual item={item} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="catalog-link-button"
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        {item.equipment}
                      </button>
                    </td>
                    <td>{item.category || "-"}</td>
                    <td>{item.brand || "-"}</td>
                    <td>{item.manufacturerReference || "-"}</td>
                    <td>{item.gtin || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="catalog-supplier-cell"
                        onClick={() => setSelectedSupplier(supplier)}
                      >
                        <SupplierLogo supplier={supplier} />
                        <span>{supplier.name}</span>
                      </button>
                    </td>
                    <td>
                      <div className="catalog-actions">
                        <button
                          type="button"
                          aria-label="Voir les informations"
                          onClick={() => setSelectedSupplier(supplier)}
                        >
                          <Info size={19} />
                        </button>
                        <button
                          type="button"
                          aria-label="Copier la reference"
                          onClick={() => {
                            void copyReference(item);
                          }}
                        >
                          <Copy size={19} />
                        </button>
                        <input
                          ref={(element) => {
                            imageInputRefs.current[item.id] = element;
                          }}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="catalog-import-input"
                          onChange={(event) =>
                            void uploadCatalogImage(item, event.target.files?.[0] ?? null)
                          }
                        />
                        <button
                          type="button"
                          aria-label="Ajouter une photo catalogue"
                          onClick={() => imageInputRefs.current[item.id]?.click()}
                        >
                          <Upload size={19} />
                        </button>
                        <button
                          type="button"
                          className="catalog-delete-action"
                          aria-label="Supprimer la reference"
                          onClick={() => void deleteCatalogItem(item)}
                        >
                          <Trash2 size={19} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="catalog-pagination" aria-label="Pagination du catalogue">
            <button
              type="button"
              className="catalog-page-arrow"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              aria-label="Page precedente"
            >
              ‹
            </button>

            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                key={page}
                className={`catalog-page-button ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="catalog-page-arrow"
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              disabled={currentPage === pageCount}
              aria-label="Page suivante"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default SupplierCatalogPage;
