import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity as ActivityIcon,
  AlertTriangle,
  Boxes,
  CalendarCheck,
  Clock,
  Gauge,
  MapPin,
  PackageSearch,
  PiggyBank,
  Printer,
  ChevronDown,
  ShoppingCart,
  Tag as TagIcon,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";

import {
  getAuthenticatedEmail,
  getAuthenticatedRole,
} from "../../services/authService";

import { getEquipment } from "../../services/equipmentService";
import { getTasks } from "../../services/taskService";
import { getActivities } from "../../services/activityService";
import { getSpareParts } from "../../services/sparePartService";
import { getTeams } from "../../services/teamService";
import { getMaintenancePlans } from "../../services/maintenancePlanService";
import { getPurchaseOrders } from "../../services/purchaseOrderService";

import type { TaskListItem, TaskStatus } from "../../types/task";
import type { Activity } from "../../types/activity";
import type { SparePart } from "../../types/sparePart";
import type { Equipment } from "../../types/equipment";
import type {
  MaintenancePlan,
  MaintenancePlanStatus,
} from "../../types/maintenancePlan";

import "./task-styles.css";
import "./DashboardPage.css";

const BACKEND_URL = "http://localhost:8090";

interface DashboardCard {
  title: string;
  value: number;
  icon: ReactNode;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  CREATED: { label: "Cr\u00e9\u00e9e", color: "#6b46c1" },
  PLANNED: { label: "Planifi\u00e9e", color: "#b68a14" },
  IN_PROGRESS: { label: "En cours", color: "#4da6ff" },
  LATE: { label: "En retard", color: "#ff6b6b" },
  DONE: { label: "Termin\u00e9e", color: "#2f855a" },
  CANCELED: { label: "Annul\u00e9e", color: "#5a5f6b" },
  ARCHIVED: { label: "Archiv\u00e9e", color: "#8b95a1" },
};

const PLAN_STATUS_META: Record<
  MaintenancePlanStatus,
  { label: string; color: string }
> = {
  PLANNED: { label: "Planifi\u00e9", color: "#b68a14" },
  IN_PROGRESS: { label: "En cours", color: "#4da6ff" },
  LATE: { label: "En retard", color: "#ff6b6b" },
  DONE: { label: "Termin\u00e9", color: "#2f855a" },
  CANCELLED: { label: "Annul\u00e9", color: "#8b95a1" },
};

function activityCost(activity: Activity): number {
  const spareCost = activity.spareParts.reduce(
    (total, line) => total + (line.unitPrice ?? 0) * line.quantity,
    0,
  );
  const additionalCost = activity.additionalCosts.reduce(
    (total, cost) => total + cost.amount,
    0,
  );
  return spareCost + additionalCost;
}

function activitySpentMinutes(activity: Activity): number {
  return activity.spentHours * 60 + activity.spentMinutes;
}

function formatHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

