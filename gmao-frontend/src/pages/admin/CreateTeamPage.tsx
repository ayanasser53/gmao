import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getTags } from "../../services/tagService";
import {
  createTeam,
  getTeamById,
  updateTeam,
} from "../../services/teamService";
import { getUsersDetailed } from "../../services/userService";
import type { Tag } from "../../types/tag";
import type { UserDetail } from "../../types/user";

import "./task-styles.css";
import "./team-styles.css";

function CreateTeamPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([getUsersDetailed(), getTags()])
      .then(([usersData, tagsData]) => {
        setUsers(usersData);
        setTags(tagsData);
      })
      .catch((requestError) => console.error(requestError));
  }, []);

  useEffect(() => {
    if (!isEdit) {
      return;
    }

    void getTeamById(Number(id))
      .then((team) => {
        setName(team.name);
        setDescription(team.description ?? "");
        setMemberIds(team.members.map((member) => member.id));
        setTagIds(team.tags.map((tag) => tag.id));
      })
      .catch((requestError) => {
        console.error(requestError);
        setError("Impossible de charger cette équipe.");
      });
  }, [id, isEdit]);

  function addMember(userId: number) {
    if (!memberIds.includes(userId)) {
      setMemberIds((current) => [...current, userId]);
    }
  }

  function removeMember(userId: number) {
    setMemberIds((current) => current.filter((value) => value !== userId));
  }

  function toggleTag(tagId: number) {
    setTagIds((current) =>
      current.includes(tagId)
        ? current.filter((value) => value !== tagId)
        : [...current, tagId],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Le nom de l'équipe est obligatoire.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      name: name.trim(),
      description: description.trim(),
      memberIds,
      tagIds,
    };

    try {
      if (isEdit) {
        await updateTeam(Number(id), payload);
      } else {
        await createTeam(payload);
      }

      navigate("/admin/teams");
    } catch (requestError) {
      console.error(requestError);
      setError("L'enregistrement de l'équipe a échoué.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedMembers = users.filter((user) => memberIds.includes(user.id));
  const availableMembers = users.filter(
    (user) => !memberIds.includes(user.id),
  );

  return (
    <section className="supplier-modal-page">
      <button
        type="button"
        className="supplier-form-backdrop"
        aria-label="Retour à l'équipe"
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
            <h2>{isEdit ? "Modifier l'équipe" : "Créer une équipe"}</h2>
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

            <div className="task-form-section">
              <div className="measure-form-group">
                <label>
                  Nom de l'équipe <span>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Équipe hydraulique"
                  maxLength={255}
                />
              </div>

              <div className="measure-form-group">
                <label>Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex : Cette équipe s'occupe de la maintenance hydraulique"
                  maxLength={5000}
                />
              </div>
            </div>

            <div className="task-form-section">
              <div className="supplier-drawer-section-title">
                <span>Collègues</span>
              </div>

              <div className="task-chip-list">
                {selectedMembers.length === 0 && (
                  <p className="task-empty-hint">Aucun collègue ajouté.</p>
                )}

                {selectedMembers.map((member) => (
                  <span className="task-spare-line" key={member.id}>
                    <span className="task-spare-line-info">
                      <strong>
                        {member.firstName} {member.lastName}
                      </strong>
                      <em>{member.email}</em>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      aria-label={`Retirer ${member.firstName}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>

              <select
                className="task-add-select"
                value=""
                onChange={(e) => {
                  if (e.target.value) addMember(Number(e.target.value));
                }}
              >
                <option value="">+ Sélectionner un collègue</option>
                {availableMembers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="task-form-section">
              <div className="supplier-drawer-section-title">
                <span>Tags</span>
              </div>

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
                      color: tagIds.includes(tag.id) ? "#ffffff" : tag.color,
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
                  : "Créer l'équipe"}
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}

export default CreateTeamPage;
