import { Navigate, Outlet, useLocation } from "react-router-dom";

import AdminNavbar from "../components/admin/AdminNavbar";
import { getAuthenticatedRole } from "../services/authService";

function AdminLayout() {
  const location = useLocation();
  const isSuperAdmin = getAuthenticatedRole() === "SUPERADMIN";

  if (isSuperAdmin && !location.pathname.startsWith("/admin/usines")) {
    return <Navigate to="/admin/usines" replace />;
  }

  return (
    <div className="admin-layout">
      <AdminNavbar />

      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;