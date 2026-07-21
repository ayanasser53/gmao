import { ArrowLeft, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getTags } from "../../services/tagService";
import {
  getUsersDetailed,
  inviteUser,
  updateUser,
} from "../../services/userService";
import type { Tag } from "../../types/tag";
import type { UserRole } from "../../types/user";

import "./task-styles.css";
import "./team-styles.css";

const ROLES: {
  value: UserRole;
  label: string;
  description: string;
  image: string;
}[] = [
  {
    value: "ADMIN",
    label: "Administrateur",
    description:
      "Peut ajouter et modifier les tâches, équipements, activités, et gérer les permissions des utilisateurs.",
    image: "/administrator.png",
  },
  {
    value: "TECHNICIAN",
    label: "Technicien",
    description:
      "Peut ajouter et assigner des tâches et activités. Ne peut pas modifier les équipements ni les permissions.",
    image: "/technician.png",
  },
  {
    value: "PRODUCTION",
    label: "Production",
    description:
      "Peut créer des tâches et compléter des checklists. Accès en lecture seule au reste de l'application.",
    image: "/production.png",
  },
  {
    value: "SERVICE_PROVIDER",
    label: "Prestataire",
    description:
      "Peut voir les activités des membres et créer des activités sur les tâches qui lui sont assignées.",
    image: "/service-provider.png",
  },
];

function InviteColleaguePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [step, setStep] = useState<"role" | "form">(isEdit ? "form" : "role");
  const [role, setRole] = useState<UserRole>("TECHNICIAN");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void getTags()
      .then(setTags)
      .catch((requestError) => console.error(requestError));
  }, []);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    void (async () => {
      try {
        const users = await getUsersDetailed();
        const user = users.find((item) => item.id === Number(id));

        if (!user) {
          setError("Collègue introuvable.");
          return;
        }

        setFirstName(user.firstName);
        setLastName(user.lastName);
        setEmail(user.email);
        setRole(user.role);
        setHourlyRate(
          user.hourlyRate !== null ? String(user.hourlyRate) : "",
        );
        setTagIds(user.tags.map((tag) => tag.id));
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger ce collègue.");
      }
    })();
  }, [id, isEdit]);

  function toggleTag(tagId: number) {
    setTagIds((current) =>
      current.includes(tagId)
        ? current.filter((value) => value !== tagId)
        : [...current, tagId],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      role,
      hourlyRate: hourlyRate ? Number(hourlyRate) : null,
      tagIds,
    };

    try {
      if (isEdit) {
        await updateUser(Number(id), payload);
      } else {
        await inviteUser(payload);
      }

      navigate("/admin/teams");
    } catch (requestError) {
      console.error(requestError);
      setError(
        "L'enregistrement a échoué. Vérifiez que l'email n'est pas déjà utilisé.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "role") {
    return (
      <section className="supplier-modal-page">
        <button
          type="button"
          className="supplier-form-backdrop"
          aria-label="Retour à l'équipe"
          onClick={() => navigate("/admin/teams")}
        />

        <aside className="supplier-form-drawer task-form-drawer team-role-drawer">
          <div className="measure-drawer-header">
            <button
              type="button"
              className="measure-drawer-back"
              onClick={() => navigate("/admin/teams")}
              aria-label="Retour à l'équipe"
            >
              <ArrowLeft size={22} />
            </button>
            <h2>Inviter un collègue</h2>
            <button
              type="button"
              className="measure-drawer-close"
              onClick={() => navigate("/admin/teams")}
              aria-label="Fermer"
            >
              <X size={21} />
            </button>
          </div>

          <div className="measure-drawer-body">
            <div className="team-role-grid">
              {ROLES.map((item) => (
                <div className="team-role-card" key={item.value}>
                  <img src={item.image} alt={item.label} />
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                  <button
                    type="button"
                    className="measure-primary-button"
                    onClick={() => {
                      setRole(item.value);
                      setStep("form");
                    }}
                  >
                    Sélectionner
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    );
  }

  const selectedRole = ROLES.find((item) => item.value === role) ?? ROLES[1];

  return (
    <section className="supplier-modal-page">
      <button
        type="button"
        className="supplier-form-backdrop"
        aria-label="Retour à l'équipe"
        onClick={() => navigate("/admin/teams")}
      />

      <aside className="supplier-form-drawer task-form-drawer">
        <form
          className="measure-drawer-content"
          onSubmit={handleSubmit}
        >
          <div className="measure-drawer-header">
            <button
              type="button"
              className="measure-drawer-back"
              onClick={() =>
                isEdit ? navigate("/admin/teams") : setStep("role")
              }
              aria-label="Retour"
            >
              <ArrowLeft size={22} />
            </button>
            <h2>{isEdit ? "Modifier le collègue" : "Inviter un collègue"}</h2>
            <button
              type="button"
              className="measure-drawer-close"
              onClick={() => navigate("/admin/teams")}
              aria-label="Fermer"
            >
              <X size={21} />
            </button>
          </div>

          <div className="measure-drawer-body">
            {error && <div className="measure-form-error">{error}</div>}

            {!isEdit && (
              <div className="team-role-summary">
                <img src={selectedRole.image} alt={selectedRole.label} />
                <div>
                  <strong>{selectedRole.label}</strong>
                  <button type="button" onClick={() => setStep("role")}>
                    Changer de rôle
                  </button>
                </div>
              </div>
            )}

            <div className="task-form-section">
              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label>
                    Prénom <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prénom du collègue"
                  />
                </div>

                <div className="measure-form-group">
                  <label>
                    Nom <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nom du collègue"
                  />
                </div>
              </div>

              <div className="measure-form-group">
                <label>
                  Email <span>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>

              {isEdit && (
                <div className="measure-form-group">
                  <label>Rôle</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    {ROLES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="measure-form-group">
                <label>Taux horaire (EUR)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="Ex : 35"
                />
              </div>

              <div className="measure-form-group">
                <label>Tags</label>
                <div className="task-chip-list">
                  {tags.length === 0 && (
                    <p className="task-empty-hint">Aucun tag disponible.</p>
                  )}
                  {tags.map((tag) => (
                    <button
                      type="button"
                      key={tag.id}
                      className={`team-tag-toggle ${
                        tagIds.includes(tag.id) ? "active" : ""
                      }`}
                      style={{
                        borderColor: tag.color,
                        color: tagIds.includes(tag.id)
                          ? "#ffffff"
                          : tag.color,
                        background: tagIds.includes(tag.id)
                          ? tag.color
                          : "transparent",
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="measure-drawer-footer">
            <button
              type="button"
              className="measure-cancel-button"
              disabled={submitting}
              onClick={() => navigate("/admin/teams")}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="measure-primary-button"
              disabled={submitting}
            >
              <Plus size={16} />
              {submitting
                ? "Enregistrement..."
                : isEdit
                  ? "Enregistrer"
                  : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}

export default InviteColleaguePage;
