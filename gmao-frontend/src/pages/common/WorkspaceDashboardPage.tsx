import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  PlusCircle,
  Timer,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getAssignedToMeActivities, getMyActivities } from "../../services/activityService";
import { getAuthenticatedUserId } from "../../services/authService";
import { getMyMaintenancePlans, getAssignedToMeMaintenancePlans } from "../../services/maintenancePlanService";
import {
  getAssignedToMeTasks,
  getMyCreatedTasks,
  getTasks,
} from "../../services/taskService";
import type { Activity as ActivityItem } from "../../types/activity";
import type { MaintenancePlan } from "../../types/maintenancePlan";
import type { TaskListItem, TaskStatus } from "../../types/task";

import "../admin/task-styles.css";
import "../admin/DashboardPage.css";

type WorkspaceDashboardRole = "operator" | "technician" | "provider";

interface WorkspaceDashboardPageProps {
  role: WorkspaceDashboardRole;
}

const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  PLANNED: { label: "Planifiee", color: "#ffb020" },
  IN_PROGRESS: { label: "En cours", color: "#4da6ff" },
  LATE: { label: "En retard", color: "#ff6b6b" },
  DONE: { label: "Terminee", color: "#34d1b3" },
};

function activitySpentMinutes(activity: ActivityItem): number {
  return activity.spentHours * 60 + activity.spentMinutes;
}

function formatHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isAssignedToCurrentUser(task: TaskListItem, userId: number | null): boolean {
  if (!userId) {
    return false;
  }

  return [...(task.assignees ?? []), ...(task.assignedTo ?? [])].some(
    (assignee) => assignee.userId === userId,
  );
}

function statusCount(tasks: TaskListItem[], status: TaskStatus): number {
  return tasks.filter((task) => task.status === status).length;
}

function DashboardStatusList({ tasks }: { tasks: TaskListItem[] }) {
  const total = tasks.length || 1;
  const statuses: TaskStatus[] = ["PLANNED", "IN_PROGRESS", "LATE", "DONE"];

  return (
    <div className="dashboard-bar-chart">
      {statuses.map((status) => {
        const value = statusCount(tasks, status);
        const width = Math.round((value / total) * 100);
        const meta = TASK_STATUS_META[status];

        return (
          <div className="dashboard-bar-row" key={status}>
            <span className="dashboard-bar-label">{meta.label}</span>
            <div className="dashboard-bar-track">
              <div
                className="dashboard-bar-fill"
                style={{ width: `${width}%`, background: meta.color }}
              />
            </div>
            <span className="dashboard-bar-value">{value}</span>
          </div>
        );
      })}
    </div>
  );
}

