import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

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

import SparePartsPage from "./pages/admin/SparePartsPage";
import SparePartFormPage from "./pages/admin/SparePartFormPage";
import SparePartDetailsPage from "./pages/admin/SparePartDetailsPage";

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

          {/* Autres modules */}
          <Route
            path="tasks"
            element={
              <ModulePlaceholderPage />
            }
          />

          <Route
            path="activities"
            element={
              <ModulePlaceholderPage />
            }
          />

          <Route
            path="maintenance-plans"
            element={
              <ModulePlaceholderPage />
            }
          />

          <Route
            path="supplier-catalog"
            element={
              <ModulePlaceholderPage />
            }
          />

          <Route
            path="purchase-orders"
            element={
              <ModulePlaceholderPage />
            }
          />

          <Route
            path="teams"
            element={
              <ModulePlaceholderPage />
            }
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