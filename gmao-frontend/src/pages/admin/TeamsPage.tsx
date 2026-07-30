import {
  Download,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getTeams, setTeamActive } from "../../services/teamService";
import { getUsersDetailed, setUserActive } from "../../services/userService";
import type { Team } from "../../types/team";
import type { UserDetail, UserRole } from "../../types/user";
import { exportTableCsv, exportTablePdf } from "../../utils/exportFiles";

import "./team-styles.css";

const ROLE_LABELS: Record<UserRole, string> = {
  SUPERADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  SUPERVISOR: "Superviseur",
  TECHNICIAN: "Technicien",
  PRODUCTION: "Production",
  SERVICE_PROVIDER: "Prestataire",
};

const AVATAR_COLORS = [
  "#087fbd",
  "#6b46c1",
  "#198754",
  "#a3660f",
  "#b42318",
  "#0f766e",
];

function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const second =
    parts.length > 1 ? parts[1].charAt(0) : parts[0]?.charAt(1) ?? "";
  return `${first}${second}`.toUpperCase();
}

function activationErrorMessage(target: "compte" | "equipe", error: unknown): string {
  const status =
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "status" in error.response
      ? error.response.status
      : null;

  if (status === 403) {
    return "Vous n'avez pas le droit de modifier cet etat.";
  }

  if (status === 404 || status === 405) {
    return "Route d'activation introuvable. Redemarrez le backend avec la derniere version.";
  }

  return `Modification de l'etat ${target === "compte" ? "du compte" : "de l'equipe"} impossible.`;
}

function TeamsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"colleagues" | "teams">(
    "colleagues",
  );
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [usersData, teamsData] = await Promise.all([
          getUsersDetailed(),
          getTeams(),
        ]);

        setUsers(usersData);
        setTeams(teamsData);
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger les donnees.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.firstName, user.lastName, user.email]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [users, search]);

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return teams;
    }

    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [teams, search]);

  async function handleToggleUserActive(user: UserDetail) {
    const nextActive = !user.active;
    const actionLabel = nextActive ? "Activer" : "Desactiver";

    if (!window.confirm(`${actionLabel} ce collegue ?`)) {
      return;
    }

    try {
      const updatedUser = await setUserActive(user.id, nextActive);
      setUsers((current) =>
        current.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
      );

      if (!nextActive) {
        setTeams((current) =>
          current.map((team) => ({
            ...team,
            members: team.members.filter((member) => member.id !== user.id),
          })),
        );
      }
    } catch (requestError) {
      console.error(requestError);
      setError(activationErrorMessage("compte", requestError));
    }
  }

  async function handleToggleTeamActive(team: Team) {
    const nextActive = !team.active;
    const actionLabel = nextActive ? "Activer" : "Desactiver";

    if (!window.confirm(`${actionLabel} cette equipe ?`)) {
      return;
    }

    try {
      const updatedTeam = await setTeamActive(team.id, nextActive);
      setTeams((current) =>
        current.map((item) => (item.id === updatedTeam.id ? updatedTeam : item)),
      );
    } catch (requestError) {
      console.error(requestError);
      setError(activationErrorMessage("equipe", requestError));
    }
  }

  function exportCsv() {
    exportTableCsv(getExportOptions());
  }

  function exportPdf() {
    exportTablePdf(getExportOptions());
  }

  function getExportOptions() {
    if (activeTab === "colleagues") {
      return {
        title: "Liste des collegues",
        fileName: "equipes-collegues",
        headers: ["Membre", "Email", "Role", "Etat", "Equipes", "Tags"],
        rows: filteredUsers.map((user) => [
          `${user.firstName} ${user.lastName}`,
          user.email,
          ROLE_LABELS[user.role],
          user.active ? "Actif" : "Inactif",
          user.teams.map((team) => team.name).join(", ") || "-",
          user.tags.map((tag) => tag.name).join(", ") || "-",
        ]),
      };
    }

    return {
      title: "Liste des equipes",
      fileName: "equipes",
      headers: ["Equipe", "Description", "Etat", "Membres", "Tags"],
      rows: filteredTeams.map((team) => [
        team.name,
        team.description ?? "-",
        team.active ? "Active" : "Inactive",
        team.members
          .map((member) => `${member.firstName} ${member.lastName}`)
          .join(", ") || "-",
        team.tags.map((tag) => tag.name).join(", ") || "-",
      ]),
    };
  }

  return (
    <section className="admin-page">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <UsersRound size={28} />
            <h1>Equipe</h1>
          </div>
        </div>

        <div className="resource-header-actions">
          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportPdf}
            disabled={
              activeTab === "colleagues"
                ? filteredUsers.length === 0
                : filteredTeams.length === 0
            }
          >
            <Download size={16} />
            PDF
          </button>
          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportCsv}
            disabled={
              activeTab === "colleagues"
                ? filteredUsers.length === 0
                : filteredTeams.length === 0
            }
          >
            <Download size={16} />
            CSV
          </button>
          <button
            type="button"
            className="resource-primary-button"
            onClick={() =>
              navigate(
                activeTab === "colleagues"
                  ? "/admin/teams/invite"
                  : "/admin/teams/new",
              )
            }
          >
            <Plus size={17} />
            {activeTab === "colleagues"
              ? "Inviter un collegue"
              : "Creer une equipe"}
          </button>
        </div>
      </div>

      <div className="team-tabs">
        <button
          type="button"
          className={activeTab === "colleagues" ? "active" : ""}
          onClick={() => setActiveTab("colleagues")}
        >
          Collegues <span>{users.length}</span>
        </button>
        <button
          type="button"
          className={activeTab === "teams" ? "active" : ""}
          onClick={() => setActiveTab("teams")}
        >
          Equipes <span>{teams.length}</span>
        </button>
      </div>

      <div className="resource-toolbar">
        <div className="resource-search">
          <Search size={17} />
          <input
            type="text"
            placeholder={
              activeTab === "colleagues"
                ? "Rechercher un collegue..."
                : "Rechercher une equipe..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {loading && <div className="resource-loading">Chargement...</div>}

      {!loading && error && (
        <div className="resource-error-message">{error}</div>
      )}

      {!loading && !error && activeTab === "colleagues" && (
        <div className="resource-table-container">
          <table className="resource-table">
            <thead>
              <tr>
                <th>Membre</th>
                <th>Email</th>
                <th>Etat</th>
                <th>Equipes</th>
                <th>Tags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="resource-table-empty">
                    Aucun collegue trouve.
                  </td>
                </tr>
              )}

              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="team-member-cell">
                      <span
                        className="team-avatar"
                        style={{ background: avatarColor(user.id) }}
                      >
                        {initials(user.firstName, user.lastName)}
                      </span>
                      <div>
                        <strong>
                          {user.firstName} {user.lastName}
                        </strong>
                        <span className="team-role-label">
                          {ROLE_LABELS[user.role]}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className={`team-status-badge ${
                        user.active ? "active" : "inactive"
                      }`}
                    >
                      {user.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    {user.teams.length > 0 ? (
                      <div className="team-chip-list">
                        {user.teams.map((team) => (
                          <span key={team.id}>{team.name}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="task-unassigned">Aucune</span>
                    )}
                  </td>
                  <td>
                    {user.tags.length > 0 ? (
                      <div className="team-chip-list">
                        {user.tags.map((tag) => (
                          <span
                            key={tag.id}
                            style={{ backgroundColor: tag.color }}
                            className="team-tag-chip"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="task-unassigned">Aucun</span>
                    )}
                  </td>
                  <td>
                    <div className="team-row-actions">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/admin/teams/colleagues/${user.id}/edit`)
                        }
                        aria-label="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleUserActive(user)}
                        aria-label={user.active ? "Desactiver" : "Activer"}
                        title={user.active ? "Desactiver" : "Activer"}
                      >
                        {user.active ? (
                          <ToggleRight size={17} />
                        ) : (
                          <ToggleLeft size={17} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && activeTab === "teams" && (
        <div className="resource-table-container">
          <table className="resource-table">
            <thead>
              <tr>
                <th>Equipe</th>
                <th>Etat</th>
                <th>Membres</th>
                <th>Tags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={5} className="resource-table-empty">
                    Aucune equipe trouvee.
                  </td>
                </tr>
              )}

              {filteredTeams.map((team) => (
                <tr
                  key={team.id}
                  className="supplier-clickable-row"
                  onClick={() => navigate(`/admin/teams/${team.id}/edit`)}
                >
                  <td>
                    <div className="team-member-cell">
                      <span
                        className="team-avatar"
                        style={{ background: avatarColor(team.id) }}
                      >
                        {teamInitials(team.name)}
                      </span>
                      <div>
                        <strong>{team.name}</strong>
                        {team.description && (
                          <span className="team-role-label">
                            {team.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`team-status-badge ${
                        team.active ? "active" : "inactive"
                      }`}
                    >
                      {team.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {team.members.length > 0 ? (
                      <div className="team-chip-list">
                        {team.members.map((member) => (
                          <span key={member.id}>
                            {member.firstName} {member.lastName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="task-unassigned">Aucun membre</span>
                    )}
                  </td>
                  <td>
                    {team.tags.length > 0 ? (
                      <div className="team-chip-list">
                        {team.tags.map((tag) => (
                          <span
                            key={tag.id}
                            style={{ backgroundColor: tag.color }}
                            className="team-tag-chip"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="task-unassigned">Aucun</span>
                    )}
                  </td>
                  <td onClick={(event) => event.stopPropagation()}>
                    <div className="team-row-actions">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/admin/teams/${team.id}/edit`)
                        }
                        aria-label="Modifier"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleTeamActive(team)}
                        aria-label={team.active ? "Desactiver" : "Activer"}
                        title={team.active ? "Desactiver" : "Activer"}
                      >
                        {team.active ? (
                          <ToggleRight size={17} />
                        ) : (
                          <ToggleLeft size={17} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default TeamsPage;
