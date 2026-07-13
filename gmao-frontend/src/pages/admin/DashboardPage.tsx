import type { ReactNode } from "react";

import {
  Activity,
  Boxes,
  CalendarCheck,
  ClipboardList,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";

import {
  getAuthenticatedEmail,
  getAuthenticatedRole,
} from "../../services/authService";

interface DashboardCard {
  title: string;
  value: number;
  icon: ReactNode;
}

function DashboardPage() {
  const email = getAuthenticatedEmail();
  const role = getAuthenticatedRole();

  const cards: DashboardCard[] = [
    {
      title: "Équipements",
      value: 0,
      icon: <Wrench size={30} />,
    },
    {
      title: "Tâches en cours",
      value: 0,
      icon: <ClipboardList size={30} />,
    },
    {
      title: "Activités",
      value: 0,
      icon: <Activity size={30} />,
    },
    {
      title: "Pièces de rechange",
      value: 0,
      icon: <Boxes size={30} />,
    },
    {
      title: "Équipes",
      value: 0,
      icon: <Users size={30} />,
    },
    {
      title: "Plans de maintenance",
      value: 0,
      icon: <CalendarCheck size={30} />,
    },
    {
      title: "Commandes d’achat",
      value: 0,
      icon: <ShoppingCart size={30} />,
    },
  ];

  return (
    <section className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <span className="section-label">
            Tableau de bord
          </span>

          <h1>Bienvenue, Administrateur</h1>

          <p>
            {email} — {role}
          </p>
        </div>
      </div>

      <div className="dashboard-cards">
        {cards.map((card) => (
          <article className="dashboard-card" key={card.title}>
            <div className="dashboard-card-icon">
              {card.icon}
            </div>

            <span>{card.title}</span>

            <strong>{card.value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DashboardPage;