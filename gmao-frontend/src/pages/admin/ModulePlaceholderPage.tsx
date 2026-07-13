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

function ModulePlaceholderPage() {
  const location = useLocation();

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