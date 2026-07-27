import {
  Activity,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";
import { Outlet } from "react-router-dom";

import AdminNavbar from "../components/admin/AdminNavbar";

function TechnicianLayout() {
  return (
    <div className="admin-layout">
      <AdminNavbar
        workspaceLabel="Espace technicien"
        profileLabel="Technicien"
        homePath="/technician/tasks"
        profilePath="/technician/profile"
        showNotifications={false}
        navigationItems={[
          {
            label: "Taches",
            path: "/technician/tasks",
            description: "Gestion des taches de maintenance",
            icon: <ClipboardList size={20} />,
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
