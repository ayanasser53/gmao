import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { AxiosError } from "axios";

import {
  ArrowLeft,
  CircleHelp,
  CirclePlus,
  Hash,
  History,
  Info,
  Pencil,
  Ruler,
  Search,
  Settings2,
  Trash2,
  Type,
  X,
} from "lucide-react";

import {
  createMeasure,
  deleteMeasure,
  getMeasures,
  updateMeasure,
} from "../../services/measureService";

import {
  createUnit,
  getUnits,
} from "../../services/unitService";

import type { ApiErrorResponse } from "../../types/auth";

import type {
  CreateMeasureRequest,
  Measure,
} from "../../types/measure";

import type {
  CreateUnitRequest,
  MeasurementUnit,
  UnitType,
} from "../../types/unit";

interface MeasureFormState {
  name: string;
  code: string;
  description: string;
  unitId: number;
}

interface UnitFormState {
  name: string;
  symbol: string;
  code: string;
  unitType: UnitType;
}

function MeasuresPage() {
  const [measures, setMeasures] = useState<Measure[]>([]);
  const [units, setUnits] = useState<MeasurementUnit[]>([]);

  const [editingMeasureId, setEditingMeasureId] =
    useState<number | null>(null);

  const [deletingMeasureId, setDeletingMeasureId] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [measureDrawerOpen, setMeasureDrawerOpen] =
    useState(false);

  const [unitDrawerOpen, setUnitDrawerOpen] =
    useState(false);

  const [unitManagementOpen, setUnitManagementOpen] =
    useState(false);

  const [savingMeasure, setSavingMeasure] =
    useState(false);

  const [savingUnit, setSavingUnit] =
    useState(false);

  const [pageError, setPageError] = useState("");
  const [measureError, setMeasureError] = useState("");
  const [unitError, setUnitError] = useState("");

  const [measureForm, setMeasureForm] =
    useState<MeasureFormState>({
      name: "",
      code: "",
      description: "",
      unitId: 0,
    });

  const [unitForm, setUnitForm] =
    useState<UnitFormState>({
      name: "",
      symbol: "",
      code: "",
      unitType: "NUMBER",
    });

  async function loadMeasures(): Promise<void> {
    try {
      setLoading(true);
      setPageError("");

      const data = await getMeasures();
      setMeasures(data);
    } catch (error) {
      console.error("Erreur chargement mesures :", error);
      setPageError("Impossible de charger les mesures.");
    } finally {
      setLoading(false);
    }
  }

  async function loadUnits(): Promise<void> {
    try {
      const data = await getUnits();
      setUnits(data);
    } catch (error) {
      console.error("Erreur chargement unités :", error);
      setPageError("Impossible de charger les unités.");
    }
  }

  useEffect(() => {
    void loadMeasures();
    void loadUnits();
  }, []);

  const filteredMeasures = useMemo(() => {
    const searchedValue = search.trim().toLowerCase();

    if (!searchedValue) {
      return measures;
    }

    return measures.filter((measure) => {
      return (
        measure.code.toLowerCase().includes(searchedValue) ||
        measure.name.toLowerCase().includes(searchedValue) ||
        measure.unitName.toLowerCase().includes(searchedValue) ||
        measure.unitSymbol.toLowerCase().includes(searchedValue)
      );
    });
  }, [measures, search]);

  function resetMeasureForm(): void {
    setMeasureForm({
      name: "",
      code: "",
      description: "",
      unitId: 0,
    });
  }

  function openMeasureDrawer(): void {
    setEditingMeasureId(null);
    setMeasureError("");
    resetMeasureForm();
    setMeasureDrawerOpen(true);
  }

  function openEditMeasureDrawer(measure: Measure): void {
    setMeasureError("");
    setEditingMeasureId(measure.id);

    setMeasureForm({
      name: measure.name,
      code: measure.code,
      description: measure.description ?? "",
      unitId: measure.unitId,
    });

    setMeasureDrawerOpen(true);
  }

  function closeMeasureDrawer(): void {
    setMeasureDrawerOpen(false);
    setEditingMeasureId(null);
    setMeasureError("");
    resetMeasureForm();
  }

  function closeAllDrawers(): void {
    setMeasureDrawerOpen(false);
    setUnitDrawerOpen(false);
    setUnitManagementOpen(false);

    setEditingMeasureId(null);
    setMeasureError("");
    setUnitError("");

    resetMeasureForm();
  }

  function closeUnitDrawer(): void {
    setUnitDrawerOpen(false);
    setUnitError("");
  }

  function openCreateUnitDrawer(): void {
    setUnitError("");

    setUnitForm({
      name: "",
      symbol: "",
      code: "",
      unitType: "NUMBER",
    });

    setUnitDrawerOpen(true);
  }

  function extractErrorMessage(
    error: unknown,
    fallbackMessage: string,
  ): string {
    const axiosError =
      error as AxiosError<ApiErrorResponse | string>;

    const responseData = axiosError.response?.data;

    if (
      typeof responseData === "string" &&
      responseData.trim()
    ) {
      return responseData;
    }

    if (
      typeof responseData === "object" &&
      responseData !== null
    ) {
      return (
        responseData.message ??
        responseData.error ??
        fallbackMessage
      );
    }

    if (axiosError.code === "ERR_NETWORK") {
      return "Impossible de contacter le serveur.";
    }

    return fallbackMessage;
  }

  async function handleSaveMeasure(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setMeasureError("");

    if (!measureForm.name.trim()) {
      setMeasureError(
        "Le nom de la mesure est obligatoire.",
      );
      return;
    }

    if (!measureForm.unitId) {
      setMeasureError(
        "Veuillez sélectionner une unité.",
      );
      return;
    }

    const request: CreateMeasureRequest = {
      name: measureForm.name.trim(),
      code: measureForm.code.trim(),
      description: measureForm.description.trim(),
      unitId: measureForm.unitId,
    };

    try {
      setSavingMeasure(true);

      if (editingMeasureId !== null) {
        const updatedMeasure = await updateMeasure(
          editingMeasureId,
          request,
        );

        setMeasures((previousMeasures) =>
          previousMeasures
            .map((measure) =>
              measure.id === updatedMeasure.id
                ? updatedMeasure
                : measure,
            )
            .sort((first, second) =>
              first.name.localeCompare(second.name),
            ),
        );
      } else {
        const createdMeasure =
          await createMeasure(request);

        setMeasures((previousMeasures) =>
          [...previousMeasures, createdMeasure].sort(
            (first, second) =>
              first.name.localeCompare(second.name),
          ),
        );
      }

      closeMeasureDrawer();
    } catch (error) {
      setMeasureError(
        extractErrorMessage(
          error,
          editingMeasureId !== null
            ? "Impossible de modifier la mesure."
            : "Impossible de créer la mesure.",
        ),
      );
    } finally {
      setSavingMeasure(false);
    }
  }

  async function handleDeleteMeasure(
    measure: Measure,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer la mesure "${measure.name}" ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingMeasureId(measure.id);
      setPageError("");

      await deleteMeasure(measure.id);

      setMeasures((previousMeasures) =>
        previousMeasures.filter(
          (item) => item.id !== measure.id,
        ),
      );
    } catch (error) {
      setPageError(
        extractErrorMessage(
          error,
          "Impossible de supprimer la mesure.",
        ),
      );
    } finally {
      setDeletingMeasureId(null);
    }
  }

  async function handleCreateUnit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setUnitError("");

    if (!unitForm.name.trim()) {
      setUnitError(
        "Le nom de l’unité est obligatoire.",
      );
      return;
    }

    if (!unitForm.symbol.trim()) {
      setUnitError(
        "Le symbole de l’unité est obligatoire.",
      );
      return;
    }

    const request: CreateUnitRequest = {
      name: unitForm.name.trim(),
      symbol: unitForm.symbol.trim(),
      code: unitForm.code.trim(),
      unitType: unitForm.unitType,
    };

    try {
      setSavingUnit(true);

      const createdUnit = await createUnit(request);

      setUnits((previousUnits) =>
        [...previousUnits, createdUnit].sort(
          (first, second) =>
            first.name.localeCompare(second.name),
        ),
      );

      setMeasureForm((previousForm) => ({
        ...previousForm,
        unitId: createdUnit.id,
      }));

      setUnitDrawerOpen(false);
    } catch (error) {
      setUnitError(
        extractErrorMessage(
          error,
          "Impossible de créer l’unité.",
        ),
      );
    } finally {
      setSavingUnit(false);
    }
  }

  const hasOpenDrawer =
    measureDrawerOpen ||
    unitDrawerOpen ||
    unitManagementOpen;

 return (
    <section className="measures-workspace">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <Ruler size={28} />

            <h1>Mesures</h1>

            <button
              type="button"
              className="measure-help-button"
              aria-label="Aide sur les mesures"
            >
              <CircleHelp size={20} />
            </button>
          </div>
        </div>

        <div className="measures-heading-actions">
          <button
            type="button"
            className="measure-outline-button"
            onClick={() =>
              setUnitManagementOpen(true)
            }
          >
            <Settings2 size={19} />
            Gérer les unités
          </button>

          <button
            type="button"
            className="measure-primary-button"
            onClick={openMeasureDrawer}
          >
            <CirclePlus size={19} />
            Créer une mesure
          </button>
        </div>
      </div>

      {pageError && (
        <div className="measure-page-error">
          {pageError}
        </div>
      )}

      <div className="resource-toolbar measures-search-toolbar">
        <div className="resource-search measure-search-bar">
          <Search size={18} />

          <input
            type="search"
            placeholder="Rechercher une mesure"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="measure-loading">
          Chargement des mesures...
        </div>
      ) : (
        <div className="measure-table-wrapper">
          <table className="measure-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Unité</th>

                <th>
                  <span className="measure-table-heading-info">
                    Type d’unité
                    <Info size={17} />
                  </span>
                </th>

                <th className="measure-actions-header">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredMeasures.map((measure) => (
                <tr key={measure.id}>
                  <td>{measure.code}</td>
                  <td>{measure.name}</td>

                  <td>
                    {measure.unitName} (
                    {measure.unitSymbol})
                  </td>

                  <td>
                    {measure.unitType === "NUMBER"
                      ? "Nombre"
                      : "Texte"}
                  </td>

                  <td>
                    <div className="measure-row-actions">
                      <button
                        type="button"
                        className="measure-edit-action"
                        title="Modifier la mesure"
                        aria-label={`Modifier ${measure.name}`}
                        onClick={() =>
                          openEditMeasureDrawer(measure)
                        }
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="measure-delete-action"
                        title="Supprimer la mesure"
                        aria-label={`Supprimer ${measure.name}`}
                        disabled={
                          deletingMeasureId === measure.id
                        }
                        onClick={() =>
                          void handleDeleteMeasure(measure)
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMeasures.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="measure-empty-row"
                  >
                    Aucune mesure trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {hasOpenDrawer && (
        <button
          type="button"
          className="measure-drawer-backdrop"
          onClick={closeAllDrawers}
          aria-label="Fermer"
        />
      )}

      <aside
        className={`measure-drawer measure-main-drawer ${
          measureDrawerOpen
            ? "measure-drawer-visible"
            : ""
        }`}
      >
        <form
          className="measure-drawer-content"
          onSubmit={handleSaveMeasure}
        >
          <div className="measure-drawer-header">
            <button
              type="button"
              className="measure-drawer-back"
              onClick={closeMeasureDrawer}
              aria-label="Fermer le formulaire"
            >
              <ArrowLeft size={22} />
            </button>

            <h2>
              {editingMeasureId !== null
                ? "Modifier la mesure"
                : "Créer une mesure"}
            </h2>

            <button
              type="button"
              className="measure-drawer-close"
              onClick={closeMeasureDrawer}
              aria-label="Fermer"
            >
              <X size={21} />
            </button>
          </div>

          <div className="measure-drawer-body">
            {measureError && (
              <div className="measure-form-error">
                {measureError}
              </div>
            )}

            <div className="measure-form-group">
              <label htmlFor="measure-name">
                Nom <span>*</span>
              </label>

              <input
                id="measure-name"
                type="text"
                maxLength={255}
                placeholder="Exemple : Pression hydraulique"
                value={measureForm.name}
                onChange={(event) =>
                  setMeasureForm(
                    (previousForm) => ({
                      ...previousForm,
                      name: event.target.value,
                    }),
                  )
                }
                disabled={savingMeasure}
              />

              <div className="measure-field-footer">
                <span>Champ obligatoire</span>

                <span>
                  {measureForm.name.length} / 255
                </span>
              </div>
            </div>

            <div className="measure-form-group">
              <label htmlFor="measure-code">
                Code
              </label>

              <input
                id="measure-code"
                type="text"
                maxLength={100}
                placeholder="Généré automatiquement"
                value={measureForm.code}
                onChange={(event) =>
                  setMeasureForm(
                    (previousForm) => ({
                      ...previousForm,
                      code: event.target.value,
                    }),
                  )
                }
                disabled={savingMeasure}
              />

              <small>
                Utilisé pour les intégrations. Laissez
                vide pour générer automatiquement le code.
              </small>
            </div>

            <div className="measure-form-group">
              <label htmlFor="measure-description">
                Description
              </label>

              <div className="measure-editor">
                <div className="measure-editor-toolbar">
                  <span>Aperçu</span>
                  <strong>B</strong>
                  <em>I</em>
                  <span>🔗</span>
                  <span>☷</span>
                </div>

                <textarea
                  id="measure-description"
                  maxLength={5000}
                  placeholder="Décrivez l’utilisation de cette mesure..."
                  value={measureForm.description}
                  onChange={(event) =>
                    setMeasureForm(
                      (previousForm) => ({
                        ...previousForm,
                        description:
                          event.target.value,
                      }),
                    )
                  }
                  disabled={savingMeasure}
                />
              </div>
            </div>

            <div className="measure-unit-line">
              <div className="measure-form-group">
                <label htmlFor="measure-unit">
                  Unité <span>*</span>
                </label>

                <select
                  id="measure-unit"
                  value={measureForm.unitId}
                  onChange={(event) =>
                    setMeasureForm(
                      (previousForm) => ({
                        ...previousForm,
                        unitId: Number(
                          event.target.value,
                        ),
                      }),
                    )
                  }
                  disabled={savingMeasure}
                >
                  <option value={0}>
                    Sélectionner une unité
                  </option>

                  {units.map((unit) => (
                    <option
                      key={unit.id}
                      value={unit.id}
                    >
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="measure-add-unit-button"
                onClick={openCreateUnitDrawer}
              >
                Ajouter une unité
              </button>
            </div>
          </div>

          <div className="measure-drawer-footer">
            <button
              type="button"
              className="measure-cancel-button"
              onClick={closeMeasureDrawer}
              disabled={savingMeasure}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="measure-primary-button"
              disabled={savingMeasure}
            >
              {savingMeasure
                ? "Enregistrement..."
                : editingMeasureId !== null
                  ? "Enregistrer les modifications"
                  : "Créer la mesure"}
            </button>
          </div>
        </form>
      </aside>

      <aside
        className={`measure-drawer measure-unit-drawer ${
          unitDrawerOpen
            ? "measure-drawer-visible"
            : ""
        }`}
      >
        <form
          className="measure-drawer-content"
          onSubmit={handleCreateUnit}
        >
          <div className="measure-drawer-header">
            <button
              type="button"
              className="measure-drawer-back"
              onClick={closeUnitDrawer}
              aria-label="Retour au formulaire de mesure"
            >
              <ArrowLeft size={22} />
            </button>

            <h2>Ajouter une unité</h2>

            <button
              type="button"
              className="measure-drawer-close"
              onClick={closeUnitDrawer}
              aria-label="Fermer"
            >
              <X size={21} />
            </button>
          </div>

          <div className="measure-drawer-body">
            {unitError && (
              <div className="measure-form-error">
                {unitError}
              </div>
            )}

            <div className="measure-resume-notice">
              <History size={21} />

              <span>
                La saisie de votre mesure est conservée.
              </span>

              <button
                type="button"
                onClick={closeUnitDrawer}
              >
                Reprendre ma saisie
              </button>
            </div>

            <div className="measure-form-group">
              <label htmlFor="unit-name">
                Nom <span>*</span>
              </label>

              <input
                id="unit-name"
                type="text"
                maxLength={255}
                placeholder="Exemple : Minutes"
                value={unitForm.name}
                onChange={(event) =>
                  setUnitForm((previousForm) => ({
                    ...previousForm,
                    name: event.target.value,
                  }))
                }
                disabled={savingUnit}
              />

              <div className="measure-field-footer">
                <span>Champ obligatoire</span>

                <span>
                  {unitForm.name.length} / 255
                </span>
              </div>
            </div>

            <div className="measure-form-group">
              <label htmlFor="unit-symbol">
                Symbole <span>*</span>
              </label>

              <input
                id="unit-symbol"
                type="text"
                maxLength={20}
                placeholder="Exemple : min"
                value={unitForm.symbol}
                onChange={(event) =>
                  setUnitForm((previousForm) => ({
                    ...previousForm,
                    symbol: event.target.value,
                  }))
                }
                disabled={savingUnit}
              />
            </div>

            <div className="measure-form-group">
              <label htmlFor="unit-code">
                Code
              </label>

              <input
                id="unit-code"
                type="text"
                maxLength={100}
                placeholder="Généré automatiquement"
                value={unitForm.code}
                onChange={(event) =>
                  setUnitForm((previousForm) => ({
                    ...previousForm,
                    code: event.target.value,
                  }))
                }
                disabled={savingUnit}
              />

              <small>
                Laissez vide pour générer le code
                automatiquement.
              </small>
            </div>

            <div className="measure-form-group">
              <label>
                Type d’unité <span>*</span>
              </label>

              <div className="measure-unit-type-grid">
                <button
                  type="button"
                  className={`measure-unit-type-card ${
                    unitForm.unitType === "NUMBER"
                      ? "measure-unit-type-card-active"
                      : ""
                  }`}
                  onClick={() =>
                    setUnitForm((previousForm) => ({
                      ...previousForm,
                      unitType: "NUMBER",
                    }))
                  }
                >
                  <Hash size={27} />
                  <strong>Nombre</strong>
                </button>

                <button
                  type="button"
                  className={`measure-unit-type-card ${
                    unitForm.unitType === "TEXT"
                      ? "measure-unit-type-card-active"
                      : ""
                  }`}
                  onClick={() =>
                    setUnitForm((previousForm) => ({
                      ...previousForm,
                      unitType: "TEXT",
                    }))
                  }
                >
                  <Type size={27} />
                  <strong>Texte</strong>
                </button>
              </div>
            </div>
          </div>

          <div className="measure-drawer-footer">
            <button
              type="button"
              className="measure-cancel-button"
              onClick={closeUnitDrawer}
              disabled={savingUnit}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="measure-primary-button"
              disabled={savingUnit}
            >
              {savingUnit
                ? "Création..."
                : "Ajouter l’unité"}
            </button>
          </div>
        </form>
      </aside>

      <aside
        className={`measure-drawer measure-management-drawer ${
          unitManagementOpen
            ? "measure-drawer-visible"
            : ""
        }`}
      >
        <div className="measure-drawer-content">
          <div className="measure-drawer-header">
            <button
              type="button"
              className="measure-drawer-back"
              onClick={() =>
                setUnitManagementOpen(false)
              }
              aria-label="Fermer la gestion des unités"
            >
              <ArrowLeft size={22} />
            </button>

            <h2>Gestion des unités</h2>

            <button
              type="button"
              className="measure-drawer-close"
              onClick={() =>
                setUnitManagementOpen(false)
              }
              aria-label="Fermer"
            >
              <X size={21} />
            </button>
          </div>

          <div className="measure-management-actions">
            <button
              type="button"
              className="measure-primary-button"
              onClick={openCreateUnitDrawer}
            >
              <CirclePlus size={18} />
              Ajouter une unité
            </button>
          </div>

          <div className="measure-unit-table-wrapper">
            <table className="measure-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Symbole</th>
                  <th>Type</th>
                  <th>Code</th>
                </tr>
              </thead>

              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td>{unit.name}</td>
                    <td>{unit.symbol}</td>

                    <td>
                      {unit.unitType === "NUMBER"
                        ? "Nombre"
                        : "Texte"}
                    </td>

                    <td>{unit.code}</td>
                  </tr>
                ))}

                {units.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="measure-empty-row"
                    >
                      Aucune unité trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </aside>
    </section>
  );
}

export default MeasuresPage;
