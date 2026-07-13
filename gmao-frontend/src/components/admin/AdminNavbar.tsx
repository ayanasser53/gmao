import {
  Activity,
  Bell,
  BookOpen,
  Boxes,
  Building2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Ruler,
  ShoppingCart,
  Tag,
  UserCircle,
  Users,
  Wrench,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getAuthenticatedEmail,
  logout,
} from "../../services/authService";

interface NavigationItem {
  label: string;
  path: string;
  description: string;
  icon: ReactNode;
}

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const [sidebarOpen, setSidebarOpen] =
    useState<boolean>(false);

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState<boolean>(false);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState<boolean>(false);

  const notificationCount = 3;
  const email = getAuthenticatedEmail();

  const navigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      description: "Vue générale de votre maintenance",
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: "Équipements",
      path: "/admin/equipment",
      description: "Gestion des équipements",
      icon: <Wrench size={20} />,
    },
    {
      label: "Pièces de rechange",
      path: "/admin/spare-parts",
      description: "Gestion du stock des pièces",
      icon: <Boxes size={20} />,
    },
    {
      label: "Tâches",
      path: "/admin/tasks",
      description: "Gestion des tâches de maintenance",
      icon: <ClipboardList size={20} />,
    },
    {
      label: "Activités",
      path: "/admin/activities",
      description: "Suivi des activités réalisées",
      icon: <Activity size={20} />,
    },
    {
      label: "Plans de maintenance",
      path: "/admin/maintenance-plans",
      description: "Planification de la maintenance préventive",
      icon: <CalendarCheck size={20} />,
    },
    {
      label: "Mesures",
      path: "/admin/measures",
      description: "Gestion des types de mesures",
      icon: <Ruler size={20} />,
    },
    {
      label: "Tags",
      path: "/admin/tags",
      description: "Organisation des données par tags",
      icon: <Tag size={20} />,
    },
    {
      label: "Fournisseurs",
      path: "/admin/suppliers",
      description: "Gestion des fournisseurs",
      icon: <Building2 size={20} />,
    },
    {
      label: "Catalogue fournisseurs",
      path: "/admin/supplier-catalog",
      description: "Consultation du catalogue fournisseur",
      icon: <BookOpen size={20} />,
    },
    {
      label: "Commandes d’achat",
      path: "/admin/purchase-orders",
      description: "Gestion des commandes d’achat",
      icon: <ShoppingCart size={20} />,
    },
    {
      label: "Équipes",
      path: "/admin/teams",
      description: "Gestion des équipes et collègues",
      icon: <Users size={20} />,
    },
  ];

  const activeNavigationItem =
    navigationItems
      .filter((item) =>
        location.pathname.startsWith(item.path),
      )
      .sort(
        (firstItem, secondItem) =>
          secondItem.path.length - firstItem.path.length,
      )[0];

  const topbarTitle =
    location.pathname === "/admin/notifications"
      ? "Notifications"
      : location.pathname === "/admin/profile"
        ? "Mon profil"
        : activeNavigationItem?.label ?? "Espace administrateur";

  const topbarDescription =
    location.pathname === "/admin/notifications"
      ? "Consultez les dernières alertes"
      : location.pathname === "/admin/profile"
        ? "Gérez vos informations personnelles"
        : activeNavigationItem?.description ??
          "Administration de SmartMaint";

  function handleLogout(): void {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  function closeMobileSidebar(): void {
    setSidebarOpen(false);
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(
          event.target as Node,
        )
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  return (
    <>
      <header
        className={`admin-topbar ${
          sidebarCollapsed
            ? "admin-topbar-collapsed"
            : ""
        }`}
      >
        <button
          type="button"
          className="admin-mobile-toggle"
          onClick={() =>
            setSidebarOpen(
              (previousValue) => !previousValue,
            )
          }
          aria-label="Ouvrir le menu"
        >
          {sidebarOpen ? (
            <X size={23} />
          ) : (
            <Menu size={23} />
          )}
        </button>

        <div className="admin-current-module">
          <span className="admin-current-module-label">
            Espace administrateur
          </span>

          <div className="admin-current-module-row">
            <strong>{topbarTitle}</strong>

            <span>{topbarDescription}</span>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <button
            type="button"
            className="notification-button"
            onClick={() =>
              navigate("/admin/notifications")
            }
            aria-label="Notifications"
          >
            <Bell size={21} />

            {notificationCount > 0 && (
              <span className="notification-count">
                {notificationCount}
              </span>
            )}
          </button>

          <div
            className="profile-menu-container"
            ref={profileMenuRef}
          >
            <button
              type="button"
              className="admin-profile-button"
              onClick={() =>
                setProfileMenuOpen(
                  (previousValue) => !previousValue,
                )
              }
            >
              <div className="admin-avatar">
                <UserCircle size={25} />
              </div>

              <div className="admin-profile-summary">
                <strong>Administrateur</strong>
                <span>{email}</span>
              </div>
            </button>

            {profileMenuOpen && (
              <div className="admin-profile-dropdown">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/admin/profile");
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
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside
        className={[
          "admin-sidebar",
          sidebarOpen ? "admin-sidebar-open" : "",
          sidebarCollapsed
            ? "admin-sidebar-collapsed"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="admin-sidebar-header">
          <NavLink
            to="/admin/dashboard"
            className="admin-sidebar-brand"
            onClick={closeMobileSidebar}
          >
            <div className="admin-sidebar-logo">
              <Wrench size={25} strokeWidth={2.4} />
            </div>

            {!sidebarCollapsed && (
              <div className="admin-sidebar-brand-name">
                <span className="admin-brand-dark">
                  Smart
                </span>

                <span className="admin-brand-blue">
                  Maint
                </span>
              </div>
            )}
          </NavLink>

          <button
            type="button"
            className="admin-collapse-button"
            onClick={() =>
              setSidebarCollapsed(
                (previousValue) => !previousValue,
              )
            }
            aria-label={
              sidebarCollapsed
                ? "Agrandir le menu"
                : "Réduire le menu"
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <nav className="admin-sidebar-navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileSidebar}
              title={
                sidebarCollapsed
                  ? item.label
                  : undefined
              }
              className={({ isActive }) =>
                [
                  "admin-sidebar-link",
                  isActive
                    ? "admin-sidebar-link-active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")
              }
            >
              <span className="admin-sidebar-link-icon">
                {item.icon}
              </span>

              {!sidebarCollapsed && (
                <span className="admin-sidebar-link-label">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {!sidebarCollapsed && (
            <>
              <span>SmartMaint</span>
              <small>Gestion de maintenance</small>
            </>
          )}
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={closeMobileSidebar}
          aria-label="Fermer le menu"
        />
      )}
    </>
  );
}

export default AdminNavbar;