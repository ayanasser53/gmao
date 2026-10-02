import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Eye,
  Factory,
  Plus,
  ShieldCheck,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getTags } from "../../services/tagService";
import {
  getUsersDetailed,
  inviteUser,
  updateUser,
} from "../../services/userService";
import type { Tag } from "../../types/tag";
import type { ApiErrorResponse } from "../../types/auth";
import type { UserRole } from "../../types/user";

import "./task-styles.css";
import "./team-styles.css";
import "./usines-styles.css";

const ROLES: {
  value: UserRole;
  label: string;
  description: string;
  Icon: LucideIcon;
  features: string[];
}[] = [
  {
    value: "ADMIN",
    label: "Administrateur",
    description:
      "Pilote la maintenance, gere les ressources et organise les utilisateurs de son usine.",
    Icon: ShieldCheck,
    features: [
      "Creer et modifier les taches, plans, activites et equipements",
      "Inviter les collegues et organiser les equipes",
      "Gerer les fournisseurs, stocks, documents et tableaux de bord",
    ],
  },
  {
    value: "SUPERVISOR",
    label: "Superviseur",
    description:
      "Suit la maintenance comme un administrateur, sans gerer les equipes ni les actions sensibles.",
    Icon: Eye,
    features: [
      "Consulter le dashboard, les taches, les plans, les activites et les stocks",
      "Suivre et modifier les informations operationnelles autorisees",
      "Ne peut pas annuler, supprimer, archiver ni gerer les equipes",
    ],
  },
  {
    value: "TECHNICIAN",
    label: "Technicien",
    description:
      "Realise les interventions affectees et renseigne le resultat terrain.",
    Icon: Wrench,
    features: [
      "Voir uniquement ses taches et plans affectes",
      "Creer et completer les activites de realisation",
      "Consulter les pieces et documents necessaires a l'intervention",
    ],
  },
  {
    value: "PRODUCTION",
    label: "Production",
    description:
      "Signale les pannes observees sur les machines et suit ses demandes.",
    Icon: Factory,
    features: [
      "Creer une tache pour declarer une panne",
      "Suivre l'etat de ses propres taches",
      "Consulter son profil et ses notifications",
    ],
  },
  {
    value: "SERVICE_PROVIDER",
    label: "Prestataire",
    description:
      "Intervient sur les travaux qui lui sont affectes, meme hors equipe interne.",
    Icon: BriefcaseBusiness,
    features: [
      "Voir les taches et plans qui lui sont assignes",
      "Renseigner les activites realisees",
      "Acceder aux informations utiles sans gerer les permissions",
    ],
  },
];

function InviteColleaguePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [role, setRole] = useState<UserRole>("TECHNICIAN");
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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
          setError("Collegue introuvable.");
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
        setError("Impossible de charger ce collegue.");
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

    if (!isEdit && password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    if (isEdit && password && password.length < 6) {
      setError("Le nouveau mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password: password || undefined,
      role,
      hourlyRate: hourlyRate ? Number(hourlyRate) : null,
      tagIds,
    };

    try {
      if (isEdit) {
        await updateUser(Number(id), payload);
        navigate("/admin/teams");
      } else {
        const result = await inviteUser(payload);
        setCreatedCredentials({
          email: result.user.email,
          password: result.temporaryPassword ?? password,
        });
      }
    } catch (requestError) {
      console.error(requestError);
      const axiosError = requestError as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message ??
          axiosError.response?.data?.error ??
          "L'enregistrement a echoue. Verifiez que le backend est redemarre et que l'email n'est pas deja utilise.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyCredentials(): Promise<void> {
    if (!createdCredentials) {
      return;
    }

    const text = `Email : ${createdCredentials.email}\nMot de passe temporaire : ${createdCredentials.password}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error(copyError);
    }
  }

  const selectedRole = ROLES.find((item) => item.value === role) ?? ROLES[1];
  const SelectedRoleIcon = selectedRole.Icon;

  if (createdCredentials) {
    return (
      <section className="supplier-modal-page">
        <button
          type="button"
          className="supplier-form-backdrop"
          aria-label="Retour a l'equipe"
          onClick={() => navigate("/admin/teams")}
        />

        <aside className="supplier-form-drawer task-form-drawer">
          <div className="measure-drawer-header">
            <h2>Collegue cree avec succes</h2>
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
            <div className="usine-credentials-box">
              <p>
                Communiquez-lui ces identifiants.{" "}
                <strong>Ce mot de passe ne sera plus jamais affiche</strong> :
              </p>

              <div className="usine-credentials-row">
                <span>Email</span>
                <strong>{createdCredentials.email}</strong>
              </div>

              <div className="usine-credentials-row">
                <span>Mot de passe</span>
                <strong>{createdCredentials.password}</strong>
              </div>

              <button
                type="button"
                className="usine-action-button"
                onClick={() => void handleCopyCredentials()}
              >
                {copied ? "Copie !" : "Copier les identifiants"}
              </button>
            </div>
          </div>

          <div className="measure-drawer-footer">
            <button
              type="button"
              className="measure-primary-button"
              onClick={() => navigate("/admin/teams")}
            >
              Terminer
            </button>
          </div>
        </aside>
      </section>
    );
  }

  return (
    <section className="supplier-modal-page">
      <button
        type="button"
        className="supplier-form-backdrop"
        aria-label="Retour a l'equipe"
        onClick={() => navigate("/admin/teams")}
      />

      <aside className="supplier-form-drawer task-form-drawer">
        <form className="measure-drawer-content" onSubmit={handleSubmit}>
          <div className="measure-drawer-header">
            <button
              type="button"
              className="measure-drawer-back"
              onClick={() => navigate("/admin/teams")}
              aria-label="Retour"
            >
              <ArrowLeft size={22} />
            </button>
            <h2>{isEdit ? "Modifier le collegue" : "Inviter un collegue"}</h2>
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

            <button
              type="button"
              className={`team-account-type-card ${
                showRoleOptions ? "open" : ""
              }`}
              onClick={() => setShowRoleOptions((current) => !current)}
            >
              <span className="team-account-type-image">
                <SelectedRoleIcon size={30} />
              </span>
              <span className="team-account-type-content">
                <span>Type de compte</span>
                <strong>{selectedRole.label}</strong>
                <em>{selectedRole.description}</em>
              </span>
              <ChevronDown size={20} />
            </button>

            {showRoleOptions && (
              <div className="team-role-inline-grid">
                {ROLES.map((item) => {
                  const isSelected = item.value === role;
                  const RoleIcon = item.Icon;

                  return (
                    <button
                      type="button"
                      key={item.value}
                      className={`team-role-inline-card ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => {
                        setRole(item.value);
                        setShowRoleOptions(false);
                      }}
                    >
                      <span className="team-role-inline-head">
                        <span className="team-role-logo">
                          <RoleIcon size={26} />
                        </span>
                        <span>
                          <strong>{item.label}</strong>
                          <em>{item.description}</em>
                        </span>
                        {isSelected && <CheckCircle2 size={18} />}
                      </span>
                      <span className="team-role-feature-list">
                        {item.features.map((feature) => (
                          <span key={feature}>{feature}</span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="task-form-section">
              <div className="supplier-form-grid">
                <div className="measure-form-group">
                  <label>
                    Prenom <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Prenom du collegue"
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
                    placeholder="Nom du collegue"
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

              <div className="measure-form-group">
                <label>
                  Mot de passe {!isEdit && <span>*</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isEdit
                      ? "Laisser vide pour ne pas changer"
                      : "Au moins 6 caracteres"
                  }
                />
              </div>

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
