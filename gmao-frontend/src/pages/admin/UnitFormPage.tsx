import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { AxiosError } from "axios";

import {
  ArrowLeft,
  Save,
  Settings2,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createUnit,
  getUnitById,
  updateUnit,
} from "../../services/unitService";

import type { ApiErrorResponse } from "../../types/auth";

import type {
  CreateUnitRequest,
  UnitType,
} from "../../types/unit";

function UnitFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [form, setForm] =
    useState<CreateUnitRequest>({
      name: "",
      symbol: "",
      code: "",
      unitType: "NUMBER",
    });

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] =
    useState(isEditMode);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditMode || !id) {
      return;
    }

    async function loadUnit(): Promise<void> {
      try {
        setPageLoading(true);

        const unit =
          await getUnitById(Number(id));

        setForm({
          name: unit.name,
          symbol: unit.symbol,
          code: unit.code,
          unitType: unit.unitType,
        });
      } catch (requestError) {
        console.error(
          "Erreur chargement unité :",
          requestError,
        );

        setError(
          "Impossible de charger l'unité.",
        );
      } finally {
        setPageLoading(false);
      }
    }

    void loadUnit();
  }, [id, isEditMode]);

  function updateField(
    field: keyof CreateUnitRequest,
    value: string | UnitType,
  ): void {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError(
        "Le nom de l'unité est obligatoire.",
      );
      return;
    }

    if (!form.symbol.trim()) {
      setError(
        "Le symbole de l'unité est obligatoire.",
      );
      return;
    }

    const requestData: CreateUnitRequest = {
      name: form.name.trim(),
      symbol: form.symbol.trim(),
      code: form.code.trim(),
      unitType: form.unitType,
    };

    try {
      setLoading(true);

      if (isEditMode && id) {
        await updateUnit(
          Number(id),
          {
            ...requestData,
            code:
              requestData.code ||
              requestData.name,
          },
        );
      } else {
        await createUnit(requestData);
      }

      navigate("/admin/units", {
        replace: true,
      });
    } catch (requestError) {
      const axiosError =
        requestError as AxiosError<
          ApiErrorResponse | string
        >;

      const responseData =
        axiosError.response?.data;

      let message =
        "Impossible d'enregistrer l'unité.";

      if (
        typeof responseData === "string" &&
        responseData.trim()
      ) {
        message = responseData;
      } else if (
        typeof responseData === "object" &&
        responseData !== null
      ) {
        message =
          responseData.message ??
          responseData.error ??
          message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <section className="admin-page">
        <div className="resource-loading">
          Chargement du formulaire...
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page resource-form-page">
      <button
        type="button"
        className="resource-back-button"
        onClick={() =>
          navigate("/admin/units")
        }
      >
        <ArrowLeft size={18} />
        Retour aux unités
      </button>

      <div className="resource-form-heading">
        <div className="resource-form-heading-icon">
          <Settings2 size={25} />
        </div>

        <div>
          <span className="admin-page-eyebrow">
            Unités
          </span>

          <h1>
            {isEditMode
              ? "Modifier l'unité"
              : "Créer une unité"}
          </h1>

          <p>
            Renseignez les informations de l'unité.
          </p>
        </div>
      </div>

      {error && (
        <div className="resource-error-message">
          {error}
        </div>
      )}

      <form
        className="resource-form-card"
        onSubmit={handleSubmit}
      >
        <div className="resource-form-grid">
          <div className="resource-form-group">
            <label htmlFor="unit-name">
              Nom *
            </label>

            <input
              id="unit-name"
              type="text"
              placeholder="Exemple : Bars"
              value={form.name}
              onChange={(event) =>
                updateField(
                  "name",
                  event.target.value,
                )
              }
              disabled={loading}
              required
            />
          </div>

          <div className="resource-form-group">
            <label htmlFor="unit-symbol">
              Symbole *
            </label>

            <input
              id="unit-symbol"
              type="text"
              placeholder="Exemple : bar"
              value={form.symbol}
              onChange={(event) =>
                updateField(
                  "symbol",
                  event.target.value,
                )
              }
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="resource-form-group">
          <label htmlFor="unit-code">
            Code
          </label>

          <input
            id="unit-code"
            type="text"
            placeholder="Généré automatiquement si vide"
            value={form.code}
            onChange={(event) =>
              updateField(
                "code",
                event.target.value,
              )
            }
            disabled={loading}
          />
        </div>

        <div className="resource-form-group">
          <label>Type *</label>

          <div className="resource-type-options">
            <button
              type="button"
              className={`resource-type-option ${
                form.unitType === "NUMBER"
                  ? "resource-type-option-active"
                  : ""
              }`}
              onClick={() =>
                updateField(
                  "unitType",
                  "NUMBER",
                )
              }
            >
              <strong>Nombre</strong>
              <span>
                Pour les valeurs numériques.
              </span>
            </button>

            <button
              type="button"
              className={`resource-type-option ${
                form.unitType === "TEXT"
                  ? "resource-type-option-active"
                  : ""
              }`}
              onClick={() =>
                updateField(
                  "unitType",
                  "TEXT",
                )
              }
            >
              <strong>Texte</strong>
              <span>
                Pour les commentaires et textes.
              </span>
            </button>
          </div>
        </div>

        <div className="resource-form-actions">
          <button
            type="button"
            className="resource-cancel-button"
            onClick={() =>
              navigate("/admin/units")
            }
            disabled={loading}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="resource-primary-button"
            disabled={loading}
          >
            <Save size={19} />

            {loading
              ? "Enregistrement..."
              : isEditMode
                ? "Enregistrer les modifications"
                : "Créer l'unité"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default UnitFormPage;