function RecentTasksTable({
  tasks,
  basePath,
}: {
  tasks: TaskListItem[];
  basePath: string;
}) {
  const recentTasks = tasks.slice(0, 5);

  if (recentTasks.length === 0) {
    return <p className="dashboard-empty-hint">Aucune tache disponible.</p>;
  }

  return (
    <div className="dashboard-top-tasks-wrapper">
      <table className="dashboard-top-tasks-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tache</th>
            <th>Equipement</th>
            <th>Date</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {recentTasks.map((task) => (
            <tr key={task.id}>
              <td>
                <Link to={`${basePath}/tasks/${task.id}`} className="dashboard-task-id">
                  #{task.id}
                </Link>
              </td>
              <td>
                <span className="dashboard-task-description">{task.description}</span>
              </td>
              <td>{task.equipment?.name ?? "-"}</td>
              <td>{formatDate(task.startDate)}</td>
              <td>
                <span
                  className="dashboard-task-color"
                  style={{ background: TASK_STATUS_META[task.status].color }}
                />
                {TASK_STATUS_META[task.status].label}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkspaceDashboardPage({ role }: WorkspaceDashboardPageProps) {
  const currentUserId = getAuthenticatedUserId();
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isTechnician = role === "technician";
  const isProvider = role === "provider";
  const basePath = isTechnician ? "/technician" : isProvider ? "/provider" : "/operator";

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        setError("");

        if (isTechnician) {
          const [taskList, activityList, planList] = await Promise.all([
            getTasks(),
            getMyActivities().catch(() => [] as ActivityItem[]),
            getMyMaintenancePlans().catch(() => [] as MaintenancePlan[]),
          ]);

          setTasks(
            taskList.filter((task) => isAssignedToCurrentUser(task, currentUserId)),
          );
          setActivities(activityList);
          setPlans(planList);
          return;
        }

        if (isProvider) {
          const [taskList, activityList, planList] = await Promise.all([
            getAssignedToMeTasks(),
            getAssignedToMeActivities().catch(() => [] as ActivityItem[]),
            getAssignedToMeMaintenancePlans().catch(() => [] as MaintenancePlan[]),
          ]);
          setTasks(taskList);
          setActivities(activityList);
          setPlans(planList);
          return;
        }

        const taskList = await getMyCreatedTasks();
        setTasks(taskList);
        setActivities([]);
        setPlans([]);
      } catch (requestError) {
        console.error(requestError);
        setError("Impossible de charger les donnees du dashboard.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [currentUserId, isTechnician, isProvider]);

  const metrics = useMemo(() => {
    const totalSpentMinutes = activities.reduce(
      (sum, activity) => sum + activitySpentMinutes(activity),
      0,
    );

    return {
      totalTasks: tasks.length,
      plannedTasks: statusCount(tasks, "PLANNED"),
      inProgressTasks: statusCount(tasks, "IN_PROGRESS"),
      lateTasks: statusCount(tasks, "LATE"),
      doneTasks: statusCount(tasks, "DONE"),
      totalActivities: activities.length,
      doneActivities: activities.filter((activity) => activity.status === "DONE").length,
      totalSpentMinutes,
      totalPlans: plans.length,
      plannedPlans: plans.filter((plan) => plan.status === "PLANNED").length,
    };
  }, [activities, plans, tasks]);

  const heroCards = isTechnician
    ? [
        {
          title: "Taches affectees",
          value: metrics.totalTasks,
          icon: <ClipboardList size={32} />,
          className: "dashboard-hero-card-tasks",
        },
        {
          title: "Activites realisees",
          value: metrics.totalActivities,
          icon: <Activity size={32} />,
          className: "dashboard-hero-card-activities",
        },
        {
          title: "Temps passe",
          value: formatHoursMinutes(metrics.totalSpentMinutes),
          icon: <Timer size={32} />,
          className: "dashboard-hero-card-time",
        },
        {
          title: "Plans affectes",
          value: metrics.totalPlans,
          icon: <CalendarCheck size={32} />,
          className: "dashboard-hero-card-avg",
        },
      ]
    : [
        {
          title: isProvider ? "Taches affectees" : "Mes taches",
          value: metrics.totalTasks,
          icon: <ClipboardList size={32} />,
          className: "dashboard-hero-card-tasks",
        },
        {
          title: "Planifiees",
          value: metrics.plannedTasks,
          icon: <CalendarCheck size={32} />,
          className: "dashboard-hero-card-activities",
        },
        {
          title: "En cours",
          value: metrics.inProgressTasks,
          icon: <Clock size={32} />,
          className: "dashboard-hero-card-time",
        },
        {
          title: "Terminees",
          value: metrics.doneTasks,
          icon: <CheckCircle2 size={32} />,
          className: "dashboard-hero-card-avg",
        },
      ];

  return (
    <section className="admin-dashboard">
      <div className="admin-page-heading">
        <span>TABLEAU DE BORD</span>
        <h1>
          {isTechnician
            ? "Bienvenue dans votre espace technicien"
            : isProvider
              ? "Bienvenue dans votre espace prestataire"
              : "Bienvenue dans votre espace operateur"}
        </h1>
        <p>
          {isTechnician
            ? "Suivez vos taches affectees, vos activites realisees et vos plans de maintenance."
            : isProvider
              ? "Suivez les interventions qui vous sont affectees, quelle que soit l'usine concernee."
              : "Suivez les taches que vous avez declarees et leur avancement par la maintenance."}
        </p>
      </div>

      {error && <div className="admin-form-error">{error}</div>}

      <div className="dashboard-hero-kpis">
        {heroCards.map((card) => (
          <article className={`dashboard-hero-card ${card.className}`} key={card.title}>
            <div className="dashboard-hero-card-body">
              <span>{card.title}</span>
              <strong>{loading ? "-" : card.value}</strong>
            </div>
            <div className="dashboard-hero-card-icon">{card.icon}</div>
          </article>
        ))}
      </div>

      <div className="dashboard-resource-strip">
        <Link to={`${basePath}/tasks`} className="dashboard-resource-card">
          <div className="dashboard-resource-icon">
            <ClipboardList size={26} />
          </div>
          <div>
            <span>{isTechnician || isProvider ? "Taches affectees" : "Mes taches"}</span>
            <strong>{metrics.totalTasks}</strong>
          </div>
        </Link>

        {isTechnician ? (
          <>
            <Link to="/technician/activities" className="dashboard-resource-card">
              <div className="dashboard-resource-icon">
                <Activity size={26} />
              </div>
              <div>
                <span>Activites</span>
                <strong>{metrics.totalActivities}</strong>
              </div>
            </Link>

            <Link to="/technician/maintenance-plans" className="dashboard-resource-card">
              <div className="dashboard-resource-icon">
                <CalendarCheck size={26} />
              </div>
              <div>
                <span>Plans de maintenance</span>
                <strong>{metrics.totalPlans}</strong>
              </div>
            </Link>
          </>
        ) : isProvider ? (
          <>
            <Link to="/provider/activities" className="dashboard-resource-card">
              <div className="dashboard-resource-icon">
                <Activity size={26} />
              </div>
              <div>
                <span>Activites</span>
                <strong>{metrics.totalActivities}</strong>
              </div>
            </Link>

            <Link to="/provider/maintenance-plans" className="dashboard-resource-card">
              <div className="dashboard-resource-icon">
                <CalendarCheck size={26} />
              </div>
              <div>
                <span>Plans de maintenance</span>
                <strong>{metrics.totalPlans}</strong>
              </div>
            </Link>
          </>
        ) : (
          <Link to="/operator/tasks/new" className="dashboard-resource-card">
            <div className="dashboard-resource-icon">
              <PlusCircle size={26} />
            </div>
            <div>
              <span>Creer une tache</span>
              <strong>+</strong>
            </div>
          </Link>
        )}

        <article className="dashboard-resource-card">
          <div className="dashboard-resource-icon">
            <Wrench size={26} />
          </div>
          <div>
            <span>{isTechnician ? "Plans planifies" : "En retard"}</span>
            <strong>{isTechnician ? metrics.plannedPlans : metrics.lateTasks}</strong>
          </div>
        </article>
      </div>

      <div className="dashboard-charts-grid">
        <article className="dashboard-chart-card">
          <div className="dashboard-chart-card-header">
            <h2>
              <TrendingUp size={22} />
              Repartition des statuts
            </h2>
          </div>
          <DashboardStatusList tasks={tasks} />
        </article>

        <article className="dashboard-chart-card dashboard-chart-card-wide">
          <div className="dashboard-chart-card-header">
            <h2>
              <ClipboardList size={22} />
              Dernieres taches
            </h2>
            <Link to={`${basePath}/tasks`} className="dashboard-chart-link">
              Voir tout
            </Link>
          </div>
          <RecentTasksTable tasks={tasks} basePath={basePath} />
        </article>
      </div>
    </section>
  );
}

export default WorkspaceDashboardPage;
