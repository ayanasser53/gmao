import {
  CalendarCheck,
  Search,
  ShoppingCart,
  UsersRound,
} from "lucide-react";

import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/admin/equipment": "Équipements",
  "/admin/spare-parts": "Pièces de rechange",
  "/admin/tasks": "Tâches",
  "/admin/activities": "Activités",
  "/admin/suppliers": "Fournisseurs",
  "/admin/supplier-catalog": "Catalogue fournisseurs",
  "/admin/purchase-orders": "Commandes d’achat",
  "/admin/teams": "Équipes",
  "/admin/notifications": "Notifications",
  "/admin/profile": "Mon profil",
  "/admin/maintenance-plans": "Plans de maintenance",
  "/admin/measures": "Mesures",
"/admin/tags": "Tags",
};

const moduleDesigns = {
  "/admin/purchase-orders": {
    icon: ShoppingCart,
    title: "Commandes d'achat",
    searchPlaceholder: "Rechercher une commande d'achat...",
    stats: [
      { label: "Tout", value: "0" },
      { label: "Brouillon", value: "0" },
      { label: "En cours", value: "0" },
      { label: "Termine", value: "0" },
    ],
    columns: [
      "N° de commande",
      "Fournisseur",
      "Date de livraison",
      "Total",
      "Statut",
    ],
    empty: "Aucune commande d'achat trouvee.",
  },
  "/admin/teams": {
    icon: UsersRound,
    title: "Equipes",
    searchPlaceholder: "Rechercher une equipe...",
    stats: [
      { label: "Toutes", value: "0" },
      { label: "Actives", value: "0" },
      { label: "Membres", value: "0" },
    ],
    columns: [
      "Equipe",
      "Responsable",
      "Membres",
      "Tags",
      "Statut",
    ],
    empty: "Aucune equipe trouvee.",
  },
  "/admin/maintenance-plans": {
    icon: CalendarCheck,
    title: "Plans de maintenance",
    searchPlaceholder: "Rechercher un plan de maintenance...",
    stats: [
      { label: "Tous", value: "0" },
      { label: "Actifs", value: "0" },
      { label: "A venir", value: "0" },
      { label: "En retard", value: "0" },
    ],
    columns: [
      "Plan",
      "Equipement",
      "Frequence",
      "Prochaine date",
      "Statut",
    ],
    empty: "Aucun plan de maintenance trouve.",
  },
} as const;

function ModulePlaceholderPage() {
  const location = useLocation();

  const moduleDesign =
    moduleDesigns[location.pathname as keyof typeof moduleDesigns];

  if (moduleDesign) {
    const Icon = moduleDesign.icon;

    return (
      <section className="suppliers-workspace">
        <div className="suppliers-page-heading">
          <div className="suppliers-heading-content">
            <div className="suppliers-title">
              <Icon size={30} />
              <h1>{moduleDesign.title}</h1>
            </div>
          </div>
        </div>

        <div className="admin-placeholder-stats">
          {moduleDesign.stats.map((item) => (
            <div
              className="admin-placeholder-stat"
              key={item.label}
            >
              <div className="admin-placeholder-stat-icon">
                <Icon size={22} />
              </div>

              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="supplier-search-bar">
          <Search size={18} />

          <input
            type="search"
            placeholder={moduleDesign.searchPlaceholder}
            disabled
          />
        </div>

        <div className="supplier-table-wrapper">
          <table className="supplier-table">
            <thead>
              <tr>
                {moduleDesign.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={moduleDesign.columns.length}
                  className="admin-placeholder-empty"
                >
                  {moduleDesign.empty}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  const title =
    titles[location.pathname] ?? "Module administrateur";

  return (
    <section className="admin-module-page">
      <div className="admin-page-heading">
        <div>
          <span className="section-label">
            Espace administrateur
          </span>

          <h1>{title}</h1>

          <p>
            Ce module sera développé dans la prochaine étape.
          </p>
        </div>
      </div>

      <div className="admin-module-placeholder">
        <h2>{title}</h2>

        <p>
          La structure de navigation est prête. Nous pouvons maintenant
          développer les fonctionnalités de ce module.
        </p>
      </div>
    </section>
  );
}

export default ModulePlaceholderPage;