function formatMoney(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function getEquipmentImageUrl(equipment: Equipment | null): string | null {
  if (!equipment) {
    return null;
  }

  return `${BACKEND_URL}/api/equipment/${equipment.id}/image`;
}

function daysBetween(firstDate: string, secondDate: string): number | null {
  const first = new Date(firstDate);
  const second = new Date(secondDate);

  if (Number.isNaN(first.getTime()) || Number.isNaN(second.getTime())) {
    return null;
  }

  return Math.max(0, Math.round((second.getTime() - first.getTime()) / 86400000));
}

/**
 * Petit donut chart SVG fait maison — pas de dépendance externe à
 * installer. Prend une liste de segments {label, value, color} et
 * dessine les arcs proportionnellement.
 */
function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 60;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="dashboard-donut">
      <svg viewBox="0 0 160 160" className="dashboard-donut-svg">
        <circle
          cx={80}
          cy={80}
          r={radius}
          fill="none"
          stroke="#eef2f6"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          segments.map((segment) => {
            if (segment.value === 0) return null;

            const fraction = segment.value / total;
            const dash = fraction * circumference;
            const offset = circumference - (cumulative / total) * circumference;
            cumulative += segment.value;

            return (
              <circle
                key={segment.label}
                cx={80}
                cy={80}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                transform="rotate(-90 80 80)"
                strokeLinecap="butt"
              />
            );
          })}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          className="dashboard-donut-total"
        >
          {total}
        </text>
        <text
          x="80"
          y="94"
          textAnchor="middle"
          className="dashboard-donut-total-label"
        >
          total
        </text>
      </svg>

      <div className="dashboard-donut-legend">
        {segments.map((segment) => (
          <div className="dashboard-donut-legend-item" key={segment.label}>
            <span
              className="dashboard-donut-legend-dot"
              style={{ background: segment.color }}
            />
            <span>{segment.label}</span>
            <strong>{segment.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Jauge en demi-cercle avec un arc par statut et son pourcentage
 * affiché le long de l'arc — inspirée du tableau de bord de référence.
 * Puces de statut au-dessus, total sous la jauge.
 */
function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy - r * Math.sin(angleRad) };
}

/**
 * Chemin SVG d'un secteur d'anneau (donut slice) entre deux rayons et
 * deux angles. On dessine des secteurs remplis plutôt qu'un trait
 * épais en pointillés : ça évite tout artefact de rendu aux
 * extrémités (les "butt caps" d'un trait épais sur une courbe créent
 * des évasements visuels near les bords).
 */
function donutSectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  angleStart: number,
  angleEnd: number,
) {
  const largeArc = angleStart - angleEnd > 180 ? 1 : 0;
  const outerStart = polarPoint(cx, cy, outerR, angleStart);
  const outerEnd = polarPoint(cx, cy, outerR, angleEnd);
  const innerEnd = polarPoint(cx, cy, innerR, angleEnd);
  const innerStart = polarPoint(cx, cy, innerR, angleStart);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function StatusGauge({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const cx = 110;
  const cy = 112;
  const outerR = 100;
  const innerR = 68;

  let cumulativeAngle = 180;

  const arcs = segments.map((segment) => {
    if (segment.value === 0 || total === 0) {
      return { ...segment, angleStart: cumulativeAngle, angleEnd: cumulativeAngle, fraction: 0 };
    }

    const fraction = segment.value / total;
    const angleStart = cumulativeAngle;
    const angleEnd = cumulativeAngle - fraction * 180;
    cumulativeAngle = angleEnd;

    return { ...segment, angleStart, angleEnd, fraction };
  });

  return (
    <div className="dashboard-gauge-wrap">
      <svg viewBox="0 0 220 128" className="dashboard-gauge-svg">
        <path d={donutSectorPath(cx, cy, innerR, outerR, 180, 0)} fill="#eef2f6" />

        {arcs.map((arc) =>
          arc.fraction > 0 ? (
            <path
              key={arc.label}
              d={donutSectorPath(cx, cy, innerR, outerR, arc.angleStart, arc.angleEnd)}
              fill={arc.color}
            />
          ) : null,
        )}

        {arcs.map((arc) => {
          if (arc.fraction < 0.04) return null;

          const midAngle = (arc.angleStart + arc.angleEnd) / 2;
          const labelPoint = polarPoint(cx, cy, (innerR + outerR) / 2, midAngle);

          return (
            <text
              key={`${arc.label}-label`}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="dashboard-gauge-label"
            >
              {(arc.fraction * 100).toFixed(1)}%
            </text>
          );
        })}
      </svg>

      <div className="dashboard-gauge-total">
        <strong>{total}</strong>
        <span>Tâches au total</span>
      </div>
    </div>
  );
}

interface BarItem {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}

/**
 * Construit un chemin SVG lissé (courbes de Bézier) à partir d'une
 * liste de points — utilisé par tous les graphiques en courbe du
 * tableau de bord.
 */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return d;
}

/**
 * Graphique en courbe (ligne + aire lissée) pour une série simple —
 * remplace les anciennes barres horizontales.
 */
function SimpleBarChart({ items }: { items: BarItem[] }) {
  if (items.length === 0) {
    return <p className="dashboard-empty-hint">Aucune donnée disponible.</p>;
  }

  return (
    <div className="dashboard-bar-chart">
      {items.map((item) => {
        const percent = item.max > 0 ? Math.min(100, (item.value / item.max) * 100) : 0;

        return (
          <div className="dashboard-bar-row" key={item.label}>
            <span className="dashboard-bar-label" title={item.label}>
              {item.label}
            </span>
            <div className="dashboard-bar-track">
              <div
                className="dashboard-bar-fill"
                style={{ width: `${percent}%`, background: item.color }}
              />
            </div>
            <span className="dashboard-bar-value">
              {item.value}
              {item.suffix ?? ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface StackedBarItem {
  label: string;
  segments: { value: number; color: string }[];
}

/**
 * Aire empilée en courbes lissées : une série par statut, empilée
 * verticalement le long des entités (utilisateur, centre de coût,
 * tag...) — remplace les anciennes barres empilées.
 */
function StackedBarChart({ items }: { items: StackedBarItem[] }) {
  if (items.length === 0) {
    return <p className="dashboard-empty-hint">Aucune donnée disponible.</p>;
  }

  const globalMax = Math.max(
    ...items.map((item) => item.segments.reduce((sum, s) => sum + s.value, 0)),
    1,
  );

  return (
    <div className="dashboard-stacked-chart">
      {items.map((item) => {
        const total = item.segments.reduce((sum, s) => sum + s.value, 0);
        const widthPercent = (total / globalMax) * 100;

        return (
          <div className="dashboard-stacked-row" key={item.label}>
            <span className="dashboard-bar-label" title={item.label}>
              {item.label}
            </span>
            <div className="dashboard-stacked-track">
              <div className="dashboard-stacked-fill" style={{ width: `${widthPercent}%` }}>
                {item.segments.map((segment, index) =>
                  segment.value > 0 ? (
                    <span
                      key={index}
                      className="dashboard-stacked-segment"
                      style={{
                        flexGrow: segment.value,
                        background: segment.color,
                      }}
                      title={String(segment.value)}
                    />
                  ) : null,
                )}
              </div>
            </div>
            <span className="dashboard-bar-value">{total}</span>
          </div>
        );
      })}
    </div>
  );
}


type AnalysisDimension = "users" | "tags" | "costCenters" | "equipment";

type DashboardSection = "apercu" | "temps" | "classements" | "repartition";

const DASHBOARD_SECTIONS: { key: DashboardSection; label: string }[] = [
  { key: "apercu", label: "Aperçu" },
  { key: "temps", label: "Temps & coûts" },
  { key: "classements", label: "Classements" },
  { key: "repartition", label: "Répartition" },
];

/**
 * Barres empilées verticales pour l'analyse par dimension
 * (utilisateurs / tags / centres de coût / équipements). Utilise la
 * même palette que le reste du dashboard (TASK_STATUS_META) pour que
 * chaque statut ait toujours la même couleur partout.
 */
function TaskAnalysisChart({ items }: { items: StackedBarItem[] }) {
  const statuses = Object.keys(TASK_STATUS_META) as TaskStatus[];
  const maxTotal = Math.max(
    ...items.map((item) => item.segments.reduce((sum, segment) => sum + segment.value, 0)),
    1,
  );

  if (items.length === 0) {
    return <p className="dashboard-empty-hint">Aucune donnée disponible.</p>;
  }

  return (
    <div className="task-analysis-chart-scroll">
      <div className="task-analysis-chart" style={{ minWidth: `${Math.max(900, items.length * 150)}px` }}>
        <div className="task-analysis-grid-lines" aria-hidden="true" />

        <div className="task-analysis-bars">
          {items.map((item) => {
            const total = item.segments.reduce((sum, segment) => sum + segment.value, 0);
            const totalHeight = Math.max(2, (total / maxTotal) * 100);

            return (
              <div className="task-analysis-column" key={item.label}>
                <div className="task-analysis-bar-zone">
                  <div
                    className="task-analysis-stacked-bar"
                    style={{ height: `${totalHeight}%` }}
                    title={`${item.label}: ${total}`}
                  >
                    {item.segments.map((segment, index) => {
                      const status = statuses[index];
                      const height = total > 0 ? (segment.value / total) * 100 : 0;

                      if (segment.value === 0) return null;

                      return (
                        <span
                          key={status}
                          className="task-analysis-segment"
                          style={{
                            height: `${height}%`,
                            backgroundColor: TASK_STATUS_META[status].color,
                          }}
                          title={`${TASK_STATUS_META[status].label}: ${segment.value}`}
                        >
                          <strong>{segment.value}</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>

                <span className="task-analysis-axis-label" title={item.label}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type TrendPeriod = "day" | "week" | "month" | "year";

interface TrendPoint {
  label: string;
  value: number;
}

function TrendChart({
  points,
  period,
  onPeriodChange,
}: {
  points: TrendPoint[];
  period: TrendPeriod;
  onPeriodChange: (period: TrendPeriod) => void;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const width = 640;
  const height = 180;
  const padding = 30;
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => {
    const x = padding + index * stepX;
    const y = height - padding - (point.value / max) * (height - padding * 1.5);
    return { x, y, point };
  });

  const linePath = buildSmoothPath(coordinates);

  const areaPath =
    coordinates.length > 0
      ? `${linePath} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`
      : "";

  const periods: { value: TrendPeriod; label: string }[] = [
    { value: "day", label: "Jour" },
    { value: "week", label: "Semaine" },
    { value: "month", label: "Mois" },
    { value: "year", label: "Année" },
  ];

  return (
    <div className="dashboard-trend-chart">
      <div className="dashboard-trend-toggle">
        {periods.map((p) => (
          <button
            key={p.value}
            type="button"
            className={period === p.value ? "active" : ""}
            onClick={() => onPeriodChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {points.length === 0 ? (
        <p className="dashboard-empty-hint">Aucune activité sur cette période.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="dashboard-trend-svg">
          {areaPath && <path d={areaPath} className="dashboard-trend-area" />}
          {linePath && <path d={linePath} className="dashboard-trend-line" />}
          {coordinates.map((coord, index) => (
            <circle
              key={index}
              cx={coord.x}
              cy={coord.y}
              r={3.5}
              className="dashboard-trend-dot"
            />
          ))}
          {coordinates.map((coord, index) => (
            <text
              key={index}
              x={coord.x}
              y={height - 8}
              textAnchor="middle"
              className="dashboard-trend-axis-label"
            >
              {coord.point.label}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}


const RANKING_COLORS = [
  "#5b9bd5",
  "#ffc85c",
  "#7bc97e",
  "#f3935a",
  "#9aa5b1",
  "#ff8a80",
  "#ffd54f",
  "#7ea0e8",
  "#c9ced3",
  "#5ec8c0",
];

interface RankingItem {
  label: string;
  value: number;
  suffix?: string;
  id?: number | string;
}

interface RankingTableProps {
  title: string;
  subtitle?: string;
  items: RankingItem[];
  firstColumnTitle?: string;
  showId?: boolean;
  valueType?: "hours" | "number" | "money";
  onOpen?: (item: RankingItem) => void;
}

function formatRankingValue(
  value: number,
  valueType: "hours" | "number" | "money",
  suffix?: string,
): string {
  if (valueType === "hours") {
    const totalMinutes = Math.round(value * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes}min.`;
    }

    return `${hours}h ${minutes}min.`;
  }

  if (valueType === "money") {
    return `${value.toLocaleString("fr-FR", {
      maximumFractionDigits: 0,
    })} EUR`;
  }

  return `${value.toLocaleString("fr-FR")}${suffix ?? ""}`;
}

function RankingTrophy({ index }: { index: number }) {
  if (index > 2) {
    return null;
  }

  return (
    <Trophy
      size={22}
      className={`dashboard-ranking-trophy dashboard-ranking-trophy-${index + 1}`}
    />
  );
}

function RankingTable({
  title,
  subtitle,
  items,
  firstColumnTitle = "Nom",
  showId = false,
  valueType = "number",
  onOpen,
}: RankingTableProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="dashboard-ranking-card">
      <div className="dashboard-ranking-card-header">
        <h2>{title}</h2>
        {subtitle && <span className="dashboard-ranking-subtitle">{subtitle}</span>}
      </div>

      {items.length === 0 ? (
        <p className="dashboard-ranking-empty">Aucune donnée disponible.</p>
      ) : (
        <div className="dashboard-ranking-table-wrapper">
          <table className="dashboard-ranking-table">
            <thead>
              <tr>
                {showId && <th>ID</th>}
                <th>{firstColumnTitle}</th>
                <th>Valeur</th>
                <th>Pourcentage</th>
                <th aria-label="Couleur" />
              </tr>
            </thead>

            <tbody>
              {items.slice(0, 10).map((item, index) => {
                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                const color = RANKING_COLORS[index % RANKING_COLORS.length];

                return (
                  <tr key={`${item.id ?? item.label}-${index}`}>
                    {showId && (
                      <td>
                        <button
                          type="button"
                          className="dashboard-ranking-link"
                          onClick={() => onOpen?.(item)}
                          disabled={!onOpen}
                        >
                          #{item.id ?? index + 1}
                          {onOpen && <span aria-hidden="true">↗</span>}
                        </button>
                      </td>
                    )}

                    <td>
                      <div className="dashboard-ranking-name">
                        <RankingTrophy index={index} />
                        <span>{item.label}</span>
                      </div>
                    </td>

                    <td>{formatRankingValue(item.value, valueType, item.suffix)}</td>
                    <td>{percentage.toFixed(2)}%</td>

                    <td>
                      <span
                        className="dashboard-ranking-color"
                        style={{ backgroundColor: color }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

function DashboardPage() {

  const navigate = useNavigate();
  const email = getAuthenticatedEmail();
  const role = getAuthenticatedRole();
  const displayRole =
    role === "SUPERVISOR"
      ? "Superviseur"
      : role === "SUPERADMIN"
        ? "Super administrateur"
        : "Administrateur";

  const [equipmentCount, setEquipmentCount] = useState(0);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [teamsCount, setTeamsCount] = useState(0);
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [purchaseOrdersCount, setPurchaseOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("day");
  const [analysisDimension, setAnalysisDimension] = useState<AnalysisDimension>("users");
  const [analysisFiltersOpen, setAnalysisFiltersOpen] = useState(false);
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>("apercu");
  const [maintenanceMetric, setMaintenanceMetric] = useState<
    "stops" | "defective" | "mtbf" | "mttr"
  >("stops");
  const [dashboardMonth, setDashboardMonth] = useState("ALL");
  const [dashboardYear, setDashboardYear] = useState("ALL");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          equipmentData,
          tasksData,
          activitiesData,
          sparePartsData,
          teamsData,
          plansData,
          purchaseOrdersData,
        ] = await Promise.all([
          getEquipment().catch(() => []),
          getTasks().catch(() => []),
          getActivities().catch(() => []),
          getSpareParts().catch(() => []),
          getTeams().catch(() => []),
          getMaintenancePlans().catch(() => []),
          getPurchaseOrders().catch(() => []),
        ]);

        setEquipmentList(equipmentData);
        setEquipmentCount(equipmentData.length);
        setTasks(tasksData);
        setActivities(activitiesData);
        setSpareParts(sparePartsData);
        setTeamsCount(teamsData.length);
        setPlans(plansData);
        setPurchaseOrdersCount(purchaseOrdersData.length);
      } catch {
        setError("Impossible de charger les données du tableau de bord.");
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  const taskStatusSegments: DonutSegment[] = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      CREATED: 0,
      PLANNED: 0,
      IN_PROGRESS: 0,
      LATE: 0,
      DONE: 0,
      CANCELED: 0,
      ARCHIVED: 0,
    };

    tasks.forEach((task) => {
      counts[task.status] += 1;
    });

    return (Object.keys(counts) as TaskStatus[]).map((status) => ({
      label: TASK_STATUS_META[status].label,
      value: counts[status],
      color: TASK_STATUS_META[status].color,
    }));
  }, [tasks]);

  const planStatusSegments: DonutSegment[] = useMemo(() => {
    const counts: Record<MaintenancePlanStatus, number> = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      LATE: 0,
      DONE: 0,
      CANCELLED: 0,
    };

    plans.forEach((plan) => {
      counts[plan.status] += 1;
    });

    return (Object.keys(counts) as MaintenancePlanStatus[]).map((status) => ({
      label: PLAN_STATUS_META[status].label,
      value: counts[status],
      color: PLAN_STATUS_META[status].color,
    }));
  }, [plans]);

  const lowStockItems = useMemo(() => {
    return spareParts
      .filter((part) => part.quantity < part.minimumStock)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);
  }, [spareParts]);

  const lowStockBars: BarItem[] = useMemo(
    () =>
      lowStockItems.map((part) => ({
        label: part.name,
        value: part.quantity,
        max: Math.max(part.minimumStock, part.quantity, 1),
        color: part.quantity <= 0 ? "#ff6b6b" : "#ffb020",
      })),
    [lowStockItems],
  );

  const totalActivityCost = useMemo(
    () => activities.reduce((total, activity) => total + activityCost(activity), 0),
    [activities],
  );

  const topCostActivities: BarItem[] = useMemo(() => {
    const sorted = [...activities]
      .map((activity) => ({ activity, cost: activityCost(activity) }))
      .filter((item) => item.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    const max = sorted.length > 0 ? sorted[0].cost : 1;

    return sorted.map(({ activity, cost }) => ({
      label: activity.description || `Activité #${activity.id}`,
      value: Math.round(cost),
      max,
      color: "#4da6ff",
      suffix: " EUR",
    }));
  }, [activities]);

  // --- Regroupement par équipement (machine) ---

  const byEquipment = useMemo(() => {
    const map = new Map<
      string,
      {
        minutes: number;
        cost: number;
        activityCount: number;
        doneMinutes: number;
        doneCount: number;
      }
    >();

    activities.forEach((activity) => {
      const key = activity.equipmentName?.trim() || "Sans \u00e9quipement";
      const current = map.get(key) ?? {
        minutes: 0,
        cost: 0,
        activityCount: 0,
        doneMinutes: 0,
        doneCount: 0,
      };

      current.minutes += activitySpentMinutes(activity);
      current.cost += activityCost(activity);
      current.activityCount += 1;

      if (activity.status === "DONE") {
        current.doneMinutes += activitySpentMinutes(activity);
        current.doneCount += 1;
      }

      map.set(key, current);
    });

    return map;
  }, [activities]);

  const equipmentTaskDates = useMemo(() => {
    const map = new Map<string, string[]>();

    tasks.forEach((task) => {
      const key = task.equipment?.name?.trim() || "Sans \u00e9quipement";
      const dates = map.get(key) ?? [];
      dates.push(task.startDate);
      map.set(key, dates);
    });

    return map;
  }, [tasks]);

  const mttrMinutes = useMemo(() => {
    const doneActivities = activities.filter((activity) => activity.status === "DONE");
    if (doneActivities.length === 0) return 0;

    const total = doneActivities.reduce(
      (sum, activity) => sum + activitySpentMinutes(activity),
      0,
    );

    return total / doneActivities.length;
  }, [activities]);

  const mtbfDays = useMemo(() => {
    const gaps: number[] = [];

    equipmentTaskDates.forEach((dates) => {
      const sortedDates = [...dates].sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      );

      for (let index = 1; index < sortedDates.length; index += 1) {
        const gap = daysBetween(sortedDates[index - 1], sortedDates[index]);
        if (gap !== null) gaps.push(gap);
      }
    });

    if (gaps.length === 0) return 0;
    return gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  }, [equipmentTaskDates]);

  const timePerMachine: BarItem[] = useMemo(() => {
    const entries = Array.from(byEquipment.entries())
      .sort((a, b) => b[1].minutes - a[1].minutes)
      .slice(0, 10);

    const max = entries.length > 0 ? entries[0][1].minutes : 1;

    return entries.map(([name, data]) => ({
      label: name,
      value: Math.round((data.minutes / 60) * 10) / 10,
      max: Math.round((max / 60) * 10) / 10 || 1,
      color: "#2dd4bf",
      suffix: " h",
    }));
  }, [byEquipment]);

  const costPerMachine: BarItem[] = useMemo(() => {
    const entries = Array.from(byEquipment.entries())
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 10);

    const max = entries.length > 0 ? entries[0][1].cost : 1;

    return entries.map(([name, data]) => ({
      label: name,
      value: Math.round(data.cost),
      max: Math.round(max) || 1,
      color: "#f3935a",
      suffix: " EUR",
    }));
  }, [byEquipment]);

  const mttrPerMachine: BarItem[] = useMemo(() => {
    const entries = Array.from(byEquipment.entries())
      .map(([name, data]) => ({
        name,
        minutes: data.doneCount > 0 ? data.doneMinutes / data.doneCount : 0,
      }))
      .filter((entry) => entry.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10);

    const max = entries.length > 0 ? entries[0].minutes : 1;

    return entries.map(({ name, minutes }) => ({
      label: name,
      value: Math.round((minutes / 60) * 10) / 10,
      max: Math.round((max / 60) * 10) / 10 || 1,
      color: "#4f8fc4",
      suffix: " h",
    }));
  }, [byEquipment]);

  const mtbfPerMachine: BarItem[] = useMemo(() => {
    const entries = Array.from(equipmentTaskDates.entries())
      .map(([name, dates]) => {
        const sortedDates = [...dates].sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime(),
        );
        const gaps: number[] = [];

        for (let index = 1; index < sortedDates.length; index += 1) {
          const gap = daysBetween(sortedDates[index - 1], sortedDates[index]);
          if (gap !== null) gaps.push(gap);
        }

        const average =
          gaps.length > 0
            ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
            : 0;

        return { name, days: average };
      })
      .filter((entry) => entry.days > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 10);

    const max = entries.length > 0 ? entries[0].days : 1;

    return entries.map(({ name, days }) => ({
      label: name,
      value: Math.round(days * 10) / 10,
      max: Math.round(max * 10) / 10 || 1,
      color: "#6ea6cf",
      suffix: " j",
    }));
  }, [equipmentTaskDates]);

  // --- Top 10 équipements (par temps passé) ---

  const topEquipmentRanking = useMemo<RankingItem[]>(() => {
    return Array.from(byEquipment.entries())
      .map(([name, data]) => ({ label: name, value: data.minutes / 60 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [byEquipment]);

  // --- Top 10 tâches par temps passé (via leurs activités) ---

  const topTaskRanking = useMemo<RankingItem[]>(() => {
    const map = new Map<
      number,
      { id: number; label: string; minutes: number }
    >();

    activities.forEach((activity) => {
      if (!activity.taskId) {
        return;
      }

      const current = map.get(activity.taskId) ?? {
        id: activity.taskId,
        label:
          activity.taskDescription?.trim() ||
          `Tâche #${activity.taskId}`,
        minutes: 0,
      };

      current.minutes += activitySpentMinutes(activity);
      map.set(activity.taskId, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        label: item.label,
        value: item.minutes / 60,
      }));
  }, [activities]);

  // --- Répartitions par tâche : centre de coût / utilisateur / tag ---

  const statusCountsFor = (
    tasksList: TaskListItem[],
    keyOf: (task: TaskListItem) => string[],
  ) => {
    const map = new Map<string, Record<TaskStatus, number>>();

    tasksList.forEach((task) => {
      keyOf(task).forEach((key) => {
        const current =
          map.get(key) ?? { CREATED: 0, PLANNED: 0, IN_PROGRESS: 0, LATE: 0, DONE: 0, CANCELED: 0, ARCHIVED: 0 };
        current[task.status] += 1;
        map.set(key, current);
      });
    });

    return map;
  };

  const costCenterMap = useMemo(
    () =>
      statusCountsFor(tasks, (task) => [task.costCenterName?.trim() || "Sans centre"]),
    [tasks],
  );

  const userMap = useMemo(
    () =>
      statusCountsFor(tasks, (task) =>
        task.assignedTo.length > 0
          ? task.assignedTo.map((a) =>
              a.userFullName?.trim()
                ? a.userFullName.trim()
                : a.teamId
                  ? `Équipe #${a.teamId}`
                  : "Non assigné",
            )
          : ["Non assigné"],
      ),
    [tasks],
  );

  const tagMap = useMemo(
    () =>
      statusCountsFor(tasks, (task) =>
        task.tags.length > 0 ? task.tags.map((t) => t.name) : ["Sans tag"],
      ),
    [tasks],
  );

  const equipmentStatusMap = useMemo(
    () =>
      statusCountsFor(tasks, (task) => [
        (task as unknown as { equipmentName?: string }).equipmentName?.trim() ||
          "Sans équipement",
      ]),
    [tasks],
  );

  function toStackedItems(
    map: Map<string, Record<TaskStatus, number>>,
    limit = 10,
  ): StackedBarItem[] {
    return Array.from(map.entries())
      .map(([label, counts]) => ({
        label,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        segments: (Object.keys(counts) as TaskStatus[]).map((status) => ({
          value: counts[status],
          color: TASK_STATUS_META[status].color,
        })),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit)
      .map(({ label, segments }) => ({ label, segments }));
  }

  const costCenterStacked = useMemo(
    () => toStackedItems(costCenterMap),
    [costCenterMap],
  );
  const userStacked = useMemo(() => toStackedItems(userMap), [userMap]);
  const tagStacked = useMemo(() => toStackedItems(tagMap), [tagMap]);
  const equipmentStacked = useMemo(
    () => toStackedItems(equipmentStatusMap),
    [equipmentStatusMap],
  );

  const analysisItems = useMemo(() => {
    if (analysisDimension === "tags") {
      return tagStacked;
    }

    if (analysisDimension === "costCenters") {
      return costCenterStacked;
    }

    if (analysisDimension === "equipment") {
      return equipmentStacked;
    }

    return userStacked;
  }, [analysisDimension, costCenterStacked, equipmentStacked, tagStacked, userStacked]);


  // --- Top 10 centres de coût / utilisateurs / tags (par nombre de tâches) ---

  function toTopBarItems(map: Map<string, Record<TaskStatus, number>>): BarItem[] {
    const entries = Array.from(map.entries())
      .map(([label, counts]) => ({
        label,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const max = entries.length > 0 ? entries[0].total : 1;

    return entries.map(({ label, total }) => ({
      label,
      value: total,
      max,
      color: "#ffb020",
    }));
  }

  const topCostCenters = useMemo(() => toTopBarItems(costCenterMap), [costCenterMap]);
  const topUsers = useMemo(() => toTopBarItems(userMap), [userMap]);
  const topTags = useMemo(() => toTopBarItems(tagMap), [tagMap]);

  // --- Évolution des activités dans le temps ---

  const activityTrend: TrendPoint[] = useMemo(() => {
    const map = new Map<string, number>();

    function bucketKey(dateStr: string): string {
      const date = new Date(dateStr);
      if (Number.isNaN(date.getTime())) return "?";

      if (trendPeriod === "day") {
        return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      }
      if (trendPeriod === "week") {
        const firstJan = new Date(date.getFullYear(), 0, 1);
        const week = Math.ceil(
          ((date.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7,
        );
        return `S${week}`;
      }
      if (trendPeriod === "month") {
        return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      }
      return String(date.getFullYear());
    }

    activities.forEach((activity) => {
      const key = bucketKey(activity.performedDate);
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .slice(-14);
  }, [activities, trendPeriod]);

  // --- KPI avancés ---

  const totalSpentMinutes = useMemo(
    () => activities.reduce((total, activity) => total + activitySpentMinutes(activity), 0),
    [activities],
  );

  const averageCostPerActivity = useMemo(() => {
    if (activities.length === 0) return 0;
    return totalActivityCost / activities.length;
  }, [activities.length, totalActivityCost]);

  const averageMinutesPerActivity = useMemo(() => {
    if (activities.length === 0) return 0;
    return totalSpentMinutes / activities.length;
  }, [activities.length, totalSpentMinutes]);

  const stockValue = useMemo(
    () => spareParts.reduce((total, part) => total + part.quantity * part.unitPrice, 0),
    [spareParts],
  );

  const lateTasksCount = useMemo(
    () => tasks.filter((task) => task.status === "LATE").length,
    [tasks],
  );

  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    const done = tasks.filter((task) => task.status === "DONE").length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  interface AdvancedKpi {
    title: string;
    displayValue: string;
    icon: ReactNode;
  }

  const advancedKpis: AdvancedKpi[] = [
    {
      title: "Co\u00fbt total",
      displayValue: `${formatMoney(totalActivityCost)} EUR`,
      icon: <PiggyBank size={26} />,
    },
    {
      title: "Temps total pass\u00e9",
      displayValue: formatHoursMinutes(totalSpentMinutes),
      icon: <Clock size={26} />,
    },
    {
      title: "MTTR",
      displayValue: formatHoursMinutes(mttrMinutes),
      icon: <Gauge size={26} />,
    },
    {
      title: "MTBF",
      displayValue: `${Math.round(mtbfDays * 10) / 10} j`,
      icon: <CalendarCheck size={26} />,
    },
    {
      title: "Co\u00fbt moyen / activit\u00e9",
      displayValue: `${formatMoney(averageCostPerActivity)} EUR`,
      icon: <TrendingUp size={26} />,
    },
    {
      title: "Temps moyen / intervention",
      displayValue: formatHoursMinutes(averageMinutesPerActivity),
      icon: <Timer size={26} />,
    },
    {
      title: "Valeur du stock",
      displayValue: `${formatMoney(stockValue)} EUR`,
      icon: <PiggyBank size={26} />,
    },
    {
      title: "T\u00e2ches en retard",
      displayValue: String(lateTasksCount),
      icon: <AlertTriangle size={26} />,
    },
    {
      title: "Taux de compl\u00e9tion",
      displayValue: `${completionRate}%`,
      icon: <Gauge size={26} />,
    },
    {
      title: "Pi\u00e8ces en stock bas",
      displayValue: String(lowStockItems.length),
      icon: <PackageSearch size={26} />,
    },
  ];

  const heroKpis = [
    {
      title: "T\u00e2ches",
      value: loading ? "\u2026" : String(tasks.length),
      icon: <Wrench size={28} />,
      className: "dashboard-hero-card-primary",
    },
    {
      title: "Activit\u00e9s",
      value: loading ? "\u2026" : String(activities.length),
      icon: <ActivityIcon size={28} />,
      className: "dashboard-hero-card-secondary",
    },
    {
      title: "Temps total pass\u00e9",
      value: loading ? "\u2026" : formatHoursMinutes(totalSpentMinutes),
      icon: <Clock size={28} />,
      className: "dashboard-hero-card-time",
    },
    {
      title: "Co\u00fbt total",
      value: loading ? "\u2026" : `${formatMoney(totalActivityCost)} EUR`,
      icon: <PiggyBank size={28} />,
      className: "dashboard-hero-card-cost",
    },
    {
      title: "MTTR",
      value: loading ? "\u2026" : formatHoursMinutes(mttrMinutes),
      icon: <Gauge size={28} />,
      className: "dashboard-hero-card-metric",
    },
    {
      title: "MTBF",
      value: loading ? "\u2026" : `${Math.round(mtbfDays * 10) / 10} j`,
      icon: <CalendarCheck size={28} />,
      className: "dashboard-hero-card-reliability",
    },
  ];

  const resourceCards: DashboardCard[] = [
    { title: "\u00c9quipements", value: equipmentCount, icon: <Wrench size={22} /> },
    { title: "Pi\u00e8ces de rechange", value: spareParts.length, icon: <Boxes size={22} /> },
    { title: "\u00c9quipes", value: teamsCount, icon: <Users size={22} /> },
    { title: "Plans de maintenance", value: plans.length, icon: <CalendarCheck size={22} /> },
    { title: "Commandes d'achat", value: purchaseOrdersCount, icon: <ShoppingCart size={22} /> },
  ];

  const dashboardEquipment = equipmentList[0] ?? null;
  const dashboardEquipmentImage = getEquipmentImageUrl(dashboardEquipment);
  const dashboardTasks = dashboardEquipment
    ? tasks.filter((task) => task.equipment?.id === dashboardEquipment.id)
    : tasks;
  const dashboardActivities = dashboardEquipment
    ? activities.filter(
        (activity) =>
          activity.equipmentName?.trim().toLowerCase() ===
          dashboardEquipment.name.trim().toLowerCase(),
      )
    : activities;
  const dashboardTaskIds = new Set(dashboardTasks.map((task) => task.id));
  const dashboardTaskStatusSegments = (Object.keys(TASK_STATUS_META) as TaskStatus[]).map(
    (status) => ({
      label: TASK_STATUS_META[status].label,
      value: dashboardTasks.filter((task) => task.status === status).length,
      color: TASK_STATUS_META[status].color,
    }),
  );
  const dashboardTotalMinutes = dashboardActivities.reduce(
    (total, activity) => total + activitySpentMinutes(activity),
    0,
  );
  const dashboardTotalCost = dashboardActivities.reduce(
    (total, activity) => total + activityCost(activity),
    0,
  );
  const dashboardAverageCost =
    dashboardTasks.length > 0 ? dashboardTotalCost / dashboardTasks.length : 0;
  const dashboardAverageMinutes =
    dashboardTasks.length > 0 ? dashboardTotalMinutes / dashboardTasks.length : 0;
  const dashboardDoneActivities = dashboardActivities.filter(
    (activity) => activity.status === "DONE",
  );
  const dashboardMttrMinutes =
    dashboardDoneActivities.length > 0
      ? dashboardDoneActivities.reduce(
          (total, activity) => total + activitySpentMinutes(activity),
          0,
        ) / dashboardDoneActivities.length
      : 0;
  const dashboardTaskDateGaps = [...dashboardTasks]
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map((task, index, sorted) =>
      index === 0 ? null : daysBetween(sorted[index - 1].startDate, task.startDate),
    )
    .filter((gap): gap is number => gap !== null);
  const dashboardMtbfDays =
    dashboardTaskDateGaps.length > 0
      ? dashboardTaskDateGaps.reduce((total, gap) => total + gap, 0) /
        dashboardTaskDateGaps.length
      : 0;

  const dashboardCostByTask: BarItem[] = (() => {
    const rows = dashboardActivities
      .filter((activity) => dashboardTaskIds.has(activity.taskId))
      .map((activity) => ({
        label: activity.taskDescription || `T\u00e2che #${activity.taskId}`,
        value: activityCost(activity),
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const max = rows.length > 0 ? rows[0].value : 1;

    return rows.map((row) => ({
      label: row.label,
      value: Math.round(row.value),
      max,
      color: "#b5792d",
      suffix: " EUR",
    }));
  })();

  const dashboardTimeByTask: BarItem[] = (() => {
    const rows = dashboardActivities
      .filter((activity) => dashboardTaskIds.has(activity.taskId))
      .map((activity) => ({
        label: activity.taskDescription || `T\u00e2che #${activity.taskId}`,
        value: activitySpentMinutes(activity),
      }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const max = rows.length > 0 ? rows[0].value : 1;

    return rows.map((row) => ({
      label: row.label,
      value: Math.round((row.value / 60) * 10) / 10,
      max: Math.round((max / 60) * 10) / 10 || 1,
      color: "#1ca39a",
      suffix: " h",
    }));
  })();

  const detailKpis = [
    { title: "T\u00e2ches", value: String(dashboardTasks.length), icon: <Wrench size={24} />, tone: "purple" },
    { title: "Activit\u00e9s", value: String(dashboardActivities.length), icon: <ActivityIcon size={24} />, tone: "coral" },
    { title: "Temps total pass\u00e9", value: formatHoursMinutes(dashboardTotalMinutes), icon: <Clock size={24} />, tone: "mint" },
    { title: "Co\u00fbt total", value: `${formatMoney(dashboardTotalCost)} EUR`, icon: <PiggyBank size={24} />, tone: "amber" },
    { title: "Co\u00fbt moyen / t\u00e2che", value: `${formatMoney(dashboardAverageCost)} EUR`, icon: <TrendingUp size={24} />, tone: "gold" },
    { title: "Temps moyen / t\u00e2che", value: formatHoursMinutes(dashboardAverageMinutes), icon: <Timer size={24} />, tone: "teal" },
    { title: "MTTR (r\u00e9paration moyenne)", value: formatHoursMinutes(dashboardMttrMinutes), icon: <Gauge size={24} />, tone: "orange" },
    { title: "MTBF (entre 2 interventions)", value: `${Math.round(dashboardMtbfDays * 10) / 10} j`, icon: <CalendarCheck size={24} />, tone: "blue" },
  ];

  const allMonthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateParts = (date?: string | null) => {
    if (!date) return null;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return null;
    return { month: parsed.getMonth(), year: parsed.getFullYear() };
  };
  const dashboardDateParts = [
    ...dashboardTasks.flatMap((task) => [dateParts(task.startDate), dateParts(task.endDate)]),
    ...dashboardActivities.map((activity) => dateParts(activity.performedDate)),
  ].filter((part): part is { month: number; year: number } => Boolean(part));
  const availableYears = Array.from(new Set(dashboardDateParts.map((part) => part.year))).sort(
    (a, b) => b - a,
  );
  const selectedDashboardYear = dashboardYear === "ALL" ? null : Number(dashboardYear);
  const availableMonthIndexes = Array.from(
    new Set(
      dashboardDateParts
        .filter((part) => selectedDashboardYear === null || part.year === selectedDashboardYear)
        .map((part) => part.month),
    ),
  ).sort((a, b) => a - b);
  useEffect(() => {
    if (dashboardMonth !== "ALL" && !availableMonthIndexes.includes(Number(dashboardMonth))) {
      setDashboardMonth("ALL");
    }
  }, [availableMonthIndexes, dashboardMonth]);
  const selectedDashboardMonth = dashboardMonth === "ALL" ? null : Number(dashboardMonth);
  const chartMonthIndexes =
    selectedDashboardMonth === null
      ? availableMonthIndexes
      : availableMonthIndexes.includes(selectedDashboardMonth)
        ? [selectedDashboardMonth]
        : [];
  const monthLabels = chartMonthIndexes.map((monthIndex) => allMonthLabels[monthIndex]);
  const dateMatchesDashboardPeriod = (
    date?: string | null,
    monthIndex?: number,
    yearOverride = selectedDashboardYear,
  ) => {
    const parts = dateParts(date);
    if (!parts) return false;
    if (yearOverride !== null && parts.year !== yearOverride) return false;
    if (monthIndex !== undefined && parts.month !== monthIndex) return false;
    if (selectedDashboardMonth !== null && monthIndex === undefined && parts.month !== selectedDashboardMonth) {
      return false;
    }
    return true;
  };
  const filteredDashboardTasks = dashboardTasks.filter((task) =>
    dateMatchesDashboardPeriod(task.startDate),
  );
  const filteredDashboardActivities = dashboardActivities.filter((activity) =>
    dateMatchesDashboardPeriod(activity.performedDate),
  );
  const filteredTotalMinutes = filteredDashboardActivities.reduce(
    (total, activity) => total + activitySpentMinutes(activity),
    0,
  );
  const filteredTotalCost = filteredDashboardActivities.reduce(
    (total, activity) => total + activityCost(activity),
    0,
  );
  const filteredDoneActivities = filteredDashboardActivities.filter(
    (activity) => activity.status === "DONE",
  );
  const filteredAverageMinutes =
    filteredDashboardActivities.length > 0
      ? filteredTotalMinutes / filteredDashboardActivities.length
      : 0;
  const filteredMttrMinutes =
    filteredDoneActivities.length > 0
      ? filteredDoneActivities.reduce((total, activity) => total + activitySpentMinutes(activity), 0) /
        filteredDoneActivities.length
      : 0;
  const monthlyTaskCounts = chartMonthIndexes.map((monthIndex) =>
    dashboardTasks.filter((task) => dateMatchesDashboardPeriod(task.startDate, monthIndex)).length,
  );
  const monthlyLateTasks = chartMonthIndexes.map((monthIndex) =>
    dashboardTasks.filter(
      (task) => dateMatchesDashboardPeriod(task.startDate, monthIndex) && task.status === "LATE",
    ).length,
  );
  const monthlyDoneTasks = chartMonthIndexes.map((monthIndex) =>
    dashboardTasks.filter(
      (task) => dateMatchesDashboardPeriod(task.startDate, monthIndex) && task.status === "DONE",
    ).length,
  );
  const monthlyPlannedTasks = chartMonthIndexes.map((monthIndex) =>
    dashboardTasks.filter(
      (task) =>
        dateMatchesDashboardPeriod(task.startDate, monthIndex) &&
        (task.status === "PLANNED" || task.status === "CREATED"),
    ).length,
  );
  const monthlyActivityMinutes = chartMonthIndexes.map((monthIndex) =>
    dashboardActivities
      .filter((activity) => dateMatchesDashboardPeriod(activity.performedDate, monthIndex))
      .reduce((total, activity) => total + activitySpentMinutes(activity), 0),
  );
  const monthlyActivityCounts = chartMonthIndexes.map((monthIndex) =>
    dashboardActivities.filter((activity) => dateMatchesDashboardPeriod(activity.performedDate, monthIndex)).length,
  );
  const monthlyDowntimeHours = chartMonthIndexes.map((monthIndex, index) => {
    const plannedMinutes = dashboardTasks
      .filter((task) => dateMatchesDashboardPeriod(task.startDate, monthIndex))
      .reduce(
        (total, task) =>
          total +
          task.plannedMaintenanceHours * 60 +
          task.plannedMaintenanceMinutes,
        0,
      );
    const activityMinutes = monthlyActivityMinutes[index] || 0;
    return Math.max(0, Math.round(((plannedMinutes || activityMinutes) / 60) * 10) / 10);
  });
  const monthlyMaintenanceCost = chartMonthIndexes.map((monthIndex) =>
    dashboardActivities
      .filter((activity) => dateMatchesDashboardPeriod(activity.performedDate, monthIndex))
      .reduce((total, activity) => total + activityCost(activity), 0),
  );
  const monthlyPreviousCost = chartMonthIndexes.map((monthIndex) =>
    selectedDashboardYear === null
      ? 0
      : dashboardActivities
          .filter((activity) =>
            dateMatchesDashboardPeriod(activity.performedDate, monthIndex, selectedDashboardYear - 1),
          )
          .reduce((total, activity) => total + activityCost(activity), 0),
  );
  const equipmentIssueRows = Array.from(
    filteredDashboardTasks.reduce((map, task) => {
      const name = task.equipment?.name || "Equipement non defini";
      map.set(name, (map.get(name) || 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxEquipmentIssues = Math.max(...equipmentIssueRows.map(([, value]) => value), 1);
  const equipmentRepairRows = Array.from(
    filteredDashboardActivities.reduce((map, activity) => {
      const name = activity.equipmentName || "Equipement non defini";
      map.set(name, (map.get(name) || 0) + activitySpentMinutes(activity));
      return map;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const statusTotal = Math.max(filteredDashboardTasks.length, 1);
  const downtimePercent = Math.min(
    35,
    Math.max(
      4,
      Math.round(
        (filteredTotalMinutes /
          Math.max(
            1,
            filteredTotalMinutes + statusTotal * 720,
          )) *
          100,
      ),
    ),
  );
  const availabilityPercent = Math.max(0, 100 - downtimePercent);
  const mtbfDisplay = Math.max(0, Math.round((dashboardMtbfDays || 0) * 24));
  const mttrDisplay = Math.max(0, Math.round(filteredMttrMinutes || dashboardMttrMinutes));
  const defectiveEquipmentCount = new Set(
    filteredDashboardTasks
      .filter((task) => task.status === "LATE" || task.status === "IN_PROGRESS")
      .map((task) => task.equipment?.id)
      .filter(Boolean),
  ).size;
  const kpiSparklineValues = [
    monthlyTaskCounts,
    equipmentIssueRows.map(([, value]) => value),
    monthlyDowntimeHours,
    monthlyActivityMinutes.map((value) => Math.round(value / 60)),
  ].map((values) => (values.length > 0 && values.some((value) => value > 0) ? values : [1, 2, 1, 3, 2, 4]));
  const metricConfigs = {
    stops: {
      label: "Nombre d'arrêt",
      title: "Nombre d'heures d'arrêt",
      values: monthlyDowntimeHours,
      color: "#73b8ca",
    },
    defective: {
      label: "Equipements defectueux",
      title: "Equipements defectueux",
      values: monthlyLateTasks.map((value, index) => value + monthlyTaskCounts[index]),
      color: "#357f9a",
    },
    mtbf: {
      label: "MTBF",
      title: "MTBF",
      values: monthlyTaskCounts.map((value) =>
        value > 0 ? Math.max(1, Math.round(((dashboardMtbfDays || 1) * 24) / value)) : 0,
      ),
      color: "#84c9c6",
    },
    mttr: {
      label: "MTTR",
      title: "MTTR",
      values: monthlyActivityMinutes.map((value, index) =>
        monthlyActivityCounts[index] > 0 ? Math.round(value / monthlyActivityCounts[index]) : 0,
      ),
      color: "#2b6f83",
    },
  };
  const activeMetric = metricConfigs[maintenanceMetric];
  const maxActiveMetric = Math.max(...activeMetric.values, 1);
  const cleanDashboardText = (text: string) =>
    text.replace(/\u00c3\u00aa/g, "e").replace(/\u00c3\u00a9/g, "e");
  const maxMonthlyCost = Math.max(...monthlyMaintenanceCost, ...monthlyPreviousCost, 1);
  const workOrderMax = Math.max(
    ...monthlyPlannedTasks,
    ...monthlyDoneTasks,
    ...monthlyLateTasks,
    1,
  );
  const taskCountByUser = new Map<string, number>();
  filteredDashboardTasks.forEach((task) => {
    const assignees = task.assignedTo?.length ? task.assignedTo : task.assignees;
    assignees?.forEach((assignee) => {
      const name = assignee.userFullName || assignee.teamName || "Non assigne";
      taskCountByUser.set(name, (taskCountByUser.get(name) || 0) + 1);
    });
  });
  const employeeTaskRows = Array.from(taskCountByUser.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxEmployeeTasks = Math.max(...employeeTaskRows.map(([, value]) => value), 1);
  const teamEfficiency = Math.min(
    99,
    Math.max(10, Math.round((filteredDoneActivities.length / Math.max(1, filteredDashboardActivities.length)) * 100)),
  );
  const employeeEfficiencyRows = employeeTaskRows.map(([name, value], index) => ({
    name,
    value: Math.max(10, Math.min(99, Math.round(teamEfficiency - index * 8 + value * 3))),
  }));
  const sparkPath = (values: number[], width = 240, height = 58) => {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = Math.max(1, max - min);
    return values
      .map((value, index) => {
        const x = values.length === 1 ? width : (index / (values.length - 1)) * width;
        const y = height - ((value - min) / span) * (height - 8) - 4;
        return `${x},${y}`;
      })
      .join(" ");
  };
  const formatLargeAmount = (value: number) => {
    if (value >= 1000000) return `${Math.round((value / 1000000) * 10) / 10}M`;
    if (value >= 1000) return `${Math.round((value / 1000) * 10) / 10}K`;
    return String(Math.round(value));
  };
  const monthGridStyle = {
    gridTemplateColumns: `repeat(${Math.max(monthLabels.length, 1)}, minmax(34px, 1fr))`,
  } as CSSProperties;

  const videoDashboard = (
    <section className="admin-dashboard admin-dashboard-video">
      <div className="maintenance-video-shell">
        <aside className="maintenance-kpi-rail" aria-label="Main KPIs">
          <h2>MAIN KPIS</h2>
          {[
            {
              label: "Nombre d'arrêt",
              value: filteredDashboardTasks.length,
              icon: <AlertTriangle size={24} />,
              values: kpiSparklineValues[0],
            },
            {
              label: "Equipements defectueux",
              value: defectiveEquipmentCount,
              icon: <Wrench size={24} />,
              values: kpiSparklineValues[1],
            },
            {
              label: "MTBF",
              value: mtbfDisplay,
              icon: <CalendarCheck size={24} />,
              values: kpiSparklineValues[2],
            },
            {
              label: "MTTR",
              value: mttrDisplay,
              icon: <Clock size={24} />,
              values: kpiSparklineValues[3],
            },
          ].map((item) => (
            <article className="maintenance-rail-kpi" key={item.label}>
              <div className="maintenance-rail-kpi-header">
                <span>{cleanDashboardText(item.label)}</span>
                <div className="maintenance-rail-icon">{item.icon}</div>
              </div>
              <strong>{item.value}</strong>
              <svg viewBox="0 0 240 70" role="img" aria-label={cleanDashboardText(item.label)}>
                <polygon
                  points={`0,70 ${sparkPath(item.values)} 240,70`}
                  className="maintenance-spark-area"
                />
                <polyline points={sparkPath(item.values)} className="maintenance-spark-line" />
                <line x1="0" y1="62" x2="240" y2="62" className="maintenance-spark-base" />
              </svg>
            </article>
          ))}
        </aside>

        <div className="maintenance-video-content">
          <div className="maintenance-video-topbar">
            <div>
              <h1>Indicateurs de Maintenance</h1>
              <p>Vue generale de la performance maintenance de votre usine</p>
            </div>
            <div className="maintenance-video-filters">
              <label>
                <span>MOIS</span>
                <select value={dashboardMonth} onChange={(event) => setDashboardMonth(event.target.value)}>
                  <option value="ALL">All</option>
                  {availableMonthIndexes.map((monthIndex) => (
                    <option value={String(monthIndex)} key={monthIndex}>
                      {allMonthLabels[monthIndex]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>ANNEE</span>
                <select value={dashboardYear} onChange={(event) => setDashboardYear(event.target.value)}>
                  <option value="ALL">All</option>
                  {availableYears.map((year) => (
                    <option value={String(year)} key={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error && <div className="resource-error-message">{error}</div>}

          <article className="maintenance-video-card maintenance-indicator-card">
            <div className="maintenance-metric-tabs">
              {(Object.keys(metricConfigs) as Array<keyof typeof metricConfigs>).map((key) => (
                <button
                  className={maintenanceMetric === key ? "is-active" : ""}
                  key={key}
                  type="button"
                  onClick={() => setMaintenanceMetric(key)}
                >
                  {cleanDashboardText(metricConfigs[key].label)}
                </button>
              ))}
            </div>
            <div className="maintenance-month-chart">
              <h3>{cleanDashboardText(activeMetric.title)}</h3>
              {monthLabels.length === 0 ? (
                <p className="maintenance-empty-state">Aucune donnee disponible pour cette periode.</p>
              ) : (
                <div className="maintenance-column-chart" style={monthGridStyle}>
                  {monthLabels.map((month, index) => {
                    const value = activeMetric.values[index] || 0;
                    const height = Math.max(8, (value / maxActiveMetric) * 100);
                    return (
                      <div className="maintenance-column-item" key={month}>
                        <span>{Math.round(value)}</span>
                        <i style={{ height: `${height}%`, backgroundColor: activeMetric.color }} />
                        <em>{month}</em>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </article>

          <div className="maintenance-video-grid two">
            <article className="maintenance-video-card">
              <h3>Disponibilite et Temps d'arret</h3>
              <div className="maintenance-donut-wrap">
                <div
                  className="maintenance-donut-ring"
                  style={{
                    background: `conic-gradient(#2b6f83 0 ${availabilityPercent}%, #9fd9d5 ${availabilityPercent}% 100%)`,
                  }}
                />
                <div className="maintenance-donut-caption">
                  <span>Disponibilite {availabilityPercent}%</span>
                  <span>Temps d'arret {downtimePercent}%</span>
                </div>
              </div>
            </article>

            <article className="maintenance-video-card">
              <h3>Heures d'arret dues a un equipement</h3>
              <div className="maintenance-horizontal-bars">
                {(equipmentIssueRows.length ? equipmentIssueRows : [["Aucune donnee", 0] as [string, number]]).map(
                  ([name, value]) => (
                    <div className="maintenance-horizontal-row" key={name}>
                      <span title={name}>{name}</span>
                      <i>
                        <b style={{ width: `${Math.max(5, (value / maxEquipmentIssues) * 100)}%` }} />
                      </i>
                      <strong>{value}</strong>
                    </div>
                  ),
                )}
              </div>
            </article>
          </div>

          <div className="maintenance-video-topbar compact">
            <div>
              <h1>Performance de Maintenance</h1>
              <p>COUTS, TEMPS DE REPARATION, ETAT DES TACHES</p>
            </div>
          </div>

          <div className="maintenance-video-grid performance">
            <article className="maintenance-video-card maintenance-cost-card">
              <h3>Cout de Maintenance</h3>
              <strong className="maintenance-ytd">{formatLargeAmount(filteredTotalCost || 0)} EUR</strong>
              {monthLabels.length === 0 ? (
                <p className="maintenance-empty-state">Aucune donnee disponible pour cette periode.</p>
              ) : (
                <div className="maintenance-area-chart" style={monthGridStyle}>
                  {monthLabels.map((month, index) => {
                    const current = monthlyMaintenanceCost[index] || 0;
                    const previous = monthlyPreviousCost[index] || 0;
                    return (
                      <div className="maintenance-area-column" key={month}>
                        <span style={{ height: `${Math.max(2, (current / maxMonthlyCost) * 100)}%` }} />
                        <i style={{ height: `${Math.max(2, (previous / maxMonthlyCost) * 100)}%` }} />
                        <em>{month}</em>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="maintenance-video-card maintenance-repair-table-card">
              <h3>Temps Moyen de Maintenance par Equipement</h3>
              <strong className="maintenance-green-number">
                {formatHoursMinutes(
                  equipmentRepairRows.length
                    ? equipmentRepairRows.reduce((total, [, value]) => total + value, 0) /
                        equipmentRepairRows.length
                    : 0,
                )}
              </strong>
              <div className="maintenance-table-like">
                <div>
                  <span>Equipement</span>
                  <span>Temps de reparation</span>
                </div>
                {(equipmentRepairRows.length ? equipmentRepairRows : [["Aucune donnee", 0] as [string, number]]).map(
                  ([name, minutes]) => (
                    <p key={name}>
                      <span>{name}</span>
                      <strong>{formatHoursMinutes(minutes)}</strong>
                    </p>
                  ),
                )}
              </div>
            </article>
          </div>

          <article className="maintenance-video-card maintenance-workorders-card">
            <h3>Ordres de travail : Planifies, Termines et En retard</h3>
            {monthLabels.length === 0 ? (
              <p className="maintenance-empty-state">Aucune donnee disponible pour cette periode.</p>
            ) : (
              <div className="maintenance-workorders-chart" style={monthGridStyle}>
                {monthLabels.map((month, index) => (
                  <div className="maintenance-workorders-month" key={month}>
                    <div className="maintenance-workorders-bars">
                      <span
                        className="planned"
                        style={{ height: `${Math.max(4, (monthlyPlannedTasks[index] / workOrderMax) * 100)}%` }}
                      />
                      <span
                        className="done"
                        style={{ height: `${Math.max(4, (monthlyDoneTasks[index] / workOrderMax) * 100)}%` }}
                      />
                      <i
                        className="late"
                        style={{ bottom: `${Math.max(10, (monthlyLateTasks[index] / workOrderMax) * 82)}%` }}
                      />
                    </div>
                    <em>{month}</em>
                  </div>
                ))}
              </div>
            )}
          </article>

          <div className="maintenance-video-topbar compact">
            <div>
              <h1>Performance de l'Equipe</h1>
              <p>EFFICACITE, TEMPS D'INTERVENTION, RESOLUTION, NOMBRE DE TACHES</p>
            </div>
          </div>

          <div className="maintenance-team-kpis">
            <article>Heures de maintenance planifiees<strong>{formatLargeAmount(filteredTotalMinutes / 60)}</strong></article>
            <article>Duree de Maintenance en Temps Reel<strong>{formatLargeAmount(monthlyActivityMinutes.reduce((a, b) => a + b, 0) / 60)}</strong></article>
            <article>Temps d'intervention moyen<strong>{formatHoursMinutes(filteredAverageMinutes)}</strong></article>
            <article>Temps Moyen de Maintenance par Equipement<strong>{formatHoursMinutes(filteredMttrMinutes)}</strong></article>
          </div>

          <div className="maintenance-video-grid two">
            <article className="maintenance-video-card maintenance-gauge-card">
              <h3>Efficacite de l'Equipe</h3>
              <div
                className="maintenance-gauge"
                style={{ "--value": `${teamEfficiency}%` } as CSSProperties}
              >
                <strong>{teamEfficiency}%</strong>
              </div>
            </article>

            <article className="maintenance-video-card">
              <h3>Nombre de taches par employe(e)</h3>
              <div className="maintenance-horizontal-bars team">
                {(employeeTaskRows.length ? employeeTaskRows : [["Aucun collaborateur", 0] as [string, number]]).map(
                  ([name, value]) => (
                    <div className="maintenance-horizontal-row" key={name}>
                      <span title={name}>{name}</span>
                      <i>
                        <b style={{ width: `${Math.max(5, (value / maxEmployeeTasks) * 100)}%` }} />
                      </i>
                      <strong>{value}</strong>
                    </div>
                  ),
                )}
              </div>
            </article>
          </div>

          <article className="maintenance-video-card maintenance-efficiency-card">
            <h3>Efficacite par Employe(e)</h3>
            <div className="maintenance-efficiency-bars">
              {(employeeEfficiencyRows.length
                ? employeeEfficiencyRows
                : [{ name: "Aucun collaborateur", value: 0 }]
              ).map((row) => (
                <div key={row.name}>
                  <span style={{ height: `${Math.max(5, row.value)}%` }} />
                  <strong>{row.value}%</strong>
                  <em title={row.name}>{row.name}</em>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );

  return videoDashboard;

  return (
    <section className="admin-dashboard admin-dashboard-exact">
      <div className="admin-page-heading">
        <div>
          <span className="section-label">Tableau de bord</span>
          <h1>Bienvenue, {displayRole}</h1>
          <p>
            {email} — {role}
          </p>
        </div>
      </div>

      {error && <div className="resource-error-message">{error}</div>}

      {!loading && (
        <div className="equipment-dashboard-panel">
          <div className="equipment-dashboard-header">
            <div className="equipment-dashboard-media">
              {dashboardEquipmentImage ? (
                <img
                  src={dashboardEquipmentImage ?? undefined}
                  alt={dashboardEquipment?.name ?? "\u00c9quipement"}
                />
              ) : (
                <Wrench size={28} />
              )}
            </div>

            <div>
              <span className="equipment-dashboard-eyebrow">
                {"D\u00e9tail \u00e9quipement"}
              </span>
              <h2>{dashboardEquipment?.name ?? "Tous les \u00e9quipements"}</h2>
              <p>
                {dashboardEquipment?.itemCode ??
                  dashboardEquipment?.costCenterName ??
                  "Vue globale"}
              </p>
            </div>

            <button
              type="button"
              className="equipment-dashboard-close"
              onClick={() => navigate("/admin/dashboard")}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <div className="equipment-dashboard-kpis">
            {detailKpis.map((kpi) => (
              <article className="equipment-dashboard-kpi" key={kpi.title}>
                <div className={`equipment-dashboard-kpi-icon tone-${kpi.tone}`}>
                  {kpi.icon}
                </div>
                <div>
                  <span>{kpi.title}</span>
                  <strong>{kpi.value}</strong>
                </div>
              </article>
            ))}
          </div>

          <div className="equipment-dashboard-charts">
            <article className="equipment-dashboard-chart-card">
              <h3>{"T\u00e2ches par statut"}</h3>
              <DonutChart segments={dashboardTaskStatusSegments} />
            </article>

            <article className="equipment-dashboard-chart-card">
              <h3>{"Co\u00fbt par t\u00e2che"}</h3>
              <SimpleBarChart items={dashboardCostByTask} />
            </article>

            <article className="equipment-dashboard-chart-card">
              <h3>{"Temps pass\u00e9 par t\u00e2che"}</h3>
              <SimpleBarChart items={dashboardTimeByTask} />
            </article>
          </div>
        </div>
      )}

      {loading && <div className="resource-empty-state">Chargement du tableau de bord...</div>}
    </section>
  );

  return (
    <section className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <span className="section-label">Tableau de bord</span>
          <h1>Bienvenue, {displayRole}</h1>
          <p>
            {email} — {role}
          </p>
        </div>
      </div>

      {error && <div className="resource-error-message">{error}</div>}

      <div className="dashboard-hero-kpis">
        {heroKpis.map((kpi) => (
          <article className={`dashboard-hero-card ${kpi.className}`} key={kpi.title}>
            <div className="dashboard-hero-card-body">
              <span>{kpi.title}</span>
              <strong>{kpi.value}</strong>
            </div>
            <div className="dashboard-hero-card-icon">{kpi.icon}</div>
          </article>
        ))}
      </div>

      <div className="dashboard-resource-strip">
        {resourceCards.map((card) => (
          <article className="dashboard-resource-card" key={card.title}>
            <div className="dashboard-resource-icon">{card.icon}</div>
            <div>
              <span>{card.title}</span>
              <strong>{loading ? "…" : card.value}</strong>
            </div>
          </article>
        ))}
      </div>

      {!loading && (
        <div className="dashboard-kpi-strip">
          {advancedKpis.map((kpi) => (
            <article className="dashboard-kpi-mini" key={kpi.title}>
              <div className="dashboard-kpi-mini-icon">{kpi.icon}</div>
              <div>
                <span>{kpi.title}</span>
                <strong>{kpi.displayValue}</strong>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && (
        <>
          <div className="dashboard-section-tabs">
            {DASHBOARD_SECTIONS.map((section) => (
              <button
                key={section.key}
                type="button"
                className={dashboardSection === section.key ? "active" : ""}
                onClick={() => setDashboardSection(section.key)}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="dashboard-charts-grid">
            {dashboardSection === "apercu" && (
              <>
                <article className="dashboard-gauge-card">
                  <h2>{"T\u00e2ches par statut"}</h2>

                  <div className="dashboard-status-chips">
                    {taskStatusSegments.map((segment) => (
                      <span
                        key={segment.label}
                        className="dashboard-status-chip"
                        style={{ background: segment.color }}
                      >
                        {segment.label}
                      </span>
                    ))}
                  </div>

                  <StatusGauge segments={taskStatusSegments} />
                </article>

                <article className="dashboard-chart-card dashboard-donut-card">
                  <h2>Plans de maintenance par statut</h2>
                  <DonutChart segments={planStatusSegments} />
                </article>

                <article className="dashboard-chart-card dashboard-chart-card-wide">
                    <h2>
                      <TrendingUp size={18} />
                      {"\u00c9volution des activit\u00e9s"}
                    </h2>
                  <TrendChart
                    points={activityTrend}
                    period={trendPeriod}
                    onPeriodChange={setTrendPeriod}
                  />
                </article>
              </>
            )}

            {dashboardSection === "temps" && (
              <>
                <article className="dashboard-chart-card dashboard-chart-card-wide">
                  <div className="dashboard-chart-card-header">
                    <h2>
                      <Clock size={18} />
                      {"Temps total pass\u00e9 par \u00e9quipement"}
                    </h2>
                    <span className="dashboard-total-cost">
                      Top 10 sur <strong>{byEquipment.size.toLocaleString("fr-FR")}</strong> {"\u00e9quipements"}
                    </span>
                  </div>
                  <SimpleBarChart items={timePerMachine} />
                </article>

                <article className="dashboard-chart-card dashboard-chart-card-wide">
                  <div className="dashboard-chart-card-header">
                    <h2>
                      <PiggyBank size={18} />
                      {"Co\u00fbt total par \u00e9quipement"}
                    </h2>
                    <span className="dashboard-total-cost">
                      Top 10 sur <strong>{byEquipment.size.toLocaleString("fr-FR")}</strong> {"\u00e9quipements"}
                    </span>
                  </div>
                  <SimpleBarChart items={costPerMachine} />
                </article>

                <article className="dashboard-chart-card dashboard-chart-card-wide">
                  <div className="dashboard-chart-card-header">
                    <h2>
                      <Gauge size={18} />
                      {"MTTR par \u00e9quipement"}
                    </h2>
                    <span className="dashboard-total-cost">
                      Moyenne : <strong>{formatHoursMinutes(mttrMinutes)}</strong>
                    </span>
                  </div>
                  <SimpleBarChart items={mttrPerMachine} />
                </article>

                <article className="dashboard-chart-card dashboard-chart-card-wide">
                  <div className="dashboard-chart-card-header">
                    <h2>
                      <CalendarCheck size={18} />
                      {"MTBF par \u00e9quipement"}
                    </h2>
                    <span className="dashboard-total-cost">
                      Moyenne : <strong>{Math.round(mtbfDays * 10) / 10} j</strong>
                    </span>
                  </div>
                  <SimpleBarChart items={mtbfPerMachine} />
                </article>

                <article className="dashboard-chart-card dashboard-chart-card-wide">
                  <div className="dashboard-chart-card-header">
                    <h2>
                      <AlertTriangle size={18} />
                      {"Pi\u00e8ces en stock bas"}
                    </h2>
                    <button
                      type="button"
                      className="dashboard-chart-link"
                      onClick={() => navigate("/admin/spare-parts")}
                    >
                      Voir tout
                    </button>
                  </div>

                  {lowStockItems.length === 0 ? (
                    <p className="dashboard-empty-hint">
                      {"Aucune pi\u00e8ce en dessous du stock minimum."}
                    </p>
                  ) : (
                    <SimpleBarChart items={lowStockBars} />
                  )}
                </article>

                <article className="dashboard-chart-card dashboard-chart-card-wide">
                  <div className="dashboard-chart-card-header">
                    <h2>{"Co\u00fbt des activit\u00e9s (top 10)"}</h2>
                    <span className="dashboard-total-cost">
                      Total : <strong>{formatMoney(totalActivityCost)} EUR</strong>
                    </span>
                  </div>

                  <SimpleBarChart items={topCostActivities} />
                </article>
              </>
            )}

            {dashboardSection === "classements" && (
              <>
                <div className="dashboard-ranking-wide dashboard-ranking-grid">
                  <RankingTable
                    title="Top 10 tâches"
                    subtitle={`sur ${tasks.length.toLocaleString("fr-FR")} tâches`}
                    items={topTaskRanking}
                    firstColumnTitle="Description de la tâche"
                    showId
                    valueType="hours"
                    onOpen={(item) => {
                      if (item.id !== undefined) {
                        navigate(`/admin/tasks/${item.id}`);
                      }
                    }}
                  />

                  <RankingTable
                    title="Top 10 équipements"
                    subtitle={`sur ${byEquipment.size.toLocaleString("fr-FR")} équipements`}
                    items={topEquipmentRanking}
                    firstColumnTitle="Équipement"
                    valueType="hours"
                  />
                </div>

                <div className="dashboard-ranking-wide dashboard-ranking-grid">
                  <RankingTable
                    title="Top 10 centres de coût"
                    subtitle={`sur ${costCenterMap.size.toLocaleString("fr-FR")}`}
                    items={topCostCenters}
                    firstColumnTitle="Centre de coût"
                    valueType="number"
                  />

                  <RankingTable
                    title="Top 10 utilisateurs"
                    subtitle={`sur ${userMap.size.toLocaleString("fr-FR")}`}
                    items={topUsers}
                    firstColumnTitle="Utilisateur"
                    valueType="number"
                  />

                  <RankingTable
                    title="Top 10 tags"
                    subtitle={`sur ${tagMap.size.toLocaleString("fr-FR")}`}
                    items={topTags}
                    firstColumnTitle="Tag"
                    valueType="number"
                  />
                </div>
              </>
            )}

            {dashboardSection === "repartition" && (
              <>
                <article className="task-analysis-card dashboard-chart-card-wide">
                  <div className="task-analysis-toolbar">
                    <div className="task-analysis-dimension-tabs">
                      <span className="task-analysis-by">Par</span>

                      <button
                        type="button"
                        className={analysisDimension === "users" ? "active" : ""}
                        onClick={() => setAnalysisDimension("users")}
                      >
                        Utilisateurs
                      </button>

                      <button
                        type="button"
                        className={analysisDimension === "tags" ? "active" : ""}
                        onClick={() => setAnalysisDimension("tags")}
                      >
                        Tags
                      </button>

                      <button
                        type="button"
                        className={analysisDimension === "costCenters" ? "active" : ""}
                        onClick={() => setAnalysisDimension("costCenters")}
                      >
                        Centres de coût
                      </button>

                      <button
                        type="button"
                        className={analysisDimension === "equipment" ? "active" : ""}
                        onClick={() => setAnalysisDimension("equipment")}
                      >
                        Équipements
                      </button>
                    </div>

                    <button
                      type="button"
                      className="task-analysis-print"
                      onClick={() => window.print()}
                    >
                      <Printer size={19} />
                      Imprimer
                    </button>
                  </div>

                  <button
                    type="button"
                    className={`task-analysis-more-filters ${analysisFiltersOpen ? "open" : ""}`}
                    onClick={() => setAnalysisFiltersOpen((current) => !current)}
                  >
                    <span>Afficher plus de filtres</span>
                    <ChevronDown size={20} />
                  </button>

                  {analysisFiltersOpen && (
                    <div className="task-analysis-filter-content">
                      <span>
                        L’analyse utilise actuellement toutes les tâches chargées dans le tableau de bord.
                      </span>
                    </div>
                  )}

                  <div className="task-analysis-legend">
                    {(Object.keys(TASK_STATUS_META) as TaskStatus[]).map((status) => (
                      <span
                        key={status}
                        style={{ backgroundColor: TASK_STATUS_META[status].color }}
                      >
                        {TASK_STATUS_META[status].label}
                      </span>
                    ))}
                  </div>

                  <TaskAnalysisChart items={analysisItems} />
                </article>

                <article className="dashboard-chart-card dashboard-chart-card-wide">
                  <h2>
                    <Users size={18} />
                    Tâches par utilisateur / équipe (par statut)
                  </h2>
                  <div className="dashboard-status-legend">
                    {(Object.keys(TASK_STATUS_META) as TaskStatus[]).map((status) => (
                      <span key={status}>
                        <span
                          className="dashboard-donut-legend-dot"
                          style={{ background: TASK_STATUS_META[status].color }}
                        />
                        {TASK_STATUS_META[status].label}
                      </span>
                    ))}
                  </div>
                  <StackedBarChart items={userStacked} />
                </article>

                <article className="dashboard-chart-card dashboard-chart-card-wide">
                  <h2>
                    <MapPin size={18} />
                    Tâches par centre de coût (par statut)
                  </h2>
                  <StackedBarChart items={costCenterStacked} />
                </article>

                <article className="dashboard-chart-card dashboard-chart-card-wide">
                  <h2>
                    <TagIcon size={18} />
                    Tâches par tag (par statut)
                  </h2>
                  <StackedBarChart items={tagStacked} />
                </article>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default DashboardPage;
