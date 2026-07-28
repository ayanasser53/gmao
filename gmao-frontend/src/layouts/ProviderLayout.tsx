import {
  Activity,
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";
import { Outlet } from "react-router-dom";

import AdminNavbar from "../components/admin/AdminNavbar";

function ProviderLayout() {
  return (
    <div className="admin-layout">
      <AdminNavbar
        workspaceLabel="Espace prestataire"
        profileLabel="Prestataire"
        homePath="/provider"
        profilePath="/provider/profile"
        showNotifications={false}
        navigationItems={[
          {
            label: "Dashboard",
            path: "/provider",
            description: "Vue generale de vos interventions",
            icon: <LayoutDashboard size={20} />,
          },
          {
            label: "Mes taches",
            path: "/provider/tasks",
            description: "Taches qui vous sont affectees",
            icon: <ClipboardList size={20} />,
          },
          {
            label: "Activites",
            path: "/provider/activities",
            description: "Interventions que vous avez realisees",
            icon: <Activity size={20} />,
          },
          {
            label: "Plans de maintenance",
            path: "/provider/maintenance-plans",
            description: "Plans de maintenance qui vous sont affectes",
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

export default ProviderLayout;
