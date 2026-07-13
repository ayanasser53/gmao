import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import NotificationsPage from "./pages/admin/NotificationsPage";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TagsPage from "./pages/admin/TagsPage";

import DashboardPage from "./pages/admin/DashboardPage";
import ModulePlaceholderPage from "./pages/admin/ModulePlaceholderPage";
import MeasuresPage from "./pages/admin/MeasuresPage";
import MeasureFormPage from "./pages/admin/MeasureFormPage";
import UnitsPage from "./pages/admin/UnitsPage";
import UnitFormPage from "./pages/admin/UnitFormPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />
        

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
            element={<Navigate to="dashboard" replace />}
          />
          <Route
  path="measures"
  element={<MeasuresPage />}
/>

<Route
  path="tags"
  element={<TagsPage />}
/>

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

<Route
  path="tags"
  element={<ModulePlaceholderPage />}
/>


          <Route
            path="dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="equipment"
            element={<ModulePlaceholderPage />}
          />

          <Route
            path="spare-parts"
            element={<ModulePlaceholderPage />}
          />

          <Route
            path="tasks"
            element={<ModulePlaceholderPage />}
          />

          <Route
            path="activities"
            element={<ModulePlaceholderPage />}
          />
          <Route
  path="maintenance-plans"
  element={<ModulePlaceholderPage />}
/>

          <Route
            path="suppliers"
            element={<ModulePlaceholderPage />}
          />

          <Route
            path="supplier-catalog"
            element={<ModulePlaceholderPage />}
          />

          <Route
            path="purchase-orders"
            element={<ModulePlaceholderPage />}
          />

          <Route
            path="teams"
            element={<ModulePlaceholderPage />}
          />

         <Route
  path="notifications"
  element={<NotificationsPage />}
/>

          <Route
            path="profile"
            element={<ModulePlaceholderPage />}
          />
        </Route>

        <Route path="/dashboard" element={
          <Navigate to="/admin/dashboard" replace />
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;