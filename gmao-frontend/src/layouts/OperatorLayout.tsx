import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  UserCircle,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { getAuthenticatedEmail, logout } from "../services/authService";

function OperatorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const email = getAuthenticatedEmail();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const topbarTitle = location.pathname === "/operator/profile"
    ? "Mon profil"
    : location.pathname.startsWith("/operator/tasks")
    ? "Mes taches"
    : "Dashboard";

  const topbarDescription = location.pathname === "/operator/profile"
    ? "Gerez vos informations personnelles"
    : location.pathname === "/operator/tasks/new"
    ? "Creation d'une tache de maintenance"
    : location.pathname.startsWith("/operator/tasks")
      ? "Liste de vos taches"
      : "Vue generale de vos taches";

  function handleLogout(): void {
    logout();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  return (
    <div className="admin-layout operator-admin-layout">
      <header className="admin-topbar">
        <div className="admin-current-module">
          <span className="admin-current-module-label">Espace operateur</span>

          <div className="admin-current-module-row">
            <strong>{topbarTitle}</strong>
            <span>{topbarDescription}</span>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <div className="profile-menu-container" ref={profileMenuRef}>
            <button
              type="button"
              className="admin-profile-button"
              onClick={() => setProfileMenuOpen((current) => !current)}
            >
              <div className="admin-avatar">
                <UserCircle size={25} />
              </div>

              <div className="admin-profile-summary">
                <strong>Operateur</strong>
                <span>{email}</span>
              </div>
            </button>

            {profileMenuOpen && (
              <div className="admin-profile-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/operator/profile");
                    setProfileMenuOpen(false);
                  }}
                >
                  <UserCircle size={18} />
                  Mon profil
                </button>

                <button
                  type="button"
                  className="dropdown-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Deconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className="admin-sidebar operator-admin-sidebar">
        <div className="admin-sidebar-header">
          <NavLink to="/operator" className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">
              <Wrench size={25} strokeWidth={2.4} />
            </div>

            <div className="admin-sidebar-brand-name">
              <span className="admin-brand-dark">Smart</span>
              <span className="admin-brand-blue">Maint</span>
            </div>
          </NavLink>
        </div>

        <nav className="admin-sidebar-navigation" aria-label="Navigation operateur">
          <NavLink
            to="/operator"
            end
            className={({ isActive }) =>
              [
                "admin-sidebar-link",
                isActive ? "admin-sidebar-link-active" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span className="admin-sidebar-link-icon">
              <LayoutDashboard size={20} />
            </span>
            <span className="admin-sidebar-link-label">Dashboard</span>
          </NavLink>

          <NavLink
            to="/operator/tasks"
            className={({ isActive }) =>
              [
                "admin-sidebar-link",
                isActive ? "admin-sidebar-link-active" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
          >
            <span className="admin-sidebar-link-icon">
              <ClipboardList size={20} />
            </span>
            <span className="admin-sidebar-link-label">Mes taches</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <span>SmartMaint</span>
          <small>Gestion de maintenance</small>
        </div>
      </aside>

      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default OperatorLayout;
