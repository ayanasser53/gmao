import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type CatalogItem = {
  id: number;
  equipment: string;
  category: string;
  brand: string;
  manufacturerReference: string;
  gtin: string;
  supplierId: number;
};

type CatalogSupplier = {
  id: number;
  name: string;
  logo: string;
  siren: string;
  phone: string;
  description: string;
  official: boolean;
};

type StoredCatalog = {
  items: CatalogItem[];
  suppliers: CatalogSupplier[];
  removedItemIds: number[];
};

const catalogStorageKey = "gmao-supplier-catalog-imports";

const officialSuppliers: CatalogSupplier[] = [
  {
    id: 1,
    name: "RS Components SAS",
    logo: "RS",
    siren: "334 534 039 00030",
    phone: "+33684780535",
    description:
      "RS Components est distributeur de materiel et composants electriques, electroniques et electromecaniques. Nous proposons une gamme de 600 000 produits venant de marques leaders.",
    official: true,
  },
  {
    id: 2,
    name: "Rexel France",
    logo: "Rexel",
    siren: "309 304 616 00045",
    phone: "+33141858000",
    description:
      "Rexel France accompagne les professionnels dans leurs besoins en materiel electrique, automatisme, energie et maintenance industrielle.",
    official: true,
  },
  {
    id: 3,
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
    id: 1,
    equipment: "Alphashield S1BH Small",
    category: "Vetements de protection",
    brand: "Alpha Solway",
    manufacturerReference: "Alphashield S1BH S",
    gtin: "",
    supplierId: 1,
  },
  {
    id: 2,
    equipment: "Connecteurs pour CI pas < 5mm - Weidmuller",
    category: "PROCESS INDUSTRIEL",
    brand: "Weidmuller",
    manufacturerReference: "",
    gtin: "4050118549942",
    supplierId: 2,
  },
  {
    id: 3,
    equipment: "500VA VALUE UPS",
    category: "Alimentations interruptibles",
    brand: "OPTI",
    manufacturerReference: "TS500B",
    gtin: "5056070937161",
    supplierId: 1,
  },
  {
    id: 4,
    equipment: "CABLE DE SIGNAUX PREEQUIPE",
    category: "Automatisme industriel",
    brand: "Siemens",
    manufacturerReference: "6FX50022DC101DB5",
    gtin: "",
    supplierId: 3,
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

function pickField(row: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];

    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return "";
}

function readStoredCatalog(): StoredCatalog {
  try {
    const storedValue = localStorage.getItem(catalogStorageKey);

    if (!storedValue) {
      return { items: [], suppliers: [] };
    }

    const parsedValue = JSON.parse(storedValue) as Partial<StoredCatalog>;

    return {
      items: Array.isArray(parsedValue.items) ? parsedValue.items : [],
      suppliers: Array.isArray(parsedValue.suppliers) ? parsedValue.suppliers : [],
      removedItemIds: Array.isArray(parsedValue.removedItemIds)
        ? parsedValue.removedItemIds
        : [],
    };
  } catch {
    return { items: [], suppliers: [], removedItemIds: [] };
  }
}

function getLogoClass(logo: string) {
  return logo.toLowerCase().replace(/[^a-z0-9]/g, "") || "import";
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
      {supplier.logo}
    </div>
  );
}

function CatalogItemIcon({ category }: { category: string }) {
  const lowerCategory = category.toLowerCase();

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
  const [storedCatalog, setStoredCatalog] = useState<StoredCatalog>(() =>
    readStoredCatalog(),
  );
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const suppliers = useMemo(
    () => [...officialSuppliers, ...storedCatalog.suppliers],
    [storedCatalog.suppliers],
  );

  const catalogItems = useMemo(
    () =>
      [...officialCatalogItems, ...storedCatalog.items].filter(
        (item) => !storedCatalog.removedItemIds.includes(item.id),
      ),
    [storedCatalog.items, storedCatalog.removedItemIds],
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
    localStorage.setItem(catalogStorageKey, JSON.stringify(storedCatalog));
  }, [storedCatalog]);

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
        !value || fields.some((field) => field.toLowerCase().includes(value));

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
      const content = await file.text();
      const parsedValue = file.name.toLowerCase().endsWith(".json")
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

      const supplierMap = new Map<string, CatalogSupplier>();
      const nextSuppliers = [...storedCatalog.suppliers];
      const nextItems: CatalogItem[] = [];
      let nextSupplierId = Math.max(...suppliers.map((supplier) => supplier.id), 0) + 1;
      let nextItemId = Math.max(...catalogItems.map((item) => item.id), 0) + 1;

      suppliers.forEach((supplier) => {
        supplierMap.set(supplier.name.trim().toLowerCase(), supplier);
      });

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
        const supplierKey = supplierName.toLowerCase();
        let supplier = supplierMap.get(supplierKey);

        if (!supplier) {
          supplier = {
            id: nextSupplierId,
            name: supplierName,
            logo: getImportedLogo(supplierName),
            siren: pickField(row, ["siren", "siret"]),
            phone: pickField(row, ["telephone", "phone"]),
            description: pickField(row, ["description"]),
            official: false,
          };
          nextSupplierId += 1;
          nextSuppliers.push(supplier);
          supplierMap.set(supplierKey, supplier);
        }

        nextItems.push({
          id: nextItemId,
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
          gtin: pickField(row, ["gtin", "ean", "codeGtinEan", "code gtin ean"]),
          supplierId: supplier.id,
        });
        nextItemId += 1;
      });

      if (nextItems.length === 0) {
        throw new Error("empty");
      }

      setStoredCatalog((currentCatalog) => ({
        suppliers: nextSuppliers,
        items: [...currentCatalog.items, ...nextItems],
        removedItemIds: currentCatalog.removedItemIds,
      }));
      setSelectedOption("all");
      setImportMessage(
        `${nextItems.length.toLocaleString("fr-FR")} reference(s) importee(s).`,
      );
    } catch {
      setImportError(
        "Import impossible. Utilisez un fichier CSV ou JSON avec une colonne equipement.",
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

  function deleteCatalogItem(item: CatalogItem) {
    const confirmed = window.confirm(`Supprimer la reference "${item.equipment}" ?`);

    if (!confirmed) {
      return;
    }

    setStoredCatalog((currentCatalog) => ({
      suppliers: currentCatalog.suppliers,
      items: currentCatalog.items.filter((currentItem) => currentItem.id !== item.id),
      removedItemIds: currentCatalog.removedItemIds.includes(item.id)
        ? currentCatalog.removedItemIds
        : [...currentCatalog.removedItemIds, item.id],
    }));
    setImportMessage("Reference supprimee.");
    setImportError("");
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
          accept=".csv,.json,text/csv,application/json"
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
              {filteredItems.map((item) => {
                const supplier = getSupplier(item.supplierId);

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="catalog-item-visual">
                        <CatalogItemIcon category={item.category} />
                      </div>
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
                        <button
                          type="button"
                          className="catalog-delete-action"
                          aria-label="Supprimer la reference"
                          onClick={() => deleteCatalogItem(item)}
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
      </div>
    </section>
  );
}

export default SupplierCatalogPage;
