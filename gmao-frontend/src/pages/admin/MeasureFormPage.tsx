import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import { AxiosError } from "axios";

import {
  ArrowLeft,
  Ruler,
  Save,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createMeasure,
  getMeasureById,
  updateMeasure,
} from "../../services/measureService";

import { getUnits } from "../../services/unitService";

import type { ApiErrorResponse } from "../../types/auth";

import type {
  CreateMeasureRequest,
} from "../../types/measure";

import type {
  MeasurementUnit,
} from "../../types/unit";

function MeasureFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditMode = Boolean(id);

  const [form, setForm] =
    useState<CreateMeasureRequest>({
      name: "",
      code: "",
      description: "",
      unitId: 0,
    });

  const [units, setUnits] =
    useState<MeasurementUnit[]>([]);

  const [loading, setLoading] =
    useState<boolean>(false);

  const [pageLoading, setPageLoading] =
    useState<boolean>(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData(): Promise<void> {
      try {
        setPageLoading(true);

        const unitsData = await getUnits();

        setUnits(unitsData);

        if (isEditMode && id) {
          const measure =
            await getMeasureById(Number(id));

          setForm({
            name: measure.name,
            code: measure.code,
            description:
              measure.description ?? "",
            unitId: measure.unitId,
          });
        } else if (unitsData.length > 0) {
          setForm((previousForm) => ({
            ...previousForm,
            unitId: unitsData[0].id,
          }));
        }
      } catch (requestError) {
        console.error(
          "Erreur chargement formulaire :",
          requestError,
        );

        setError(
          "Impossible de charger les informations du formulaire.",
        );
      } finally {
        setPageLoading(false);
      }
    }

    void loadData();
  }, [id, isEditMode]);

  function updateField(
    field: keyof CreateMeasureRequest,
    value: string | number,
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
        "Le nom de la mesure est obligatoire.",
      );
      return;
    }

    if (!form.unitId) {
      setError(
        "Veuillez sélectionner une unité.",
      );
      return;
    }

    const requestData: CreateMeasureRequest = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      unitId: form.unitId,
    };

    try {
      setLoading(true);

      if (isEditMode && id) {
        await updateMeasure(
          Number(id),
          requestData,
        );
      } else {
        await createMeasure(requestData);
      }

      navigate("/admin/measures", {
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
        "Impossible d'enregistrer la mesure.";

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
          navigate("/admin/measures")
        }
      >
        <ArrowLeft size={18} />
        Retour aux mesures
      </button>

      <div className="resource-form-heading">
        <div className="resource-form-heading-icon">
          <Ruler size={25} />
        </div>

        <div>
          <span className="admin-page-eyebrow">
            Mesures
          </span>

          <h1>
            {isEditMode
              ? "Modifier la mesure"
              : "Créer une mesure"}
          </h1>

          <p>
            Renseignez les informations de la mesure.
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
        <div className="resource-form-group">
          <label htmlFor="measure-name">
            Nom de la mesure *
          </label>

          <input
            id="measure-name"
            type="text"
            placeholder="Exemple : Pression hydraulique"
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
          <label htmlFor="measure-code">
            Code
          </label>

          <input
            id="measure-code"
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

          <small>
            Exemple : pression_hydraulique
          </small>
        </div>

        <div className="resource-form-group">
          <label htmlFor="measure-description">
            Description
          </label>

          <textarea
            id="measure-description"
            rows={5}
            placeholder="Description de la mesure..."
            value={form.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value,
              )
            }
            disabled={loading}
          />
        </div>

        <div className="resource-form-group">
          <label htmlFor="measure-unit">
            Unité *
          </label>

          <select
            id="measure-unit"
            value={form.unitId}
            onChange={(event) =>
              updateField(
                "unitId",
                Number(event.target.value),
              )
            }
            disabled={loading}
            required
          >
            <option value={0}>
              Sélectionner une unité
            </option>

            {units.map((unit) => (
              <option
                key={unit.id}
                value={unit.id}
              >
                {unit.name} ({unit.symbol}) —{" "}
                {unit.unitType === "NUMBER"
                  ? "Nombre"
                  : "Texte"}
              </option>
            ))}
          </select>

          {units.length === 0 && (
            <small className="resource-warning-text">
              Vous devez d’abord créer une unité.
            </small>
          )}
        </div>

        <div className="resource-form-actions">
          <button
            type="button"
            className="resource-cancel-button"
            onClick={() =>
              navigate("/admin/measures")
            }
            disabled={loading}
          >
            Annuler
          </button>

          <button
            type="submit"
            className="resource-primary-button"
            disabled={
              loading || units.length === 0
            }
          >
            <Save size={19} />

            {loading
              ? "Enregistrement..."
              : isEditMode
                ? "Enregistrer les modifications"
                : "Créer la mesure"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default MeasureFormPage;