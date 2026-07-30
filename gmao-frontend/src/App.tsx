import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import OperatorLayout from "./layouts/OperatorLayout";
import TechnicianLayout from "./layouts/TechnicianLayout";
import ProviderLayout from "./layouts/ProviderLayout";
import TaskListPage from "./pages/admin/TaskListPage";
import TaskDetailsPage from "./pages/admin/TaskDetailsPage";
import TaskCreatePage from "./pages/admin/TaskCreatePage";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

import ProfilePage from "./pages/ProfilePage";

import UsinesPage from "./pages/admin/UsinesPage";
import UsineDetailPage from "./pages/admin/UsineDetailPage";

import DashboardPage from "./pages/admin/DashboardPage";
import NotificationsPage from "./pages/admin/NotificationsPage";

import EquipmentPage from "./pages/admin/EquipmentPage";
import EquipmentDetailsPage from "./pages/admin/EquipmentDetailsPage";

import TagsPage from "./pages/admin/TagsPage";

import MeasuresPage from "./pages/admin/MeasuresPage";
import UnitsPage from "./pages/admin/UnitsPage";
import UnitFormPage from "./pages/admin/UnitFormPage";

import SuppliersPage from "./pages/admin/SuppliersPage";
import SupplierFormPage from "./pages/admin/SupplierFormPage";
import SupplierDetailsPage from "./pages/admin/SupplierDetailsPage";
import SupplierCatalogPage from "./pages/admin/SupplierCatalogPage";

import SparePartsPage from "./pages/admin/SparePartsPage";
import SparePartFormPage from "./pages/admin/SparePartFormPage";
import SparePartDetailsPage from "./pages/admin/SparePartDetailsPage";
import MovementHistoryPage from "./pages/admin/MovementHistoryPage";

import ActivitiesPage from "./pages/admin/ActivitiesPage";
import ActivityFormPage from "./pages/admin/ActivityFormPage";

import MaintenancePlansPage from "./pages/admin/MaintenancePlansPage";
import MaintenancePlansCalendarPage from "./pages/admin/MaintenancePlansCalendarPage";
import MaintenancePlanDetailsPage from "./pages/admin/MaintenancePlanDetailsPage";
import MaintenancePlanFormPage from "./pages/admin/MaintenancePlanFormPage";

import TeamsPage from "./pages/admin/TeamsPage";
import InviteColleaguePage from "./pages/admin/InviteColleaguePage";
import CreateTeamPage from "./pages/admin/CreateTeamPage";
import PurchaseOrdersPage from "./pages/admin/PurchaseOrdersPage";
import PurchaseOrderCreatePage from "./pages/admin/PurchaseOrderCreatePage";
import PurchaseOrderDetailsPage from "./pages/admin/PurchaseOrderDetailsPage";
import OperatorCreateTaskPage from "./pages/operator/OperatorCreateTaskPage";
import OperatorDashboardPage from "./pages/operator/OperatorDashboardPage";
import OperatorTaskDetailsPage from "./pages/operator/OperatorTaskDetailsPage";
import OperatorTasksPage from "./pages/operator/OperatorTasksPage";

import TechnicianDashboardPage from "./pages/technician/TechnicianDashboardPage";
import TechnicianTasksPage from "./pages/technician/TechnicianTasksPage";
import TechnicianTaskDetailsPage from "./pages/technician/TechnicianTaskDetailsPage";
import TechnicianCreatedTasksPage from "./pages/technician/TechnicianCreatedTasksPage";
import TechnicianCreateTaskPage from "./pages/technician/TechnicianCreateTaskPage";
import TechnicianCreatedTaskDetailsPage from "./pages/technician/TechnicianCreatedTaskDetailsPage";
import TechnicianActivitiesPage from "./pages/technician/TechnicianActivitiesPage";
import TechnicianActivityFormPage from "./pages/technician/TechnicianActivityFormPage";
import TechnicianMaintenancePlansPage from "./pages/technician/TechnicianMaintenancePlansPage";
import TechnicianMaintenancePlansCalendarPage from "./pages/technician/TechnicianMaintenancePlansCalendarPage";
import TechnicianMaintenancePlanDetailsPage from "./pages/technician/TechnicianMaintenancePlanDetailsPage";

