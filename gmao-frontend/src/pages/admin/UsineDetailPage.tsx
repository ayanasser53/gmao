import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Mail,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";

import { getUsine } from "../../services/usineService";
import { setImpersonatedUsine } from "../../services/impersonation";
import type { Usine } from "../../types/usine";

import "./usines-styles.css";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function UsineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [usine, setUsine] = useState<Usine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load(): Promise<void> {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getUsine(Number(id));
        setUsine(data);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Impossible de charger les informations de cette usine.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  function handleViewDashboard(): void {
    if (!usine) {
      return;
    }

    setImpersonatedUsine({ id: usine.id, name: usine.name });
    navigate("/admin/dashboard");
  }

  if (loading) {
    return (
      <section className="usines-workspace">
        <div className="resource-loading">Chargement...</div>
      </section>
    );
  }

  if (error || !usine) {
    return (
      <section className="usines-workspace">
        <div className="resource-error-message">
          {error || "Usine introuvable."}
        </div>
      </section>
    );
  }

  const infoFields = [
    {
      label: "Adresse",
      value: usine.address || "Non renseignée",
      icon: <Building2 size={20} />,
    },
    {
      label: "Téléphone",
      value: usine.phone || "Non renseigné",
      icon: <Phone size={20} />,
    },
    {
      label: "Email",
      value: usine.email || "Non renseigné",
      icon: <Mail size={20} />,
    },
    {
      label: "Utilisateurs",
      value: `${usine.userCount} utilisateur${usine.userCount > 1 ? "s" : ""}`,
      icon: <Users size={20} />,
    },
    {
      label: "Créée le",
      value: formatDate(usine.createdAt),
      icon: <CalendarDays size={20} />,
    },
  ];

  return (
    <section className="usines-workspace">
      <button
        type="button"
        className="usine-back-link"
        onClick={() => navigate("/admin/usines")}
      >
        <ArrowLeft size={18} />
        Retour aux usines
      </button>

      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <ShieldCheck size={28} />
            <h1>{usine.name}</h1>

            <span
              className={`resource-type-badge ${
                usine.active ? "resource-type-number" : "resource-type-text"
              }`}
            >
              {usine.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="resource-primary-button usine-view-dashboard-button"
          onClick={handleViewDashboard}
          disabled={!usine.active}
          title={
            usine.active
              ? "Voir le tableau de bord de cette usine"
              : "Cette usine est inactive"
          }
        >
          <LayoutDashboard size={18} />
          Voir le dashboard
        </button>
      </div>

      <div className="usine-stats-grid">
        {infoFields.map((field) => (
          <div className="usine-stat-card" key={field.label}>
            <div className="usine-stat-icon">{field.icon}</div>
            <div>
              <div className="usine-info-value">{field.value}</div>
              <div className="usine-stat-label">{field.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default UsineDetailPage;
