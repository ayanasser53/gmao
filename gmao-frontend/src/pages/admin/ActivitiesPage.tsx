import {
  Download,
  ListChecks,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getActivities,
} from "../../services/activityService";
import type { Activity } from "../../types/activity";
import { exportTableCsv, exportTablePdf } from "../../utils/exportFiles";

function formatSpentTime(activity: Activity) {
  return `${activity.spentHours}h ${activity.spentMinutes}min`;
}

function ActivitiesPage() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadActivities() {
      try {
        setError("");

        const activitiesData = await getActivities();
        setActivities(activitiesData);
      } catch {
        setError("Impossible de charger les activites.");
      }
    }

    void loadActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return activities;
    }

    return activities.filter((activity) => {
      return (
        activity.description.toLowerCase().includes(value) ||
        activity.taskDescription.toLowerCase().includes(value) ||
        activity.equipmentName?.toLowerCase().includes(value)
      );
    });
  }, [activities, search]);

  function getExportOptions() {
    return {
      title: "Liste des activites",
      fileName: "activites",
      headers: [
        "Equipement",
        "Tache",
        "Activite",
        "Date",
        "Heure fin",
        "Temps passe",
      ],
      rows: filteredActivities.map((activity) => [
        activity.equipmentName || "-",
        activity.taskDescription,
        activity.description,
        activity.performedDate,
        activity.performedEndTime,
        formatSpentTime(activity),
      ]),
    };
  }

  function exportCsv() {
    exportTableCsv(getExportOptions());
  }

  function exportPdf() {
    exportTablePdf(getExportOptions());
  }

  function openTaskDetails(activity: Activity) {
    if (!Number.isFinite(activity.taskId)) {
      setError("Impossible d'ouvrir la tâche liée à cette activité.");
      return;
    }

    navigate(`/admin/tasks/${activity.taskId}?from=activities`);
  }

  return (
    <section className="suppliers-workspace">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <ListChecks size={28} />
            <h1>Activites</h1>
          </div>
        </div>

        <div className="resource-header-actions">
          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportPdf}
            disabled={filteredActivities.length === 0}
          >
            <Download size={16} />
            PDF
          </button>

          <button
            type="button"
            className="resource-secondary-button"
            onClick={exportCsv}
            disabled={filteredActivities.length === 0}
          >
            <Download size={16} />
            CSV
          </button>

          <Link
            to="/admin/activities/create"
            className="supplier-primary-button"
          >
            <Plus size={18} />
            Ajouter une activite
          </Link>
        </div>
      </div>

      {error && (
        <div className="supplier-error-message">
          {error}
        </div>
      )}

      <div className="supplier-search-bar">
        <Search size={19} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher une activite..."
        />
      </div>

      <div className="supplier-table-wrapper">
        <table className="supplier-table">
          <thead>
            <tr>
              <th>Equipement</th>
              <th>Tache</th>
              <th>Activite</th>
              <th>Date</th>
              <th>Heure fin</th>
              <th>Temps passe</th>
            </tr>
          </thead>

          <tbody>
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={6} className="supplier-empty-row">
                  Aucun resultat
                </td>
              </tr>
            ) : (
              filteredActivities.map((activity) => (
                <tr
                  key={activity.id}
                  className="supplier-clickable-row"
                  tabIndex={0}
                  onClick={() => openTaskDetails(activity)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      openTaskDetails(activity);
                    }
                  }}
                >
                  <td>{activity.equipmentName || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="activity-task-link"
                      onClick={(event) => {
                        event.stopPropagation();
                        openTaskDetails(activity);
                      }}
                    >
                      {activity.taskDescription}
                    </button>
                  </td>
                  <td>{activity.description}</td>
                  <td>{activity.performedDate}</td>
                  <td>{activity.performedEndTime}</td>
                  <td>{formatSpentTime(activity)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ActivitiesPage;
