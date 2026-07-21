import {
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

  return (
    <section className="suppliers-workspace">
      <div className="suppliers-page-heading">
        <div className="suppliers-heading-content">
          <div className="suppliers-title">
            <ListChecks size={28} />
            <h1>Activites</h1>
          </div>
        </div>

        <Link
          to="/admin/activities/create"
          className="supplier-primary-button"
        >
          <Plus size={18} />
          Ajouter une activite
        </Link>
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
                  onClick={() => navigate(`/admin/tasks/${activity.taskId}`)}
                >
                  <td>{activity.equipmentName || "-"}</td>
                  <td>{activity.taskDescription}</td>
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
