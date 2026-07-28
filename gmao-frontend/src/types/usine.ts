export interface Usine {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  userCount: number;
  createdAt: string;
}

export interface UsineRequest {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UsineStats {
  userCount: number;
  equipmentCount: number;
  taskCount: number;
  sparePartCount: number;
  teamCount: number;
  maintenancePlanCount: number;
}

export interface UsineAdminSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
}

export interface UsineDashboard {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
  stats: UsineStats;
  admins: UsineAdminSummary[];
}

export interface UsineSummaryStats {
  id: number;
  name: string;
  active: boolean;
  userCount: number;
  equipmentCount: number;
  taskCount: number;
}

export interface UsineGlobalDashboard {
  totalUsines: number;
  activeUsines: number;
  totalUsers: number;
  totalEquipment: number;
  totalTasks: number;
  totalSpareParts: number;
  totalTeams: number;
  totalMaintenancePlans: number;
  perUsine: UsineSummaryStats[];
}