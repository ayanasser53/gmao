import {
  Clock,
  History,
  ListChecks,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  getActivityHistory,
  getInProgressActivities,
  getLateActivities,
} from "../../services/activityService";
import type { Activity } from "../../types/activity";

type ActivityTab = "IN_PROGRESS" | "LATE" | "HISTORY";

function formatSpentTime(activity: Activity) {
  return `${activity.spentHours}h ${activity.spentMinutes}min`;
}

function ActivitiesPage() {
  const [activeTab, setActiveTab] =
    useState<ActivityTab>("IN_PROGRESS");

  const [inProgress, setInProgress] = useState<Activity[]>([]);
  const [late, setLate] = useState<Activity[]>([]);
  const [history, setHistory] = useState<Activity[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadActivities() {
      try {
        setError("");

        const [
          inProgressData,
          lateData,
          historyData,
        ] = await Promise.all([
          getInProgressActivities(),
          getLateActivities(),
          getActivityHistory(),
        ]);

        setInProgress(inProgressData);
        setLate(lateData);
        setHistory(historyData);
      } catch {
        setError("Impossible de charger les activités.");
      }
    }

    loadActivities();
  }, []);

  const activities =
    activeTab === "IN_PROGRESS"
      ? inProgress
      : activeTab === "LATE"
        ? late
        : history;

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
    <section className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-page-eyebrow">
            Gestion des interventions
          </span>

          <h1>
            <ListChecks size={36} />
            Activités
          </h1>
        </div>

        <Link
          to="/admin/activities/create"
          className="equipment-primary-button"
        >
          <Plus size={18} />
          Ajouter une activité
        </Link>
      </div>

      {error && (
        <div className="form-error-message">
          {error}
        </div>
      )}

      <div className="admin-tabs">
        <button
          type="button"
          className={activeTab === "IN_PROGRESS" ? "active" : ""}
          onClick={() => setActiveTab("IN_PROGRESS")}
        >
          <Clock size={18} />
          En cours
          <span>{inProgress.length}</span>
        </button>

        <button
          type="button"
          className={activeTab === "LATE" ? "active" : ""}
          onClick={() => setActiveTab("LATE")}
        >
          <Clock size={18} />
          En retard
          <span>{late.length}</span>
        </button>

        <button
          type="button"
          className={activeTab === "HISTORY" ? "active" : ""}
          onClick={() => setActiveTab("HISTORY")}
        >
          <History size={18} />
          Historique
          <span>{history.length}</span>
        </button>
      </div>

      <div className="admin-search">
        <Search size={19} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher une activité..."
        />
      </div>

      <div className="admin-table-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Equipement</th>
              <th>Tâche</th>
              <th>Activité</th>
              <th>Date</th>
              <th>Heure fin</th>
              <th>Temps passé</th>
              <th>Statut</th>
            </tr>
          </thead>

          <tbody>
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty-cell">
                  Aucun résultat
                </td>
              </tr>
            ) : (
              filteredActivities.map((activity) => (
                <tr key={activity.id}>
                  <td>{activity.equipmentName || "-"}</td>
                  <td>{activity.taskDescription}</td>
                  <td>{activity.description}</td>
                  <td>{activity.performedDate}</td>
                  <td>{activity.performedEndTime}</td>
                  <td>{formatSpentTime(activity)}</td>
                  <td>
                    <span className={`status-pill ${activity.status.toLowerCase()}`}>
                      {activity.status === "DONE"
                        ? "Terminée"
                        : activity.status === "LATE"
                          ? "En retard"
                          : "En cours"}
                    </span>
                  </td>
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
