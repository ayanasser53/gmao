import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Building2, LogOut, Wrench } from "lucide-react";

import AdminNavbar from "../components/admin/AdminNavbar";
import { getAuthenticatedRole } from "../services/authService";
import {
  clearImpersonatedUsine,
  getImpersonatedUsine,
} from "../services/impersonation";

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = getAuthenticatedRole() === "SUPERADMIN";
  const impersonatedUsine = isSuperAdmin ? getImpersonatedUsine() : null;
  const isOnUsinesArea = location.pathname.startsWith("/admin/usines");
  const isOnOwnProfile = location.pathname === "/admin/profile";

  function handleExitImpersonation(): void {
    clearImpersonatedUsine();
    navigate("/admin/usines");
  }

  // Un SUPERADMIN qui consulte le dashboard d'une usine ("Voir le
  // dashboard") ne doit voir ni la barre latérale ni le menu admin :
  // uniquement la page du tableau de bord, avec un moyen simple de revenir
  // à la gestion des usines.
  if (isSuperAdmin && impersonatedUsine) {
    if (!location.pathname.startsWith("/admin/dashboard")) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return (
      <div className="impersonation-only-layout">
        <header className="impersonation-only-topbar">
          <div className="impersonation-only-brand">
            <Wrench size={22} strokeWidth={2.4} />
            <span>
              <span className="admin-brand-dark">Smart</span>
              <span className="admin-brand-blue">Maint</span>
            </span>
          </div>

          <div className="impersonation-banner-text">
            <Building2 size={16} />
            Tableau de bord de <strong>{impersonatedUsine.name}</strong>
          </div>

          <button
            type="button"
            className="impersonation-banner-exit"
            onClick={handleExitImpersonation}
          >
            <LogOut size={14} />
            Quitter la vue
          </button>
        </header>

        <main className="impersonation-only-content">
          <Outlet />
        </main>
      </div>
    );
  }

  if (isSuperAdmin && !isOnUsinesArea && !isOnOwnProfile) {
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
