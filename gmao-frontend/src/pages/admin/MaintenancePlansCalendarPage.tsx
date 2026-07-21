import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
} from "lucide-react";
import type { MaintenancePlan } from "../../types/maintenancePlan";
import { getMaintenancePlans } from "../../services/maintenancePlanService";

import "./task-styles.css";

type DisplayStatus = "planned" | "in_progress" | "late" | "done";
type AgendaView = "month" | "week" | "day";

const STATUS_TABS = [
  {
    status: "planned",
    label: "Planifié",
    icon: CalendarClock,
  },
  {
    status: "in_progress",
    label: "En cours",
    icon: Clock,
  },
  {
    status: "late",
    label: "En retard",
    icon: Clock,
  },
  {
    status: "done",
    label: "Terminé",
    icon: History,
  },
] as const;

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getDateKey(value?: string | null) {
  return value ? value.slice(0, 10) : null;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`);
}

function getTodayKey() {
  return toDateKey(new Date());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function startOfWeek(date: Date) {
  const day = date.getDay() === 0 ? 7 : date.getDay();
  return addDays(date, 1 - day);
}

function getMonthDays(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthGridStart = startOfWeek(firstDay);
  return Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index));
}

function getWeekDays(date: Date) {
  const weekStart = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function formatAgendaTitle(date: Date, view: AgendaView) {
  if (view === "day") {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  if (view === "week") {
    const weekStart = startOfWeek(date);
    const weekEnd = addDays(weekStart, 6);
    return `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getPlanDateKey(plan: MaintenancePlan) {
  return getDateKey(plan.nextDueDate) ?? getDateKey(plan.startDate);
}

function getDisplayStatus(plan: MaintenancePlan): DisplayStatus {
  if (plan.status === "DONE") return "done";
  if (plan.status === "LATE") return "late";
  if (plan.status === "IN_PROGRESS") return "in_progress";

  const referenceDate = getPlanDateKey(plan);

  if (referenceDate && referenceDate < getTodayKey()) return "late";

  return "planned";
}

function getStatusLabel(status: DisplayStatus) {
  if (status === "done") return "Terminé";
  if (status === "late") return "En retard";
  if (status === "planned") return "Planifié";
  return "En cours";
}

export default function MaintenancePlansCalendarPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [error, setError] = useState("");
  const [agendaDate, setAgendaDate] = useState(() => parseDateKey(getTodayKey()));
  const [agendaView, setAgendaView] = useState<AgendaView>("month");

  useEffect(() => {
    async function loadPlans() {
      try {
        setError("");
        const data = await getMaintenancePlans();
        setPlans(data);
      } catch {
        setError("Impossible de charger le calendrier des plans.");
      }
    }

    void loadPlans();
  }, []);

  const plansByDate = useMemo(() => {
    return plans.reduce(
      (groups, plan) => {
        const dateKey = getPlanDateKey(plan);

        if (!dateKey) {
          return groups;
        }

        return {
          ...groups,
          [dateKey]: [...(groups[dateKey] ?? []), plan],
        };
      },
      {} as Record<string, MaintenancePlan[]>,
    );
  }, [plans]);

  const visibleAgendaDays =
    agendaView === "month"
      ? getMonthDays(agendaDate)
      : agendaView === "week"
        ? getWeekDays(agendaDate)
        : [agendaDate];

  function navigateAgenda(direction: -1 | 1) {
    setAgendaDate((current) => {
      if (agendaView === "month") return addMonths(current, direction);
      if (agendaView === "week") return addDays(current, direction * 7);
      return addDays(current, direction);
    });
  }

  function renderPlanChip(plan: MaintenancePlan) {
    const status = getDisplayStatus(plan);

    return (
      <button
        type="button"
        key={plan.id}
        className={`maintenance-agenda-plan ${status}`}
        onClick={() => navigate(`/admin/maintenance-plans/${plan.id}`)}
        title={plan.description}
      >
        <strong>{getStatusLabel(status)}</strong>
        <span>{plan.description}</span>
      </button>
    );
  }

  return (
    <section className="admin-page maintenance-page">
      <div className="details-topbar">
        <button
          type="button"
          className="details-back-button"
          onClick={() => navigate("/admin/maintenance-plans")}
          aria-label="Retour aux plans"
        >
          <ArrowLeft size={22} />
        </button>

        <div>
          <div className="details-eyebrow">Plans de maintenance</div>
          <div className="details-title-row">
            <CalendarClock size={30} />
            <h1>Calendrier</h1>
          </div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="resource-toolbar maintenance-calendar-toolbar">
        <div className="maintenance-agenda-controls">
          <button
            type="button"
            className="maintenance-agenda-nav"
            onClick={() => navigateAgenda(-1)}
            aria-label="Période précédente"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            className="maintenance-agenda-today"
            onClick={() => setAgendaDate(parseDateKey(getTodayKey()))}
          >
            Aujourd'hui
          </button>

          <button
            type="button"
            className="maintenance-agenda-nav"
            onClick={() => navigateAgenda(1)}
            aria-label="Période suivante"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="maintenance-agenda-view-switch" aria-label="Vue agenda">
          <button
            type="button"
            className={agendaView === "month" ? "active" : ""}
            onClick={() => setAgendaView("month")}
          >
            Mois
          </button>
          <button
            type="button"
            className={agendaView === "week" ? "active" : ""}
            onClick={() => setAgendaView("week")}
          >
            Semaine
          </button>
          <button
            type="button"
            className={agendaView === "day" ? "active" : ""}
            onClick={() => setAgendaView("day")}
          >
            Jour
          </button>
        </div>
      </div>

      <section className="maintenance-agenda-card">
        <div className="maintenance-agenda-header">
          <h2>{formatAgendaTitle(agendaDate, agendaView)}</h2>

          <div className="maintenance-agenda-legend">
            {STATUS_TABS.map((tab) => (
              <span key={tab.status} className={`maintenance-agenda-dot ${tab.status}`}>
                {tab.label}
              </span>
            ))}
          </div>
        </div>

        <div className={`maintenance-agenda-grid maintenance-agenda-${agendaView}`}>
          {agendaView !== "day" &&
            ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].map((day) => (
              <div key={day} className="maintenance-agenda-weekday">
                {day}
              </div>
            ))}

          {visibleAgendaDays.map((date) => {
            const dateKey = toDateKey(date);
            const dayPlans = plansByDate[dateKey] ?? [];
            const isOutsideMonth =
              agendaView === "month" && date.getMonth() !== agendaDate.getMonth();

            return (
              <div
                key={dateKey}
                className={[
                  "maintenance-agenda-day",
                  dateKey === getTodayKey() ? "today" : "",
                  isOutsideMonth ? "outside" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  setAgendaDate(date);
                  if (agendaView === "month") setAgendaView("day");
                }}
              >
                <span className="maintenance-agenda-day-number">
                  {date.getDate()}
                </span>

                <div className="maintenance-agenda-plan-list">
                  {dayPlans.length > 0 ? (
                    dayPlans.map(renderPlanChip)
                  ) : (
                    agendaView === "day" && (
                      <span className="maintenance-agenda-empty">
                        Aucun plan prévu.
                      </span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
