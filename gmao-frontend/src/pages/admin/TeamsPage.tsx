import { Pencil, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteTeam, getTeams } from "../../services/teamService";
import { deleteUser, getUsersDetailed } from "../../services/userService";
import type { Team } from "../../types/team";
import type { UserDetail, UserRole } from "../../types/user";

import "./team-styles.css";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrateur",
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
  const second = parts.length > 1 ? parts[1].charAt(0) : parts[0]?.charAt(1) ?? "";
  return `${first}${second}`.toUpperCase();
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
        setError("Impossible de charger les données.");
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

  async function handleDeleteUser(id: number) {
    if (!window.confirm("Supprimer ce collègue ?")) {
      return;
    }

    try {
      await deleteUser(id);
      setUsers((current) => current.filter((user) => user.id !== id));
    } catch (requestError) {
      console.error(requestError);
      setError("Suppression impossible.");
    }
  }

  async function handleDeleteTeam(id: number) {
    if (!window.confirm("Supprimer cette équipe ?")) {
      return;
    }

    try {
      await deleteTeam(id);
      setTeams((current) => current.filter((team) => team.id !== id));
    } catch (requestError) {
      console.error(requestError);
      setError("Suppression impossible.");
    }
  }

  return (
    <section className="admin-page">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <UsersRound size={28} />
            <h1>Équipe</h1>
          </div>
        </div>

        <div className="resource-header-actions">
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
              ? "Inviter un collègue"
              : "Créer une équipe"}
          </button>
        </div>
      </div>

      <div className="team-tabs">
        <button
          type="button"
          className={activeTab === "colleagues" ? "active" : ""}
          onClick={() => setActiveTab("colleagues")}
        >
          Collègues <span>{users.length}</span>
        </button>
        <button
          type="button"
          className={activeTab === "teams" ? "active" : ""}
          onClick={() => setActiveTab("teams")}
        >
          Équipes <span>{teams.length}</span>
        </button>
      </div>

      <div className="resource-toolbar">
        <div className="resource-search">
          <Search size={17} />
          <input
            type="text"
            placeholder={
              activeTab === "colleagues"
                ? "Rechercher un collègue..."
                : "Rechercher une équipe..."
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
                <th>Équipes</th>
                <th>Tags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="resource-table-empty">
                    Aucun collègue trouvé.
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
                        onClick={() => handleDeleteUser(user.id)}
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
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
                <th>Équipe</th>
                <th>Membres</th>
                <th>Tags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={4} className="resource-table-empty">
                    Aucune équipe trouvée.
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
                        onClick={() => handleDeleteTeam(team.id)}
                        aria-label="Supprimer"
                      >
                        <Trash2 size={16} />
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