import ProviderDashboardPage from "./pages/provider/ProviderDashboardPage";
import ProviderTasksPage from "./pages/provider/ProviderTasksPage";
import ProviderTaskDetailsPage from "./pages/provider/ProviderTaskDetailsPage";
import ProviderCreatedTasksPage from "./pages/provider/ProviderCreatedTasksPage";
import ProviderCreateTaskPage from "./pages/provider/ProviderCreateTaskPage";
import ProviderCreatedTaskDetailsPage from "./pages/provider/ProviderCreatedTaskDetailsPage";
import ProviderActivitiesPage from "./pages/provider/ProviderActivitiesPage";
import ProviderActivityFormPage from "./pages/provider/ProviderActivityFormPage";
import ProviderMaintenancePlansPage from "./pages/provider/ProviderMaintenancePlansPage";
import ProviderMaintenancePlansCalendarPage from "./pages/provider/ProviderMaintenancePlansCalendarPage";
import ProviderMaintenancePlanDetailsPage from "./pages/provider/ProviderMaintenancePlanDetailsPage";

import { getAuthenticatedRole } from "./services/authService";

function DashboardRedirect() {
  const role = getAuthenticatedRole();

  const target =
    role === "PRODUCTION"
      ? "/operator"
      : role === "TECHNICIAN"
        ? "/technician"
        : role === "SERVICE_PROVIDER"
          ? "/provider"
          : "/admin/dashboard";

  return <Navigate to={target} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<HomePage />} />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Routes administrateur protégées */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN", "SUPERVISOR"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          {/* Dashboard */}
          <Route
            path="dashboard"
            element={<DashboardPage />}
          />

          {/* Usines (SUPERADMIN) */}
          <Route
            path="usines"
            element={<UsinesPage />}
          />

          <Route
            path="usines/:id"
            element={<UsineDetailPage />}
          />

          {/* Tâches */}
          <Route
            path="tasks"
            element={<TaskListPage />}
          />

          <Route
            path="tasks/new"
            element={<TaskCreatePage />}
          />

          <Route
            path="tasks/:id"
            element={<TaskDetailsPage />}
          />

          {/* Équipements */}
          <Route
            path="equipment"
            element={<EquipmentPage />}
          />

          <Route
            path="equipment/:id"
            element={<EquipmentDetailsPage />}
          />

          {/* Pièces de rechange */}
          <Route
            path="spare-parts"
            element={<SparePartsPage />}
          />

          <Route
            path="stock-movements"
            element={<MovementHistoryPage />}
          />

          <Route
            path="spare-parts/create"
            element={<SparePartFormPage />}
          />

          <Route
            path="spare-parts/:id"
            element={<SparePartDetailsPage />}
          />

          <Route
            path="spare-parts/:id/edit"
            element={<SparePartFormPage />}
          />

          {/* Tags */}
          <Route
            path="tags"
            element={<TagsPage />}
          />

          {/* Mesures */}
          <Route
            path="measures"
            element={<MeasuresPage />}
          />

          {/* Unités */}
          <Route
            path="units"
            element={<UnitsPage />}
          />

          <Route
            path="units/create"
            element={<UnitFormPage />}
          />

          <Route
            path="units/:id/edit"
            element={<UnitFormPage />}
          />

          {/* Fournisseurs */}
          <Route
            path="suppliers"
            element={<SuppliersPage />}
          />

          <Route
            path="suppliers/create"
            element={<SupplierFormPage />}
          />

          <Route
            path="suppliers/:id"
            element={<SupplierDetailsPage />}
          />

          <Route
            path="suppliers/:id/edit"
            element={<SupplierFormPage />}
          />

          <Route
  path="activities"
  element={<ActivitiesPage />}
/>

<Route
  path="activities/create"
  element={<ActivityFormPage />}
/>
          <Route path="maintenance-plans" element={<MaintenancePlansPage />} />
