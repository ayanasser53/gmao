import {
  BadgeCheck,
  Edit3,
  Mail,
  Phone,
  Save,
  Tags,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getCurrentUser, updateUser } from "../services/userService";
import type { UserDetail, UserRole } from "../types/user";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
  TECHNICIAN: "Technicien",
  PRODUCTION: "Operateur",
  SERVICE_PROVIDER: "Prestataire",
};

function formatHourlyRate(value: number | null): string {
  if (value === null || value === undefined) {
    return "Non renseigne";
  }

  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} EUR / h`;
}

function ProfilePage() {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    async function loadProfile(): Promise<void> {
      try {
        setUser(await getCurrentUser());
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger les informations du profil.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "",
      password: "",
    });
  }, [user]);

  const fullName = useMemo(() => {
    if (!user) {
      return "";
    }

    return `${user.firstName} ${user.lastName}`.trim();
  }, [user]);

  function updateForm(field: keyof typeof form, value: string): void {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function cancelEdit(): void {
    if (!user) {
      return;
    }

    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "",
      password: "",
    });
    setEditing(false);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();

    if (!user) {
      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError("Merci de remplir le prenom, le nom et l'email.");
      return;
    }

    if (form.password && form.password.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const savedUser = await updateUser(user.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password || undefined,
        role: user.role,
        hourlyRate: user.hourlyRate,
        tagIds: user.tags.map((tag) => tag.id),
      });

      localStorage.setItem("email", savedUser.email);
      setUser(savedUser);
      setEditing(false);
      setSuccess("Profil mis a jour.");
    } catch (requestError) {
      console.error(requestError);
      setError("La mise a jour du profil a echoue. Verifiez que l'email n'est pas deja utilise.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-page profile-page">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <UserCircle size={30} />
            <h1>Mon profil</h1>
          </div>
        </div>

        {user && !editing && (
          <button
            type="button"
            className="resource-primary-button"
            onClick={() => {
              setEditing(true);
              setError("");
              setSuccess("");
            }}
          >
            <Edit3 size={17} />
            Modifier
          </button>
        )}
      </div>

      {loading && <div className="resource-loading">Chargement...</div>}

      {!loading && error && <div className="resource-error-message">{error}</div>}

      {!loading && success && <div className="profile-success-message">{success}</div>}

      {!loading && user && (
        <div className="profile-grid">
          <section className="profile-summary-panel">
            <div className="profile-avatar">
              <UserCircle size={62} />
            </div>

            <div>
              <span className="profile-eyebrow">Compte utilisateur</span>
              <h2>{fullName || user.email}</h2>
              <p>{ROLE_LABELS[user.role]}</p>
            </div>

            <span className={`profile-status ${user.active ? "active" : "inactive"}`}>
              <BadgeCheck size={16} />
              {user.active ? "Actif" : "Inactif"}
            </span>
          </section>

          {editing ? (
            <form className="profile-card profile-edit-card" onSubmit={handleSubmit}>
              <h3>Modifier mes informations</h3>

              <div className="profile-form-grid">
                <label>
                  Prenom <span>*</span>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(event) => updateForm("firstName", event.target.value)}
                  />
                </label>

                <label>
                  Nom <span>*</span>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(event) => updateForm("lastName", event.target.value)}
                  />
                </label>

                <label>
                  Email <span>*</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateForm("email", event.target.value)}
                  />
                </label>

                <label>
                  Telephone
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateForm("phone", event.target.value)}
                  />
                </label>

                <label className="profile-form-wide">
                  Nouveau mot de passe
                  <input
                    type="password"
                    placeholder="Laisser vide pour ne pas changer"
                    value={form.password}
                    onChange={(event) => updateForm("password", event.target.value)}
                  />
                </label>
              </div>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="measure-cancel-button"
                  disabled={submitting}
                  onClick={cancelEdit}
                >
                  <X size={17} />
                  Annuler
                </button>

                <button
                  type="submit"
                  className="measure-primary-button"
                  disabled={submitting}
                >
                  <Save size={17} />
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <section className="profile-card">
                <h3>Informations personnelles</h3>

                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span>Prenom</span>
                    <strong>{user.firstName || "Non renseigne"}</strong>
                  </div>

                  <div className="profile-info-item">
                    <span>Nom</span>
                    <strong>{user.lastName || "Non renseigne"}</strong>
                  </div>

                  <div className="profile-info-item">
                    <span>Role</span>
                    <strong>{ROLE_LABELS[user.role]}</strong>
                  </div>

                  <div className="profile-info-item">
                    <span>Taux horaire</span>
                    <strong>{formatHourlyRate(user.hourlyRate)}</strong>
                  </div>
                </div>
              </section>

              <section className="profile-card">
                <h3>Contact</h3>

                <div className="profile-contact-list">
                  <div>
                    <Mail size={19} />
                    <span>{user.email}</span>
                  </div>

                  <div>
                    <Phone size={19} />
                    <span>{user.phone || "Telephone non renseigne"}</span>
                  </div>
                </div>
              </section>
            </>
          )}

          <section className="profile-card">
            <h3>Organisation</h3>

            <div className="profile-collection">
              <div className="profile-collection-title">
                <Users size={18} />
                Equipes
              </div>

              {user.teams.length === 0 ? (
                <p>Aucune equipe associee.</p>
              ) : (
                <div className="profile-chip-list">
                  {user.teams.map((team) => (
                    <span key={team.id}>{team.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="profile-collection">
              <div className="profile-collection-title">
                <Tags size={18} />
                Tags
              </div>

              {user.tags.length === 0 ? (
                <p>Aucun tag associe.</p>
              ) : (
                <div className="profile-chip-list">
                  {user.tags.map((tag) => (
                    <span
                      key={tag.id}
                      style={{
                        borderColor: tag.color,
                        color: tag.color,
                        background: `${tag.color}1a`,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      )}
    </section>
  );
}

export default ProfilePage;
