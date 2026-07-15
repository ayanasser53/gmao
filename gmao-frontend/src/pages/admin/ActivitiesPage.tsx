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
        setError("Impossible de charger les activites.");
      }
    }

    void loadActivities();
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

      <div className="activity-status-cards">
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
              <th>Statut</th>
            </tr>
          </thead>

          <tbody>
            {filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={7} className="supplier-empty-row">
                  Aucun resultat
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
                        ? "Terminee"
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
