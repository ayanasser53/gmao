import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Check,
  CircleHelp,
  CirclePlus,
  Pencil,
  Search,
  Tag as TagIcon,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import {
  createTag,
  deleteTag,
  getTags,
  updateTag,
} from "../../services/tagService";

import {
  createTagGroup,
  deleteTagGroup,
  getTagGroups,
  updateTagGroup,
} from "../../services/tagGroupService";

import type {
  CreateTagGroupRequest,
  CreateTagRequest,
  Tag,
  TagGroup,
} from "../../types/tag";

type ActiveTab = "TAGS" | "GROUPS";

function TagsPage() {
  const [activeTab, setActiveTab] =
    useState<ActiveTab>("TAGS");

  const [tags, setTags] = useState<Tag[]>([]);
  const [groups, setGroups] = useState<TagGroup[]>([]);

  const [search, setSearch] = useState("");

  const [tagDrawerOpen, setTagDrawerOpen] =
    useState(false);

  const [groupDrawerOpen, setGroupDrawerOpen] =
    useState(false);

  const [editingTagId, setEditingTagId] =
    useState<number | null>(null);

  const [editingGroupId, setEditingGroupId] =
    useState<number | null>(null);

  const [tagForm, setTagForm] =
    useState<CreateTagRequest>({
      name: "",
      code: "",
      color: "#8A8F98",
      groupId: null,
    });

  const [groupForm, setGroupForm] =
    useState<CreateTagGroupRequest>({
      name: "",
      tagIds: [],
      singleChoice: false,
      mandatory: false,
    });

  const [error, setError] = useState("");

  async function loadData(): Promise<void> {
    try {
      setError("");

      const [tagData, groupData] =
        await Promise.all([
          getTags(),
          getTagGroups(),
        ]);

      setTags(tagData);
      setGroups(groupData);
    } catch {
      setError(
        "Impossible de charger les tags et les groupes.",
      );
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredTags = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return tags;
    }

    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(value) ||
        tag.code.toLowerCase().includes(value) ||
        tag.groupName
          ?.toLowerCase()
          .includes(value),
    );
  }, [search, tags]);

  function openCreateTag(): void {
    setEditingTagId(null);

    setTagForm({
      name: "",
      code: "",
      color: "#8A8F98",
      groupId: null,
    });

    setTagDrawerOpen(true);
  }

  function openEditTag(tag: Tag): void {
    setEditingTagId(tag.id);

    setTagForm({
      name: tag.name,
      code: tag.code,
      color: tag.color,
      groupId: tag.groupId,
    });

    setTagDrawerOpen(true);
  }

  function openCreateGroup(): void {
    setEditingGroupId(null);

    setGroupForm({
      name: "",
      tagIds: [],
      singleChoice: false,
      mandatory: false,
    });

    setGroupDrawerOpen(true);
  }

  function openEditGroup(group: TagGroup): void {
    setEditingGroupId(group.id);

    setGroupForm({
      name: group.name,
      tagIds: group.tags.map((tag) => tag.id),
      singleChoice: group.singleChoice,
      mandatory: group.mandatory,
    });

    setGroupDrawerOpen(true);
  }

  async function handleSaveTag(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!tagForm.name.trim()) {
      setError("Le nom du tag est obligatoire.");
      return;
    }

    if (editingTagId === null) {
      await createTag(tagForm);
    } else {
      await updateTag(editingTagId, tagForm);
    }

    setTagDrawerOpen(false);
    await loadData();
  }

  async function handleSaveGroup(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!groupForm.name.trim()) {
      setError(
        "Le nom du groupe est obligatoire.",
      );
      return;
    }

    if (editingGroupId === null) {
      await createTagGroup(groupForm);
    } else {
      await updateTagGroup(
        editingGroupId,
        groupForm,
      );
    }

    setGroupDrawerOpen(false);
    await loadData();
  }

  async function handleDeleteTag(tag: Tag): Promise<void> {
    if (
      !window.confirm(
        `Supprimer le tag "${tag.name}" ?`,
      )
    ) {
      return;
    }

    await deleteTag(tag.id);
    await loadData();
  }

  async function handleDeleteGroup(
    group: TagGroup,
  ): Promise<void> {
    if (
      !window.confirm(
        `Supprimer le groupe "${group.name}" ?`,
      )
    ) {
      return;
    }

    await deleteTagGroup(group.id);
    await loadData();
  }

  function toggleTagInGroup(tagId: number): void {
    setGroupForm((previous) => ({
      ...previous,
      tagIds: previous.tagIds.includes(tagId)
        ? previous.tagIds.filter(
            (id) => id !== tagId,
          )
        : [...previous.tagIds, tagId],
    }));
  }

  const drawerOpen =
    tagDrawerOpen || groupDrawerOpen;

  return (
    <section className="tags-workspace">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <Tags size={28} />
            <h1>Tags</h1>
            <CircleHelp size={20} />
          </div>
        </div>

        <button
          type="button"
          className="tags-primary-button"
          onClick={
            activeTab === "TAGS"
              ? openCreateTag
              : openCreateGroup
          }
        >
          <CirclePlus size={18} />

          {activeTab === "TAGS"
            ? "Créer un tag"
            : "Créer un groupe"}
        </button>
      </div>

      <div className="tags-tabs">
        <button
          type="button"
          className={
            activeTab === "TAGS"
              ? "tags-tab tags-tab-active"
              : "tags-tab"
          }
          onClick={() => setActiveTab("TAGS")}
        >
          <TagIcon size={19} />
          Tags
        </button>

        <button
          type="button"
          className={
            activeTab === "GROUPS"
              ? "tags-tab tags-tab-active"
              : "tags-tab"
          }
          onClick={() => setActiveTab("GROUPS")}
        >
          <Tags size={19} />
          Groupes de tags
        </button>
      </div>

      {error && (
        <div className="tags-error">{error}</div>
      )}

      {activeTab === "TAGS" ? (
        <>
          <div className="tags-search">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un tag"
            />
          </div>

          <div className="tags-table-wrapper">
            <table className="tags-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Code</th>
                  <th>Groupe</th>
                  <th>Nom</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTags.map((tag) => (
                  <tr key={tag.id}>
                    <td>{tag.id}</td>
                    <td>{tag.code}</td>
                    <td>{tag.groupName ?? "—"}</td>

                    <td>
                      <span
                        className="tag-color-label"
                        style={{
                          backgroundColor: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    </td>

                    <td>
                      <div className="tags-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openEditTag(tag)
                          }
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="tags-delete"
                          onClick={() =>
                            void handleDeleteTag(tag)
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="tag-group-information">
            Les groupes permettent de rassembler
            plusieurs tags dans une catégorie et de
            contrôler leur sélection dans les tâches.
          </div>

          <div className="tags-table-wrapper">
            <table className="tags-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom</th>
                  <th>Choix unique</th>
                  <th>Obligatoire</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.id}</td>
                    <td>{group.name}</td>

                    <td>
                      {group.singleChoice
                        ? "Oui"
                        : "Non"}
                    </td>

                    <td>
                      {group.mandatory
                        ? "Oui"
                        : "Non"}
                    </td>

                    <td>
                      <div className="tags-actions">
                        <button
                          type="button"
                          onClick={() =>
                            openEditGroup(group)
                          }
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="tags-delete"
                          onClick={() =>
                            void handleDeleteGroup(group)
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {drawerOpen && (
        <button
          type="button"
          className="tags-drawer-overlay"
          onClick={() => {
            setTagDrawerOpen(false);
            setGroupDrawerOpen(false);
          }}
        />
      )}

      <aside
        className={
          tagDrawerOpen
            ? "tags-drawer tags-drawer-open"
            : "tags-drawer"
        }
      >
        <form onSubmit={handleSaveTag}>
          <div className="tags-drawer-header">
            <button
              type="button"
              onClick={() =>
                setTagDrawerOpen(false)
              }
            >
              <ArrowLeft size={21} />
            </button>

            <h2>
              {editingTagId === null
                ? "Créer un tag"
                : "Modifier le tag"}
            </h2>

            <button
              type="button"
              onClick={() =>
                setTagDrawerOpen(false)
              }
            >
              <X size={20} />
            </button>
          </div>

          <div className="tags-drawer-body">
            <label>Nom *</label>

            <input
              value={tagForm.name}
              onChange={(event) =>
                setTagForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />

            <label>Code</label>

            <input
              value={tagForm.code}
              placeholder="Généré automatiquement"
              onChange={(event) =>
                setTagForm((previous) => ({
                  ...previous,
                  code: event.target.value,
                }))
              }
            />

            <label>Couleur</label>

            <input
              type="color"
              value={tagForm.color}
              onChange={(event) =>
                setTagForm((previous) => ({
                  ...previous,
                  color: event.target.value,
                }))
              }
            />

            <label>Groupe</label>

            <select
              value={tagForm.groupId ?? ""}
              onChange={(event) =>
                setTagForm((previous) => ({
                  ...previous,
                  groupId: event.target.value
                    ? Number(event.target.value)
                    : null,
                }))
              }
            >
              <option value="">Aucun groupe</option>

              {groups.map((group) => (
                <option
                  key={group.id}
                  value={group.id}
                >
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="tags-drawer-footer">
            <button
              type="button"
              className="tags-cancel-button"
              onClick={() =>
                setTagDrawerOpen(false)
              }
            >
              Annuler
            </button>

            <button
              type="submit"
              className="tags-primary-button"
            >
              {editingTagId === null
                ? "Créer"
                : "Mettre à jour"}
            </button>
          </div>
        </form>
      </aside>

      <aside
        className={
          groupDrawerOpen
            ? "tags-drawer tags-drawer-open"
            : "tags-drawer"
        }
      >
        <form onSubmit={handleSaveGroup}>
          <div className="tags-drawer-header">
            <button
              type="button"
              onClick={() =>
                setGroupDrawerOpen(false)
              }
            >
              <ArrowLeft size={21} />
            </button>

            <h2>
              {editingGroupId === null
                ? "Créer un groupe"
                : "Modifier le groupe"}
            </h2>

            <button
              type="button"
              onClick={() =>
                setGroupDrawerOpen(false)
              }
            >
              <X size={20} />
            </button>
          </div>

          <div className="tags-drawer-body">
            <label>Nom *</label>

            <input
              value={groupForm.name}
              onChange={(event) =>
                setGroupForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />

            <label>Tags</label>

            <div className="tag-selection-list">
              {tags.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  className={
                    groupForm.tagIds.includes(tag.id)
                      ? "tag-selection-item tag-selection-item-selected"
                      : "tag-selection-item"
                  }
                  onClick={() =>
                    toggleTagInGroup(tag.id)
                  }
                >
                  {groupForm.tagIds.includes(
                    tag.id,
                  ) && <Check size={15} />}

                  {tag.name}
                </button>
              ))}
            </div>

            <label className="tag-switch-line">
              <input
                type="checkbox"
                checked={groupForm.singleChoice}
                onChange={(event) =>
                  setGroupForm((previous) => ({
                    ...previous,
                    singleChoice:
                      event.target.checked,
                  }))
                }
              />

              <span>
                Un seul tag peut être sélectionné
              </span>
            </label>

            <label className="tag-switch-line">
              <input
                type="checkbox"
                checked={groupForm.mandatory}
                onChange={(event) =>
                  setGroupForm((previous) => ({
                    ...previous,
                    mandatory:
                      event.target.checked,
                  }))
                }
              />

              <span>
                La sélection d’un tag est obligatoire
              </span>
            </label>
          </div>

          <div className="tags-drawer-footer">
            <button
              type="button"
              className="tags-cancel-button"
              onClick={() =>
                setGroupDrawerOpen(false)
              }
            >
              Annuler
            </button>

            <button
              type="submit"
              className="tags-primary-button"
            >
              {editingGroupId === null
                ? "Créer"
                : "Mettre à jour"}
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
}

export default TagsPage;