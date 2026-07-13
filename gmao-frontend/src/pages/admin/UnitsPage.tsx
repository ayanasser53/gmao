import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { AxiosError } from "axios";

import {
  ArrowLeft,
  CirclePlus,
  Pencil,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  deleteUnit,
  getUnits,
} from "../../services/unitService";

import type { ApiErrorResponse } from "../../types/auth";

import type {
  MeasurementUnit,
} from "../../types/unit";

function UnitsPage() {
  const navigate = useNavigate();

  const [units, setUnits] =
    useState<MeasurementUnit[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadUnits(): Promise<void> {
      try {
        setLoading(true);

        const data = await getUnits();

        setUnits(data);
      } catch (requestError) {
        console.error(
          "Erreur chargement unités :",
          requestError,
        );

        setError(
          "Impossible de charger les unités.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadUnits();
  }, []);

  const filteredUnits = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return units;
    }

    return units.filter((unit) => {
      return (
        unit.name.toLowerCase().includes(value) ||
        unit.symbol.toLowerCase().includes(value) ||
        unit.code.toLowerCase().includes(value)
      );
    });
  }, [search, units]);

  async function handleDelete(
    unit: MeasurementUnit,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer l'unité "${unit.name}" ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(unit.id);
      setError("");
      setSuccess("");

      await deleteUnit(unit.id);

      setUnits((previousUnits) =>
        previousUnits.filter(
          (item) => item.id !== unit.id,
        ),
      );

      setSuccess(
        "L'unité a été supprimée avec succès.",
      );
    } catch (requestError) {
      const axiosError =
        requestError as AxiosError<
          ApiErrorResponse | string
        >;

      const responseData =
        axiosError.response?.data;

      let message =
        "Impossible de supprimer l'unité.";

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
      setDeletingId(null);
    }
  }

  return (
    <section className="admin-page units-page">
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

      <div className="resource-page-header">
        <div>
          <span className="admin-page-eyebrow">
            Paramètres des mesures
          </span>

          <h1>Unités</h1>

          <p>
            Gérez les unités disponibles pour les mesures.
          </p>
        </div>

        <button
          type="button"
          className="resource-primary-button"
          onClick={() =>
            navigate("/admin/units/create")
          }
        >
          <CirclePlus size={20} />
          Créer une unité
        </button>
      </div>

      {error && (
        <div className="resource-error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="resource-success-message">
          {success}
        </div>
      )}

      <div className="resource-toolbar">
        <div className="resource-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Rechercher une unité..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="resource-counter">
          <Settings2 size={18} />

          <span>
            {filteredUnits.length} unité
            {filteredUnits.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="resource-loading">
          Chargement des unités...
        </div>
      ) : (
        <div className="resource-table-container">
          <table className="resource-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Symbole</th>
                <th>Type</th>
                <th className="resource-actions-column">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUnits.map((unit) => (
                <tr key={unit.id}>
                  <td>
                    <span className="resource-code">
                      {unit.code}
                    </span>
                  </td>

                  <td>
                    <strong className="resource-name">
                      {unit.name}
                    </strong>
                  </td>

                  <td>
                    <span className="resource-unit-symbol">
                      {unit.symbol}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`resource-type-badge ${
                        unit.unitType === "NUMBER"
                          ? "resource-type-number"
                          : "resource-type-text"
                      }`}
                    >
                      {unit.unitType === "NUMBER"
                        ? "Nombre"
                        : "Texte"}
                    </span>
                  </td>

                  <td>
                    <div className="resource-row-actions">
                      <button
                        type="button"
                        className="resource-edit-button"
                        onClick={() =>
                          navigate(
                            `/admin/units/${unit.id}/edit`,
                          )
                        }
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        className="resource-delete-button"
                        disabled={
                          deletingId === unit.id
                        }
                        onClick={() =>
                          void handleDelete(unit)
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUnits.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="resource-table-empty"
                  >
                    Aucune unité trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default UnitsPage;