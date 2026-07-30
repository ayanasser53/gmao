import {
  Activity,
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { Outlet } from "react-router-dom";

import AdminNavbar from "../components/admin/AdminNavbar";

function TechnicianLayout() {
  return (
    <div className="admin-layout">
      <AdminNavbar
        workspaceLabel="Espace technicien"
        profileLabel="Technicien"
        homePath="/technician"
        profilePath="/technician/profile"
        notificationsPath="/technician/notifications"
        navigationItems={[
          {
            label: "Dashboard",
            path: "/technician",
            description: "Vue generale de votre maintenance",
            icon: <LayoutDashboard size={20} />,
          },
          {
            label: "Taches creees",
            path: "/technician/created-tasks",
            description: "Taches que vous avez signalees",
            icon: <ClipboardList size={20} />,
          },
          {
            label: "Taches assignees",
            path: "/technician/tasks",
            description: "Gestion des taches de maintenance qui vous sont affectees",
            icon: <Users size={20} />,
          },
          {
            label: "Activites",
            path: "/technician/activities",
            description: "Suivi des activites realisees",
            icon: <Activity size={20} />,
          },
          {
            label: "Plans de maintenance",
            path: "/technician/maintenance-plans",
            description: "Planification de la maintenance preventive",
            icon: <CalendarCheck size={20} />,
          },
        ]}
      />

      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default TechnicianLayout;
