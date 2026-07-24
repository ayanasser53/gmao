import { ClipboardList, Clock, History, PlusCircle, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getMyCreatedTasks } from "../../services/taskService";
import type { TaskListItem } from "../../types/task";

function OperatorDashboardPage() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);

  useEffect(() => {
    void getMyCreatedTasks()
      .then(setTasks)
      .catch((requestError) => console.error(requestError));
  }, []);

  const counters = useMemo(
    () => ({
      total: tasks.length,
      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      done: tasks.filter((task) => task.status === "DONE").length,
    }),
    [tasks],
  );

  return (
    <section className="operator-page">
      <div className="operator-hero">
        <span>TABLEAU DE BORD</span>
        <h1>Bienvenue dans votre espace operateur</h1>
        <p>
          Creez rapidement une tache de maintenance et suivez les taches que
          vous avez remontees a la maintenance.
        </p>
      </div>

      <div className="operator-action-grid">
        <Link to="/operator/tasks/new" className="operator-action-card primary">
          <PlusCircle size={30} />
          <div>
            <strong>Creer une tache</strong>
            <span>Creer une nouvelle tache de maintenance.</span>
          </div>
        </Link>

        <Link to="/operator/tasks" className="operator-action-card">
          <ClipboardList size={30} />
          <div>
            <strong>{counters.total} taches</strong>
            <span>Toutes les taches que vous avez creees.</span>
          </div>
        </Link>

        <article className="operator-action-card">
          <Clock size={30} />
          <div>
            <strong>{counters.inProgress} en cours</strong>
            <span>Taches prises en compte par la maintenance.</span>
          </div>
        </article>

        <article className="operator-action-card">
          <History size={30} />
          <div>
            <strong>{counters.done} terminees</strong>
            <span>Taches resolues et cloturees.</span>
          </div>
        </article>

        <article className="operator-action-card muted">
          <Wrench size={30} />
          <div>
            <strong>Interface maintenance</strong>
            <span>Meme logique de taches que l'espace administrateur.</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export default OperatorDashboardPage;
