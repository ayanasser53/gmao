import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  Banknote,
  Download,
  HardHat,
  Info,
  Mail,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import { getUsers } from "../../services/userService";
import type { UserSummary } from "../../types/user";

const BACKEND_URL = "http://localhost:8090";

type RoleCode = "ADMIN" | "TECHNICIAN" | "PRODUCTION" | "SERVICE_PROVIDER";
type DrawerMode = "invite" | "edit" | "role" | "team" | null;

type TeamUser = UserSummary & {
  role?: RoleCode | string | null;
  hourlyRate?: number | null;
  teams?: string[] | null;
  labels?: string[] | null;
  photo?: string | null;
  photoUrl?: string | null;
};

type TeamRecord = {
  id: number;
  name: string;
  description: string;
  members: TeamUser[];
  labels: string[];
};

type InviteForm = {
  firstName: string;
  lastName: string;
  email: string;
  noEmail: boolean;
  team: string;
};

const emptyInviteForm: InviteForm = {
  firstName: "",
  lastName: "",
  email: "",
  noEmail: false,
  team: "",
};

const roleCards = [
  {
    code: "ADMIN",
    title: "Administrateur",
    icon: ShieldCheck,
    description:
      "Le responsable du réseau peut ajouter et supprimer des équipements, des tâches, des activités et modifier les permissions des utilisateurs.",
  },
  {
    code: "TECHNICIAN",
    title: "Technicien",
    icon: HardHat,
    description:
      "Les techniciens du réseau peuvent ajouter et assigner des tâches et des activités. Ils ne peuvent pas modifier les équipements ni les permissions.",
  },
  {
    code: "PRODUCTION",
    title: "Production",
    icon: HardHat,
    description:
      "La production peut créer des tâches, renseigner des checklists et avoir accès en lecture au reste de l'application.",
  },
  {
    code: "SERVICE_PROVIDER",
    title: "Prestataire de services",
    icon: User,
    description:
      "Le prestataire peut voir les activités de ses membres et créer des activités sur les tâches auxquelles il a été assigné.",
  },
] as const;

const roleColors: Record<RoleCode, string> = {
  ADMIN: "#0077a8",
  TECHNICIAN: "#ef7d3c",
  PRODUCTION: "#0aa96f",
  SERVICE_PROVIDER: "#8a3fb0",
};

function getImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("blob:")) {
    return imagePath;
  }
  return `${BACKEND_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}

function getFullName(user: TeamUser): string {
  return [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email || "Utilisateur";
}

function getInitials(user: TeamUser): string {
  const names = [user.firstName, user.lastName].filter((name): name is string => Boolean(name));
  if (names.length > 0) {
    return names.map((name) => name.charAt(0)).join("").slice(0, 2).toUpperCase();
  }
  return (user.email || "UT").slice(0, 2).toUpperCase();
}

function getRoleLabel(role?: string | null): string {
  switch (role) {
    case "TECHNICIAN":
      return "Technicien";
    case "PRODUCTION":
      return "Production";
    case "SERVICE_PROVIDER":
      return "Prestataire de services";
    case "ADMIN":
    default:
      return "Administrateur";
  }
}

function Avatar({ user }: { user: TeamUser }) {
  const image = getImageUrl(user.photoUrl ?? user.photo ?? null);
  const color = roleColors[(user.role as RoleCode) || "ADMIN"] || roleColors.ADMIN;

  if (image) {
    return <img className="teams-avatar teams-avatar-image" src={image} alt={getFullName(user)} />;
  }

  return (
    <span className="teams-avatar teams-avatar-placeholder" style={{ backgroundColor: color }}>
      {getInitials(user)}
    </span>
  );
}

export default function TeamsPage() {
  const [activeTab, setActiveTab] = useState<"colleagues" | "teams">("colleagues");
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleCode>("ADMIN");
  const [inviteForm, setInviteForm] = useState<InviteForm>(emptyInviteForm);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [teamLabels, setTeamLabels] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        const data = await getUsers();
        if (isMounted) {
          setUsers(data as TeamUser[]);
          setError("");
        }
      } catch {
        if (isMounted) setError("Impossible de charger les collègues.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) => {
      const values = [getFullName(user), user.email, getRoleLabel(user.role), ...(user.teams ?? []), ...(user.labels ?? [])];
      return values.some((value) => value?.toLowerCase().includes(normalized));
    });
  }, [query, users]);

  const teamLabelOptions = useMemo(() => {
    const labels = new Set<string>();
    users.forEach((user) => user.labels?.forEach((label) => labels.add(label)));
    teams.forEach((team) => team.labels.forEach((label) => labels.add(label)));
    return Array.from(labels).sort((first, second) => first.localeCompare(second));
  }, [teams, users]);

  const selectedTeamMembers = useMemo(
    () => users.filter((user) => teamMemberIds.includes(String(user.id))),
    [teamMemberIds, users]
  );

  const toggleTeamMember = (memberId: string) => {
    setTeamMemberIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId]
    );
  };

  const toggleTeamLabel = (label: string) => {
    setTeamLabels((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label]
    );
  };

  const selectedRoleCard = roleCards.find((role) => role.code === selectedRole) ?? roleCards[0];

  const openInvite = () => {
    setSelectedUser(null);
    setSelectedRole("ADMIN");
    setInviteForm(emptyInviteForm);
    setDrawer("role");
  };

  const openEdit = (user: TeamUser) => {
    setSelectedUser(user);
    setSelectedRole((user.role as RoleCode) || "ADMIN");
    setDrawer("edit");
  };

  const closeDrawer = () => {
    setDrawer(null);
    setSelectedUser(null);
    setInviteForm(emptyInviteForm);
  };

  const handleInviteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inviteForm.firstName.trim() || !inviteForm.lastName.trim() || (!inviteForm.noEmail && !inviteForm.email.trim())) {
      return;
    }

    const newUser: TeamUser = {
      id: Date.now(),
      firstName: inviteForm.firstName.trim(),
      lastName: inviteForm.lastName.trim(),
      email: inviteForm.noEmail ? "" : inviteForm.email.trim(),
      role: selectedRole,
      hourlyRate: 0,
      teams: inviteForm.team ? [inviteForm.team] : [],
      labels: [],
      photo: null,
      photoUrl: null,
      active: true,
    };

    setUsers((current) => [newUser, ...current]);
    closeDrawer();
  };

  const handleCreateTeam = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!teamName.trim()) return;

    const newTeam: TeamRecord = {
      id: Date.now(),
      name: teamName.trim(),
      description: teamDescription.trim(),
      members: selectedTeamMembers,
      labels: teamLabels,
    };

    setTeams((current) => [newTeam, ...current]);
    setTeamName("");
    setTeamDescription("");
    setTeamMemberIds([]);
    setTeamLabels([]);
    setDrawer(null);
    setActiveTab("teams");
  };

  const handleDeleteUser = (id: number) => {
    setUsers((current) => current.filter((user) => user.id !== id));
  };

  const renderRoleSelection = () => (
    <div className="teams-role-grid">
      {roleCards.map((role) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.code;
        return (
          <article className={`teams-role-card${isSelected ? " is-selected" : ""}`} key={role.code}>
            <div className="teams-role-visual">
              <Icon size={42} />
            </div>
            <h3>{role.title}</h3>
            <p>{role.description}</p>
            {role.code === "ADMIN" || role.code === "TECHNICIAN" ? null : <span className="teams-free-label">Gratuit</span>}
            <button
              className={`teams-role-button${isSelected ? " teams-role-button-selected" : ""}`}
              type="button"
              onClick={() => {
                setSelectedRole(role.code);
                setDrawer(selectedUser ? "edit" : "invite");
              }}
            >
              {isSelected ? "SÉLECTIONNÉ" : "Sélectionnez"}
            </button>
          </article>
        );
      })}
    </div>
  );

  const renderInviteForm = () => {
    const Icon = selectedRoleCard.icon;
    return (
      <div className="teams-invite-layout">
        <aside className="teams-role-summary-card">
          <div className="teams-role-visual large">
            <Icon size={54} />
          </div>
          <h3>{selectedRoleCard.title}</h3>
          <button className="teams-secondary-button" type="button" onClick={() => setDrawer("role")}>
            Modifier le rôle
          </button>
        </aside>

        <form className="teams-invite-form" onSubmit={handleInviteSubmit}>
          <label className="teams-form-field">
            <span>Prénom *</span>
            <input
              className="teams-form-control"
              value={inviteForm.firstName}
              onChange={(event) => setInviteForm((current) => ({ ...current, firstName: event.target.value }))}
              placeholder="Entrez le prénom du collègue"
              required
            />
          </label>
          <label className="teams-form-field">
            <span>Nom *</span>
            <input
              className="teams-form-control"
              value={inviteForm.lastName}
              onChange={(event) => setInviteForm((current) => ({ ...current, lastName: event.target.value }))}
              placeholder="Entrez le nom du collègue"
              required
            />
          </label>
          <label className="teams-form-field">
            <span>E-mail *</span>
            <input
              className="teams-form-control"
              type="email"
              value={inviteForm.email}
              onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Entrez l'e-mail du collègue"
              disabled={inviteForm.noEmail}
              required={!inviteForm.noEmail}
            />
          </label>
          <label className="teams-toggle-row">
            <input
              type="checkbox"
              checked={inviteForm.noEmail}
              onChange={(event) => setInviteForm((current) => ({ ...current, noEmail: event.target.checked, email: event.target.checked ? "" : current.email }))}
            />
            <span>Mon collègue n'a pas d'adresse e-mail</span>
          </label>
          <label className="teams-form-field">
            <span>Équipes</span>
            <select
              className="teams-form-control"
              value={inviteForm.team}
              onChange={(event) => setInviteForm((current) => ({ ...current, team: event.target.value }))}
            >
              <option value="">Sélectionnez une équipe...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
            <small>
              Les équipes permettent d'assigner les tâches et les plans de maintenance à l'équipe plutôt qu'à des utilisateurs définis.
            </small>
          </label>
          {teams.length === 0 ? (
            <p className="teams-help-link">Vous n'avez pas encore d'équipes, créez-en pour pouvoir les utiliser</p>
          ) : null}
          <div className="teams-drawer-footer compact">
            <button className="teams-primary-button" type="submit">
              Créer un nouveau collègue
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderEditDrawer = () => {
    if (!selectedUser) return null;
    return (
      <div className="teams-edit-layout">
        <aside className="teams-profile-card">
          <Avatar user={selectedUser} />
          <h3>{getRoleLabel(selectedRole)}</h3>
          <button className="teams-secondary-button" type="button" onClick={() => setDrawer("role")}>
            Modifier le rôle
          </button>
        </aside>
        <div className="teams-profile-details">
          <h3>{getFullName(selectedUser)}</h3>
          <div className="teams-detail-row">
            <Mail size={20} />
            <div>
              <span>E-mail</span>
              <strong>{selectedUser.email || "Non renseigné"}</strong>
            </div>
            <Pencil size={18} />
          </div>
          <div className="teams-detail-row">
            <Banknote size={20} />
            <div>
              <span>Taux horaire</span>
              <strong>{selectedUser.hourlyRate ?? 0} EUR</strong>
            </div>
            <Pencil size={18} />
          </div>
          <div className="teams-detail-section">
            <span>Équipes</span>
            <strong>{selectedUser.teams?.join(", ") || "Aucune équipe"}</strong>
          </div>
          <div className="teams-detail-section">
            <span>Labels</span>
            {selectedUser.labels?.length ? selectedUser.labels.map((label) => <span className="teams-label" key={label}>{label}</span>) : <strong>Aucun label</strong>}
          </div>
        </div>
      </div>
    );
  };

  const renderTeamForm = () => (
    <form className="teams-team-form" onSubmit={handleCreateTeam}>
      <div className="teams-info compact-info">
        <Info size={20} />
        <span>Une équipe est dynamique : vous pouvez faire évoluer les collègues qui la composent.</span>
      </div>
      <label className="teams-form-field">
        <span>Nom de l'équipe *</span>
        <input
          className="teams-form-control"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="Ex : Équipe hydraulique"
          maxLength={255}
          required
        />
        <small>Le nom de l'équipe permet de la distinguer et de la retrouver dans les listes.</small>
      </label>
      <label className="teams-form-field">
        <span>Description</span>
        <textarea
          className="teams-form-control teams-textarea"
          value={teamDescription}
          onChange={(event) => setTeamDescription(event.target.value)}
          placeholder="Ex : Ceci est l'équipe hydraulique"
          maxLength={5000}
        />
      </label>
      <div className="teams-form-field">
        <span>Collègues</span>
        <div className="teams-multi-select-list">
          {users.length > 0 ? (
            users.map((user) => {
              const memberId = String(user.id);
              const isSelected = teamMemberIds.includes(memberId);

              return (
                <label className={`teams-multi-select-option${isSelected ? " is-selected" : ""}`} key={user.id}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleTeamMember(memberId)} />
                  <span>{getFullName(user)}</span>
                </label>
              );
            })
          ) : (
            <p className="teams-empty-selection">Aucun collègue disponible.</p>
          )}
        </div>
        {selectedTeamMembers.length > 0 && (
          <div className="teams-selected-chips">
            {selectedTeamMembers.map((user) => (
              <span className="teams-selected-chip" key={user.id}>
                {getFullName(user)}
                <button type="button" onClick={() => toggleTeamMember(String(user.id))} aria-label={`Retirer ${getFullName(user)}`}>
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="teams-form-field">
        <span>Labels</span>
        <div className="teams-multi-select-list">
          {teamLabelOptions.length > 0 ? (
            teamLabelOptions.map((label) => {
              const isSelected = teamLabels.includes(label);

              return (
                <label className={`teams-multi-select-option${isSelected ? " is-selected" : ""}`} key={label}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleTeamLabel(label)} />
                  <span>{label}</span>
                </label>
              );
            })
          ) : (
            <p className="teams-empty-selection">Aucun label disponible.</p>
          )}
        </div>
        {teamLabels.length > 0 && (
          <div className="teams-selected-chips">
            {teamLabels.map((label) => (
              <span className="teams-selected-chip" key={label}>
                {label}
                <button type="button" onClick={() => toggleTeamLabel(label)} aria-label={`Retirer ${label}`}>
                  x
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="teams-drawer-footer compact">
        <button className="teams-primary-button" type="submit">
          Créer une équipe
        </button>
      </div>
    </form>
  );

  const renderDrawer = () => {
    if (!drawer) return null;

    const title = drawer === "role" ? (selectedUser ? "Modifier un collègue" : "Inviter un collègue") : drawer === "invite" ? "Inviter un collègue" : drawer === "team" ? "Créer une équipe" : "Modifier un collègue";

    return (
      <div className="teams-drawer-backdrop" role="presentation" onClick={closeDrawer}>
        <aside className="teams-drawer" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <header className="teams-drawer-header">
            <button className="teams-icon-button" type="button" onClick={drawer === "invite" ? () => setDrawer("role") : closeDrawer} aria-label="Retour">
              <ArrowLeft size={22} />
            </button>
            <h2>{title}</h2>
            <button className="teams-icon-button close" type="button" onClick={closeDrawer} aria-label="Fermer">
              <X size={22} />
            </button>
          </header>
          <div className="teams-drawer-body">
            {drawer === "role" ? renderRoleSelection() : null}
            {drawer === "invite" ? renderInviteForm() : null}
            {drawer === "edit" ? renderEditDrawer() : null}
            {drawer === "team" ? renderTeamForm() : null}
          </div>
        </aside>
      </div>
    );
  };

  return (
    <section className="teams-page">
      <div className="teams-title-row">
        <div>
          <span className="teams-kicker">Gestion des collaborateurs</span>
          <h1 className="teams-title">
            <Users size={38} />
            Équipes
          </h1>
        </div>
        <div className="teams-actions">
          <button className="teams-secondary-button" type="button">
            <Download size={18} />
            Télécharger
          </button>
          <button className="teams-primary-button" type="button" onClick={openInvite}>
            <Plus size={20} />
            Inviter un collègue
          </button>
        </div>
      </div>

      <div className="teams-tabs" role="tablist">
        <button className={`teams-tab${activeTab === "colleagues" ? " active" : ""}`} type="button" onClick={() => setActiveTab("colleagues")}>
          <User size={18} />
          Collègues
          <span>{users.length}</span>
        </button>
        <button className={`teams-tab${activeTab === "teams" ? " active" : ""}`} type="button" onClick={() => setActiveTab("teams")}>
          <Users size={20} />
          Équipes
          <span>{teams.length}</span>
        </button>
      </div>

      <div className="teams-info">
        <Info size={20} />
        <span>
          {activeTab === "colleagues"
            ? "Invitez vos collègues selon leurs profils et responsabilités afin de collaborer et les assigner aux tâches et plans de maintenance."
            : "Grâce aux équipes, vous pouvez assigner une tâche ou un plan de maintenance indépendamment des collègues qui la réaliseront."}
        </span>
      </div>

      <div className="teams-search-row">
        <div className="teams-search">
          <Search size={20} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher..." />
        </div>
        {activeTab === "teams" ? (
          <button className="teams-primary-button" type="button" onClick={() => setDrawer("team")}>
            <Plus size={18} />
            Créer une équipe
          </button>
        ) : null}
      </div>

      {error ? <div className="teams-error">{error}</div> : null}

      {activeTab === "colleagues" ? (
        <div className="teams-table-card">
          <table className="teams-table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>E-mail</th>
                <th>Équipes</th>
                <th>Labels</th>
                <th>Taux horaire</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="teams-empty">Chargement...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="teams-empty">Aucun collègue trouvé.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="teams-member-cell">
                        <Avatar user={user} />
                        <div>
                          <strong>{getFullName(user)}</strong>
                          <span>{getRoleLabel(user.role)}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.email || "-"}</td>
                    <td>{user.teams?.join(", ") || "-"}</td>
                    <td>{user.labels?.length ? user.labels.map((label) => <span className="teams-label" key={label}>{label}</span>) : "-"}</td>
                    <td>{user.hourlyRate ? `${user.hourlyRate} EUR` : "-"}</td>
                    <td>
                      <div className="teams-actions-cell">
                        <button className="teams-icon-button edit" type="button" onClick={() => openEdit(user)} aria-label="Modifier">
                          <Pencil size={18} />
                        </button>
                        <button className="teams-icon-button danger" type="button" onClick={() => handleDeleteUser(user.id)} aria-label="Supprimer">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="teams-table-card">
          <table className="teams-table">
            <thead>
              <tr>
                <th>Nom de l'équipe</th>
                <th>Membres</th>
                <th>Labels</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="teams-empty-state">
                      <Search size={70} />
                      <span>Aucun résultat</span>
                    </div>
                  </td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team.id}>
                    <td>
                      <strong>{team.name}</strong>
                      <span className="teams-muted-line">{team.description || "Aucune description"}</span>
                    </td>
                    <td>{team.members.map(getFullName).join(", ") || "-"}</td>
                    <td>{team.labels.map((label) => <span className="teams-label" key={label}>{label}</span>)}</td>
                    <td>
                      <button className="teams-icon-button edit" type="button" aria-label="Modifier">
                        <Pencil size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {renderDrawer()}
    </section>
  );
}