<Route path="maintenance-plans/calendar" element={<MaintenancePlansCalendarPage />} />
<Route path="maintenance-plans/new" element={<MaintenancePlanFormPage />} />
<Route path="maintenance-plans/:id" element={<MaintenancePlanDetailsPage />} />
<Route path="maintenance-plans/:id/edit" element={<MaintenancePlanFormPage />} />

          <Route
            path="supplier-catalog"
            element={
              <SupplierCatalogPage />}
          />

          <Route
            path="purchase-orders"
            element={<PurchaseOrdersPage />}
          />

          <Route
            path="purchase-orders/create"
            element={<PurchaseOrderCreatePage />}
          />

          <Route
            path="purchase-orders/:id"
            element={<PurchaseOrderDetailsPage />}
          />

          <Route
            path="teams"
            element={
              getAuthenticatedRole() === "SUPERVISOR" ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <TeamsPage />
              )
            }
          />

          <Route
            path="teams/invite"
            element={
              getAuthenticatedRole() === "SUPERVISOR" ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <InviteColleaguePage />
              )
            }
          />

          <Route
            path="teams/colleagues/:id/edit"
            element={
              getAuthenticatedRole() === "SUPERVISOR" ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <InviteColleaguePage />
              )
            }
          />

          <Route
            path="teams/new"
            element={
              getAuthenticatedRole() === "SUPERVISOR" ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <CreateTeamPage />
              )
            }
          />

          <Route
            path="teams/:id/edit"
            element={
              getAuthenticatedRole() === "SUPERVISOR" ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <CreateTeamPage />
              )
            }
          />

          <Route
            path="notifications"
            element={<NotificationsPage />}
          />

          <Route
            path="profile"
            element={<ProfilePage />}
          />

          {/* Route inconnue dans /admin */}
          <Route
            path="*"
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />
        </Route>

        <Route
          path="/operator"
          element={
            <ProtectedRoute allowedRoles={["PRODUCTION"]}>
              <OperatorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OperatorDashboardPage />} />
          <Route path="tasks" element={<OperatorTasksPage />} />
          <Route path="tasks/new" element={<OperatorCreateTaskPage />} />
          <Route path="tasks/:id" element={<OperatorTaskDetailsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/operator" replace />} />
        </Route>

        {/* Routes techniciens protégées */}
        <Route
          path="/technician"
          element={
            <ProtectedRoute allowedRoles={["TECHNICIAN"]}>
              <TechnicianLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TechnicianDashboardPage />} />
          <Route path="tasks" element={<TechnicianTasksPage />} />
          <Route path="tasks/:id" element={<TechnicianTaskDetailsPage />} />
          <Route path="created-tasks" element={<TechnicianCreatedTasksPage />} />
          <Route path="created-tasks/new" element={<TechnicianCreateTaskPage />} />
          <Route
            path="created-tasks/:id"
            element={<TechnicianCreatedTaskDetailsPage />}
          />
          <Route path="activities" element={<TechnicianActivitiesPage />} />
          <Route path="activities/create" element={<TechnicianActivityFormPage />} />
          <Route
            path="maintenance-plans"
            element={<TechnicianMaintenancePlansPage />}
          />
          <Route
            path="maintenance-plans/calendar"
            element={<TechnicianMaintenancePlansCalendarPage />}
          />
          <Route
            path="maintenance-plans/:id"
            element={<TechnicianMaintenancePlanDetailsPage />}
          />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/technician" replace />} />
        </Route>

        {/* Routes prestataires protégées */}
        <Route
          path="/provider"
          element={
            <ProtectedRoute allowedRoles={["SERVICE_PROVIDER"]}>
              <ProviderLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProviderDashboardPage />} />
          <Route path="tasks" element={<ProviderTasksPage />} />
          <Route path="tasks/:id" element={<ProviderTaskDetailsPage />} />
          <Route path="created-tasks" element={<ProviderCreatedTasksPage />} />
          <Route path="created-tasks/new" element={<ProviderCreateTaskPage />} />
          <Route
            path="created-tasks/:id"
            element={<ProviderCreatedTaskDetailsPage />}
          />
          <Route path="activities" element={<ProviderActivitiesPage />} />
          <Route path="activities/create" element={<ProviderActivityFormPage />} />
          <Route path="maintenance-plans" element={<ProviderMaintenancePlansPage />} />
          <Route
            path="maintenance-plans/calendar"
            element={<ProviderMaintenancePlansCalendarPage />}
          />
          <Route
            path="maintenance-plans/:id"
            element={<ProviderMaintenancePlanDetailsPage />}
          />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/provider" replace />} />
        </Route>

        {/* Ancienne route dashboard */}
        <Route
          path="/dashboard"
          element={<DashboardRedirect />}
        />

        {/* Route générale inconnue */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
