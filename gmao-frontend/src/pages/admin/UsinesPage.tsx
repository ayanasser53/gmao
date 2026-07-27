import { useEffect, useState, type FormEvent } from "react";

import { AxiosError } from "axios";
import {
  ArrowLeft,
  Building2,
  Check,
  CirclePlus,
  Copy,
  Mail,
  Pencil,
  Phone,
  Power,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import {
  createUsine,
  deleteUsine,
  getUsines,
  setUsineActive,
  updateUsine,
} from "../../services/usineService";

import { inviteUser } from "../../services/userService";

import type { ApiErrorResponse } from "../../types/auth";
import type { Usine, UsineRequest } from "../../types/usine";

import "./usines-styles.css";

const EMPTY_FORM: UsineRequest = {
  name: "",
  address: "",
  phone: "",
  email: "",
};

interface AdminFormState {
  firstName: string;
  lastName: string;
  email: string;
}

const EMPTY_ADMIN_FORM: AdminFormState = {
  firstName: "",
  lastName: "",
  email: "",
};

function UsinesPage() {
  const [usines, setUsines] = useState<Usine[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUsineId, setEditingUsineId] = useState<number | null>(null);
  const [form, setForm] = useState<UsineRequest>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [adminDrawerUsine, setAdminDrawerUsine] = useState<Usine | null>(
    null,
  );
  const [adminForm, setAdminForm] = useState<AdminFormState>(
    EMPTY_ADMIN_FORM,
  );
  const [adminError, setAdminError] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadUsines(): Promise<void> {
    try {
      setLoading(true);
      setPageError("");

      const data = await getUsines();
      setUsines(data);
    } catch (error) {
      console.error(error);
      setPageError("Impossible de charger les usines.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsines();
  }, []);

  const filteredUsines = usines.filter((usine) =>
    usine.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function openCreateDrawer(): void {
    setEditingUsineId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDrawerOpen(true);
  }

  function openEditDrawer(usine: Usine): void {
    setEditingUsineId(usine.id);
    setForm({
      name: usine.name,
      address: usine.address ?? "",
      phone: usine.phone ?? "",
      email: usine.email ?? "",
    });
    setFormError("");
    setDrawerOpen(true);
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
  }

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError("Le nom de l'usine est obligatoire.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      if (editingUsineId) {
        await updateUsine(editingUsineId, form);
      } else {
        await createUsine(form);
      }

      setDrawerOpen(false);
      await loadUsines();
    } catch (error) {
      console.error(error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      setFormError(
        axiosError.response?.data?.message ??
          "L'enregistrement a échoué. Vérifiez que ce nom n'est pas déjà utilisé.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(usine: Usine): Promise<void> {
    try {
      await setUsineActive(usine.id, !usine.active);
      await loadUsines();
    } catch (error) {
      console.error(error);
      setPageError("Impossible de mettre à jour le statut de cette usine.");
    }
  }

  async function handleDelete(usine: Usine): Promise<void> {
    const confirmed = window.confirm(
      `Supprimer définitivement l'usine "${usine.name}" ? Cette action est impossible si des utilisateurs y sont encore rattachés.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteUsine(usine.id);
      await loadUsines();
    } catch (error) {
      console.error(error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      setPageError(
        axiosError.response?.data?.message ??
          "Impossible de supprimer cette usine.",
      );
    }
  }

  function openAdminDrawer(usine: Usine): void {
    setAdminDrawerUsine(usine);
    setAdminForm(EMPTY_ADMIN_FORM);
    setAdminError("");
    setCreatedCredentials(null);
    setCopied(false);
  }

  function closeAdminDrawer(): void {
    setAdminDrawerUsine(null);
  }

  async function handleCreateAdmin(event: FormEvent): Promise<void> {
    event.preventDefault();

    if (!adminDrawerUsine) {
      return;
    }

    if (
      !adminForm.firstName.trim() ||
      !adminForm.lastName.trim() ||
      !adminForm.email.trim()
    ) {
      setAdminError("Merci de remplir tous les champs.");
      return;
    }

    setAdminSaving(true);
    setAdminError("");
    setCreatedCredentials(null);

    try {
      const result = await inviteUser({
        firstName: adminForm.firstName.trim(),
        lastName: adminForm.lastName.trim(),
        email: adminForm.email.trim(),
        role: "ADMIN",
        hourlyRate: null,
        tagIds: [],
        usineId: adminDrawerUsine.id,
      });

      setCreatedCredentials({
        email: result.user.email,
        password: result.temporaryPassword,
      });
      setAdminForm(EMPTY_ADMIN_FORM);
      await loadUsines();
    } catch (error) {
      console.error(error);

      const axiosError = error as AxiosError<ApiErrorResponse>;

      setAdminError(
        axiosError.response?.data?.message ??
          "La création a échoué. Vérifiez que l'email n'est pas déjà utilisé.",
      );
    } finally {
      setAdminSaving(false);
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
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <section className="usines-page">
      <div className="usines-header">
        <div>
          <h1>Usines</h1>
          <p>
            Créez les usines de votre organisation et rattachez-y un
            administrateur.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="usines-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher une usine..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="usines-new-button"
            onClick={openCreateDrawer}
          >
            <CirclePlus size={18} />
            Nouvelle usine
          </button>
        </div>
      </div>

      {pageError && <div className="error-message">{pageError}</div>}

      {loading ? (
        <p>Chargement...</p>
      ) : filteredUsines.length === 0 ? (
        <div className="usines-empty">
          Aucune usine pour le moment. Cliquez sur « Nouvelle usine » pour
          commencer.
        </div>
      ) : (
        <div className="usines-grid">
          {filteredUsines.map((usine) => (
            <div
              key={usine.id}
              className={`usine-card ${usine.active ? "" : "inactive"}`}
            >
              <div className="usine-card-top">
                <div className="usine-card-title">
                  <div className="usine-card-title-icon">
                    <Building2 size={20} />
                  </div>
                  <h3>{usine.name}</h3>
                </div>

                <span
                  className={`usine-status-badge ${
                    usine.active ? "active" : "inactive"
                  }`}
                >
                  {usine.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="usine-card-meta">
                {usine.address && <span>{usine.address}</span>}
                {usine.phone && (
                  <span>
                    <Phone size={14} /> {usine.phone}
                  </span>
                )}
                {usine.email && (
                  <span>
                    <Mail size={14} /> {usine.email}
                  </span>
                )}
              </div>

              <span className="usine-card-user-count">
                {usine.userCount} utilisateur{usine.userCount > 1 ? "s" : ""}
              </span>

              <div className="usine-card-actions">
                <button
                  type="button"
                  className="usine-action-button primary"
                  onClick={() => openAdminDrawer(usine)}
                >
                  <UserPlus size={15} />
                  Ajouter un admin
                </button>

                <button
                  type="button"
                  className="usine-action-button"
                  onClick={() => openEditDrawer(usine)}
                >
                  <Pencil size={15} />
                  Modifier
                </button>

                <button
                  type="button"
                  className="usine-action-button"
                  onClick={() => void handleToggleActive(usine)}
                >
                  <Power size={15} />
                  {usine.active ? "Désactiver" : "Activer"}
                </button>

                <button
                  type="button"
                  className="usine-action-button danger"
                  onClick={() => void handleDelete(usine)}
                >
                  <Trash2 size={15} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer création / édition d'usine */}
      {drawerOpen && (
        <section className="supplier-modal-page">
          <button
            type="button"
            className="supplier-form-backdrop"
            aria-label="Fermer"
            onClick={closeDrawer}
          />

          <aside className="supplier-form-drawer task-form-drawer">
            <form className="measure-drawer-content" onSubmit={handleSubmit}>
              <div className="measure-drawer-header">
                <button
                  type="button"
                  className="measure-drawer-back"
                  onClick={closeDrawer}
                  aria-label="Retour"
                >
                  <ArrowLeft size={22} />
                </button>
                <h2>{editingUsineId ? "Modifier l'usine" : "Nouvelle usine"}</h2>
                <button
                  type="button"
                  className="measure-drawer-close"
                  onClick={closeDrawer}
                  aria-label="Fermer"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="measure-drawer-body">
                {formError && (
                  <div className="measure-form-error">{formError}</div>
                )}

                <div className="measure-form-group">
                  <label>
                    Nom de l'usine <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Ex : Usine de Tanger"
                  />
                </div>

                <div className="measure-form-group">
                  <label>Adresse</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label>Téléphone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="measure-form-group">
                  <label>Email de contact</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="measure-drawer-footer">
                <button
                  type="button"
                  className="measure-cancel-button"
                  disabled={saving}
                  onClick={closeDrawer}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="measure-primary-button"
                  disabled={saving}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </aside>
        </section>
      )}

      {/* Drawer création d'administrateur pour une usine */}
      {adminDrawerUsine && (
        <section className="supplier-modal-page">
          <button
            type="button"
            className="supplier-form-backdrop"
            aria-label="Fermer"
            onClick={closeAdminDrawer}
          />

          <aside className="supplier-form-drawer task-form-drawer">
            <form
              className="measure-drawer-content"
              onSubmit={handleCreateAdmin}
            >
              <div className="measure-drawer-header">
                <button
                  type="button"
                  className="measure-drawer-back"
                  onClick={closeAdminDrawer}
                  aria-label="Retour"
                >
                  <ArrowLeft size={22} />
                </button>
                <h2>Ajouter un admin — {adminDrawerUsine.name}</h2>
                <button
                  type="button"
                  className="measure-drawer-close"
                  onClick={closeAdminDrawer}
                  aria-label="Fermer"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="measure-drawer-body">
                <p className="task-empty-hint">
                  Cette personne recevra le rôle Administrateur et ne pourra
                  gérer que les données de l'usine « {adminDrawerUsine.name} ».
                  Un mot de passe temporaire est généré automatiquement.
                </p>

                {adminError && (
                  <div className="measure-form-error">{adminError}</div>
                )}

                {createdCredentials ? (
                  <div className="usine-credentials-box">
                    <p>
                      Administrateur créé avec succès. Communiquez-lui ces
                      identifiants — <strong>ce mot de passe ne sera plus
                      jamais affiché</strong> :
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
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                      {copied ? "Copié !" : "Copier les identifiants"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="measure-form-group">
                      <label>
                        Prénom <span>*</span>
                      </label>
                      <input
                        type="text"
                        value={adminForm.firstName}
                        onChange={(event) =>
                          setAdminForm((current) => ({
                            ...current,
                            firstName: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="measure-form-group">
                      <label>
                        Nom <span>*</span>
                      </label>
                      <input
                        type="text"
                        value={adminForm.lastName}
                        onChange={(event) =>
                          setAdminForm((current) => ({
                            ...current,
                            lastName: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="measure-form-group">
                      <label>
                        Email <span>*</span>
                      </label>
                      <input
                        type="email"
                        value={adminForm.email}
                        onChange={(event) =>
                          setAdminForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="measure-drawer-footer">
                <button
                  type="button"
                  className="measure-cancel-button"
                  disabled={adminSaving}
                  onClick={closeAdminDrawer}
                >
                  Fermer
                </button>

                {!createdCredentials && (
                  <button
                    type="submit"
                    className="measure-primary-button"
                    disabled={adminSaving}
                  >
                    {adminSaving ? "Création..." : "Créer l'administrateur"}
                  </button>
                )}
              </div>
            </form>
          </aside>
        </section>
      )}
    </section>
  );
}

export default UsinesPage;
