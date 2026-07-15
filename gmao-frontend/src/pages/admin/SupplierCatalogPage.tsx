import { useMemo, useState } from "react";

import {
  ArrowLeft,
  BatteryCharging,
  BookOpen,
  Building2,
  Cable,
  Copy,
  Factory,
  Mail,
  Package,
  Search,
  ShieldCheck,
  Shirt,
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
  logo: "RS" | "Rexel" | "Siemens";
  siren: string;
  phone: string;
  description: string;
  official: boolean;
};

const suppliers: CatalogSupplier[] = [
  {
    id: 1,
    name: "RS Components SAS",
    logo: "RS",
    siren: "334 534 039 00030",
    phone: "+33684780535",
    description:
      "RS Components est distributeur de matériel et composants électriques, électroniques et électromécaniques. Nous proposons une gamme de 600 000 produits venant de marques leaders.",
    official: true,
  },
  {
    id: 2,
    name: "Rexel France",
    logo: "Rexel",
    siren: "309 304 616 00045",
    phone: "+33141858000",
    description:
      "Rexel France accompagne les professionnels dans leurs besoins en matériel électrique, automatisme, énergie et maintenance industrielle.",
    official: true,
  },
  {
    id: 3,
    name: "Siemens Industry",
    logo: "Siemens",
    siren: "562 016 774 00030",
    phone: "+33185570000",
    description:
      "Siemens Industry fournit des solutions industrielles, automatismes, composants et équipements pour la production et la maintenance.",
    official: true,
  },
];

const catalogItems: CatalogItem[] = [
  {
    id: 1,
    equipment: "Alphashield S1BH Small",
    category: "Vêtements de protection",
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

function getSupplier(id: number): CatalogSupplier {
  return suppliers.find((supplier) => supplier.id === id) ?? suppliers[0];
}

function SupplierLogo({ supplier }: { supplier: CatalogSupplier }) {
  return (
    <div className={`catalog-logo catalog-logo-${supplier.logo.toLowerCase()}`}>
      {supplier.logo}
    </div>
  );
}

function CatalogItemIcon({ category }: { category: string }) {
  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes("vêtement")) {
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
  const [selectedOption, setSelectedOption] = useState("official");
  const [selectedSupplier, setSelectedSupplier] = useState<CatalogSupplier | null>(null);

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    return catalogItems.filter((item) => {
      const supplier = getSupplier(item.supplierId);
      const matchesSearch = !value || [
        item.equipment,
        item.category,
        item.brand,
        item.manufacturerReference,
        item.gtin,
        supplier.name,
      ].some((field) => field.toLowerCase().includes(value));

      if (selectedOption === "official") {
        return matchesSearch && supplier.official;
      }

      return matchesSearch;
    });
  }, [search, selectedOption]);

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
                <strong>SIREN ou SIRET:</strong> {selectedSupplier.siren}
              </p>
              <p>
                <strong>Téléphone:</strong> {selectedSupplier.phone}
              </p>
              <p className="catalog-detail-description">
                « {selectedSupplier.description} »
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
          <option value="official">Références officielles</option>
          <option value="all">Toutes les références</option>
        </select>
      </div>

      <div className="catalog-reference-card">
        <div className="catalog-reference-header">
          <ShieldCheck size={22} />
          <span>Références officielles</span>
          <strong>{filteredItems.length.toLocaleString("fr-FR")}</strong>
        </div>

        <div className="catalog-table-wrapper">
          <table className="catalog-table">
            <thead>
              <tr>
                <th></th>
                <th>
                  <Factory size={20} />
                  Équipement
                </th>
                <th>Catégorie</th>
                <th>Marque</th>
                <th>Référence fabricant</th>
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
                    <td>{item.category}</td>
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
                        <button type="button" aria-label="Contacter le fournisseur">
                          <Mail size={19} />
                        </button>
                        <button type="button" aria-label="Copier la référence">
                          <Copy size={19} />
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