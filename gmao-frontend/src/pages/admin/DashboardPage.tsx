import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity as ActivityIcon,
  AlertTriangle,
  Boxes,
  CalendarCheck,
  Clock,
  ClipboardList,
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
import type {
  MaintenancePlan,
  MaintenancePlanStatus,
} from "../../types/maintenancePlan";

import "./task-styles.css";
import "./DashboardPage.css";

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
  PLANNED: { label: "Planifiée", color: "#ffb020" },
  IN_PROGRESS: { label: "En cours", color: "#4da6ff" },
  LATE: { label: "En retard", color: "#ff6b6b" },
  DONE: { label: "Terminée", color: "#34d1b3" },
};

const PLAN_STATUS_META: Record<
  MaintenancePlanStatus,
  { label: string; color: string }
> = {
  PLANNED: { label: "Planifié", color: "#ffb020" },
  IN_PROGRESS: { label: "En cours", color: "#4da6ff" },
  LATE: { label: "En retard", color: "#ff6b6b" },
  DONE: { label: "Terminé", color: "#34d1b3" },
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
function StatusGauge({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const cx = 110;
  const cy = 110;
  const radius = 88;
  const strokeWidth = 30;
  const pathLength = Math.PI * radius; // demi-circonférence

  let cumulative = 0;

  const arcs = segments.map((segment) => {
    if (segment.value === 0 || total === 0) {
      return { ...segment, dash: 0, offset: pathLength, midAngle: 0, fraction: 0 };
    }

    const fraction = segment.value / total;
    const dash = fraction * pathLength;
    const offset = pathLength - (cumulative / total) * pathLength;
    const midAngleDeg = 180 - ((cumulative + segment.value / 2) / total) * 180;

    cumulative += segment.value;

    return { ...segment, dash, offset, midAngle: midAngleDeg, fraction };
  });

  return (
    <div className="dashboard-gauge-wrap">
      <svg viewBox="0 0 220 150" className="dashboard-gauge-svg">
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#eef2f6"
          strokeWidth={strokeWidth}
        />
        {arcs.map((arc) =>
          arc.dash > 0 ? (
            <path
              key={arc.label}
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.dash} ${pathLength - arc.dash}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="butt"
            />
          ) : null,
        )}
        {arcs.map((arc) => {
          if (arc.fraction < 0.04) return null;

          const angleRad = (arc.midAngle * Math.PI) / 180;
          const labelRadius = radius;
          const x = cx + labelRadius * Math.cos(angleRad);
          const y = cy - labelRadius * Math.sin(angleRad);

          return (
            <text
              key={`${arc.label}-label`}
              x={x}
              y={y}
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

  const width = Math.max(620, items.length * 86);
  const height = 220;
  const padding = 34;
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const stepX = items.length > 1 ? (width - padding * 2) / (items.length - 1) : 0;
  const lineColor = items[0]?.color ?? "#4da6ff";

  const coords = items.map((item, index) => ({
    x: items.length > 1 ? padding + index * stepX : width / 2,
    y: height - padding - (item.value / maxValue) * (height - padding * 1.7),
    item,
  }));

  const linePath = buildSmoothPath(coords);
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`
      : "";

  return (
    <div className="curve-chart-scroll">
      <svg viewBox={`0 0 ${width} ${height}`} className="curve-chart-svg" style={{ minWidth: width }}>
        {areaPath && <path d={areaPath} fill={lineColor} opacity={0.16} stroke="none" />}
        {linePath && <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.5} />}

        {coords.map((coord, index) => (
          <circle
            key={`dot-${index}`}
            cx={coord.x}
            cy={coord.y}
            r={4}
            fill="#ffffff"
            stroke={lineColor}
            strokeWidth={2}
          />
        ))}

        {coords.map((coord, index) => (
          <text key={`val-${index}`} x={coord.x} y={coord.y - 12} textAnchor="middle" className="curve-chart-value">
            {coord.item.value}
            {coord.item.suffix ?? ""}
          </text>
        ))}

        {coords.map((coord, index) => (
          <text key={`lbl-${index}`} x={coord.x} y={height - 10} textAnchor="middle" className="curve-chart-axis-label">
            {coord.item.label.length > 14 ? `${coord.item.label.slice(0, 13)}…` : coord.item.label}
          </text>
        ))}
      </svg>
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

  const width = Math.max(680, items.length * 92);
  const height = 260;
  const padding = 36;
  const segmentCount = items[0]?.segments.length ?? 0;
  const maxTotal = Math.max(
    ...items.map((item) => item.segments.reduce((sum, s) => sum + s.value, 0)),
    1,
  );
  const stepX = items.length > 1 ? (width - padding * 2) / (items.length - 1) : 0;

  const xFor = (index: number) => (items.length > 1 ? padding + index * stepX : width / 2);
  const yFor = (value: number) => height - padding - (value / maxTotal) * (height - padding * 1.6);

  // cumulative[s][i] = somme des segments 0..s pour l'item i
  const cumulative: number[][] = Array.from({ length: segmentCount }, () => []);
  items.forEach((item, i) => {
    let running = 0;
    item.segments.forEach((segment, s) => {
      running += segment.value;
      cumulative[s][i] = running;
    });
  });

  return (
    <div className="stacked-area-scroll">
      <svg viewBox={`0 0 ${width} ${height}`} className="stacked-area-svg" style={{ minWidth: width }}>
        {Array.from({ length: segmentCount }).map((_, s) => {
          const color = items[0]?.segments[s]?.color ?? "#4da6ff";

          const topPoints = items.map((_, i) => ({ x: xFor(i), y: yFor(cumulative[s][i]) }));
          const bottomPoints = items
            .map((_, i) => ({ x: xFor(i), y: yFor(s === 0 ? 0 : cumulative[s - 1][i]) }))
            .reverse();

          const topPath = buildSmoothPath(topPoints);
          const bottomPath = buildSmoothPath(bottomPoints).replace("M", "L");
          const areaPath = `${topPath} ${bottomPath} Z`;

          return (
            <g key={s}>
              <path d={areaPath} fill={color} opacity={0.5} stroke="none" />
              <path d={topPath} fill="none" stroke={color} strokeWidth={2} />
            </g>
          );
        })}

        {items.map((item, i) => (
          <text key={item.label} x={xFor(i)} y={height - 10} textAnchor="middle" className="stacked-area-axis-label">
            {item.label.length > 14 ? `${item.label.slice(0, 13)}…` : item.label}
          </text>
        ))}
      </svg>
    </div>
  );
}


type AnalysisDimension = "users" | "tags" | "costCenters" | "equipment";

const ANALYSIS_STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  PLANNED: { label: "Planifiée", color: "#9fb0c3" },
  IN_PROGRESS: { label: "En cours", color: "#4da6ff" },
  LATE: { label: "En retard", color: "#ff6b6b" },
  DONE: { label: "Terminée", color: "#34d1b3" },
};

/**
 * Aire empilée en courbes lissées pour l'analyse par dimension
 * (utilisateurs / tags / centres de coût / équipements) — remplace
 * les anciennes barres empilées verticales.
 */
function TaskAnalysisChart({ items }: { items: StackedBarItem[] }) {
  if (items.length === 0) {
    return <p className="dashboard-empty-hint">Aucune donnée disponible.</p>;
  }

  const width = Math.max(900, items.length * 130);
  const height = 380;
  const padding = 42;
  const segmentCount = items[0]?.segments.length ?? 0;
  const maxTotal = Math.max(
    ...items.map((item) => item.segments.reduce((sum, segment) => sum + segment.value, 0)),
    1,
  );
  const stepX = items.length > 1 ? (width - padding * 2) / (items.length - 1) : 0;

  const xFor = (index: number) => (items.length > 1 ? padding + index * stepX : width / 2);
  const yFor = (value: number) => height - padding - (value / maxTotal) * (height - padding * 1.5);

  const cumulative: number[][] = Array.from({ length: segmentCount }, () => []);
  items.forEach((item, i) => {
    let running = 0;
    item.segments.forEach((segment, s) => {
      running += segment.value;
      cumulative[s][i] = running;
    });
  });

  return (
    <div className="task-analysis-chart-scroll">
      <div className="task-analysis-chart" style={{ minWidth: `${width}px` }}>
        <div className="task-analysis-grid-lines" aria-hidden="true" />

        <svg viewBox={`0 0 ${width} ${height}`} className="task-analysis-svg" style={{ minWidth: width }}>
          {Array.from({ length: segmentCount }).map((_, s) => {
            const color = items[0]?.segments[s]?.color ?? "#4da6ff";

            const topPoints = items.map((_, i) => ({ x: xFor(i), y: yFor(cumulative[s][i]) }));
            const bottomPoints = items
              .map((_, i) => ({ x: xFor(i), y: yFor(s === 0 ? 0 : cumulative[s - 1][i]) }))
              .reverse();

            const topPath = buildSmoothPath(topPoints);
            const bottomPath = buildSmoothPath(bottomPoints).replace("M", "L");
            const areaPath = `${topPath} ${bottomPath} Z`;

            return (
              <g key={s}>
                <path d={areaPath} fill={color} opacity={0.5} stroke="none" />
                <path d={topPath} fill="none" stroke={color} strokeWidth={2.2} />
              </g>
            );
          })}

          {items.map((item, i) => (
            <text
              key={item.label}
              x={xFor(i)}
              y={height - 14}
              textAnchor="middle"
              className="task-analysis-axis-label-svg"
            >
              {item.label.length > 16 ? `${item.label.slice(0, 15)}…` : item.label}
            </text>
          ))}
        </svg>
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

  const linePath = coordinates
    .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`)
    .join(" ");

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
  items,
  firstColumnTitle = "Nom",
  showId = false,
  valueType = "number",
  onOpen,
}: RankingTableProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="dashboard-ranking-card">
      <h2>{title}</h2>

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

  const [equipmentCount, setEquipmentCount] = useState(0);
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
      PLANNED: 0,
      IN_PROGRESS: 0,
      LATE: 0,
      DONE: 0,
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
      { minutes: number; cost: number; activityCount: number }
    >();

    activities.forEach((activity) => {
      const key = activity.equipmentName?.trim() || "Sans équipement";
      const current = map.get(key) ?? {
        minutes: 0,
        cost: 0,
        activityCount: 0,
      };

      current.minutes += activitySpentMinutes(activity);
      current.cost += activityCost(activity);
      current.activityCount += 1;

      map.set(key, current);
    });

    return map;
  }, [activities]);

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
          map.get(key) ?? { PLANNED: 0, IN_PROGRESS: 0, LATE: 0, DONE: 0 };
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
      title: "Coût moyen / activité",
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
      title: "Tâches en retard",
      displayValue: String(lateTasksCount),
      icon: <AlertTriangle size={26} />,
    },
    {
      title: "Taux de complétion",
      displayValue: `${completionRate}%`,
      icon: <Gauge size={26} />,
    },
    {
      title: "Pièces en stock bas",
      displayValue: String(lowStockItems.length),
      icon: <PackageSearch size={26} />,
    },
  ];

  const heroKpis = [
    {
      title: "Tâches",
      value: loading ? "…" : String(tasks.length),
      icon: <Wrench size={28} />,
      className: "dashboard-hero-card-tasks",
    },
    {
      title: "Activités",
      value: loading ? "…" : String(activities.length),
      icon: <ActivityIcon size={28} />,
      className: "dashboard-hero-card-activities",
    },
    {
      title: "Temps passé",
      value: loading ? "…" : formatHoursMinutes(totalSpentMinutes),
      icon: <Clock size={28} />,
      className: "dashboard-hero-card-time",
    },
    {
      title: "Temps moyen d'intervention",
      value: loading ? "…" : formatHoursMinutes(averageMinutesPerActivity),
      icon: <Gauge size={28} />,
      className: "dashboard-hero-card-avg",
    },
  ];

  const resourceCards: DashboardCard[] = [
    { title: "Équipements", value: equipmentCount, icon: <Wrench size={22} /> },
    { title: "Pièces de rechange", value: spareParts.length, icon: <Boxes size={22} /> },
    { title: "Équipes", value: teamsCount, icon: <Users size={22} /> },
    { title: "Plans de maintenance", value: plans.length, icon: <CalendarCheck size={22} /> },
    { title: "Commandes d'achat", value: purchaseOrdersCount, icon: <ShoppingCart size={22} /> },
  ];

  return (
    <section className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <span className="section-label">Tableau de bord</span>
          <h1>Bienvenue, Administrateur</h1>
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
        <div className="dashboard-charts-grid">
          <article className="dashboard-gauge-card">
            <h2>Tâches par statut</h2>

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

          <article className="dashboard-chart-card">
            <h2>Plans de maintenance par statut</h2>
            <DonutChart segments={planStatusSegments} />
          </article>

          <article className="dashboard-chart-card dashboard-chart-card-wide">
            <h2>
              <Clock size={18} />
              Temps passé par machine
            </h2>
            <SimpleBarChart items={timePerMachine} />
          </article>

          <article className="dashboard-chart-card dashboard-chart-card-wide">
            <h2>
              <PiggyBank size={18} />
              Coût par machine
            </h2>
            <SimpleBarChart items={costPerMachine} />
          </article>

          <article className="dashboard-chart-card dashboard-chart-card-wide">
            <div className="dashboard-chart-card-header">
              <h2>
                <AlertTriangle size={18} />
                Pièces en stock bas
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
                Aucune pièce en dessous du stock minimum. 👍
              </p>
            ) : (
              <SimpleBarChart items={lowStockBars} />
            )}
          </article>

          <article className="dashboard-chart-card dashboard-chart-card-wide">
            <div className="dashboard-chart-card-header">
              <h2>Coût des activités (top 10)</h2>
              <span className="dashboard-total-cost">
                Total : <strong>{formatMoney(totalActivityCost)} EUR</strong>
              </span>
            </div>

            <SimpleBarChart items={topCostActivities} />
          </article>

          <div className="dashboard-ranking-wide dashboard-ranking-grid">
            <RankingTable
              title="Top 10 tâches"
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
              items={topEquipmentRanking}
              firstColumnTitle="Équipement"
              valueType="hours"
            />
          </div>

          <article className="dashboard-chart-card dashboard-chart-card-wide">
            <h2>
              <TrendingUp size={18} />
              Évolution des activités
            </h2>
            <TrendChart
              points={activityTrend}
              period={trendPeriod}
              onPeriodChange={setTrendPeriod}
            />
          </article>


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
              {(Object.keys(ANALYSIS_STATUS_META) as TaskStatus[]).map((status) => (
                <span
                  key={status}
                  style={{ backgroundColor: ANALYSIS_STATUS_META[status].color }}
                >
                  {ANALYSIS_STATUS_META[status].label}
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

          <div className="dashboard-ranking-wide dashboard-ranking-grid">
            <RankingTable
              title="Top 10 centres de coût"
              items={topCostCenters}
              firstColumnTitle="Centre de coût"
              valueType="number"
            />

            <RankingTable
              title="Top 10 utilisateurs"
              items={topUsers}
              firstColumnTitle="Utilisateur"
              valueType="number"
            />

            <RankingTable
              title="Top 10 tags"
              items={topTags}
              firstColumnTitle="Tag"
              valueType="number"
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default DashboardPage;