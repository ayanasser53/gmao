import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import TaskListPage from "./pages/admin/TaskListPage";
import TaskDetailsPage from "./pages/admin/TaskDetailsPage";
import TaskCreatePage from "./pages/admin/TaskCreatePage";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import DashboardPage from "./pages/admin/DashboardPage";
import NotificationsPage from "./pages/admin/NotificationsPage";
import ModulePlaceholderPage from "./pages/admin/ModulePlaceholderPage";

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

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        {/* Routes administrateur protégées */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
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
            element={<TeamsPage />}
          />

          <Route
            path="teams/invite"
            element={<InviteColleaguePage />}
          />

          <Route
            path="teams/colleagues/:id/edit"
            element={<InviteColleaguePage />}
          />

          <Route
            path="teams/new"
            element={<CreateTeamPage />}
          />

          <Route
            path="teams/:id/edit"
            element={<CreateTeamPage />}
          />

          <Route
            path="notifications"
            element={<NotificationsPage />}
          />

          <Route
            path="profile"
            element={
              <ModulePlaceholderPage />
            }
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

        {/* Ancienne route dashboard */}
        <Route
          path="/dashboard"
          element={
            <Navigate
              to="/admin/dashboard"
              replace
            />
          }
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