import { Link } from "react-router-dom";

import {
  Activity,
  Boxes,
  CalendarCheck,
  ClipboardList,
  Gauge,
  PackageCheck,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";

import Navbar from "../components/Navbar";
import ProfileCard from "../components/ProfileCard";

function HomePage() {
  return (
    <div className="page">
      <Navbar />

      <main>
        <section className="hero">
          <div className="hero-overlay" />

          <div className="hero-content">
            <span className="hero-label">
              Solution de gestion de maintenance industrielle
            </span>

            <h1>
              Pilotez vos équipements, vos interventions et vos équipes depuis
              une seule plateforme
            </h1>

            <p>
              SmartMaint centralise la gestion des équipements, des tâches de
              maintenance, des stocks, des équipes, des fournisseurs et des
              commandes d’achat.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="primary-button">
                Créer un compte
              </Link>

              <Link to="/login" className="secondary-button">
                Se connecter
              </Link>
            </div>
          </div>
        </section>

        <section className="intro-section" id="about">
          <div>
            <span className="section-label">
              Maintenance connectée
            </span>

            <h2>
              Une GMAO moderne conçue pour les besoins de l’industrie
            </h2>
          </div>

          <div>
            <p>
              SmartMaint permet de centraliser les informations liées aux
              équipements, aux interventions et aux ressources de maintenance.
            </p>

            <p>
              La plateforme facilite la planification des tâches, le suivi des
              activités, la gestion des pièces de rechange et la coordination
              entre les différents intervenants.
            </p>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="section-label">
              Fonctionnalités
            </span>

            <h2>
              Tous les outils nécessaires à la gestion de votre maintenance
            </h2>

            <p>
              Une plateforme complète pour centraliser les opérations,
              améliorer la traçabilité et optimiser les interventions.
            </p>
          </div>

          <div className="features-grid">
            <article className="feature-card">
              <Wrench size={36} />

              <h3>Équipements</h3>

              <p>
                Gérez les équipements, leurs images, leurs descriptions, leurs
                centres de coût et leurs informations techniques.
              </p>
            </article>

            <article className="feature-card">
              <ClipboardList size={36} />

              <h3>Tâches de maintenance</h3>

              <p>
                Planifiez les interventions et assignez-les à un collaborateur
                ou à une équipe.
              </p>
            </article>

            <article className="feature-card">
              <Activity size={36} />

              <h3>Suivi des activités</h3>

              <p>
                Enregistrez les travaux réalisés, le temps passé, les mesures
                effectuées et les pièces utilisées.
              </p>
            </article>

            <article className="feature-card">
              <Boxes size={36} />

              <h3>Pièces de rechange</h3>

              <p>
                Suivez les quantités disponibles, les prix, les emplacements et
                les seuils de réapprovisionnement.
              </p>
            </article>

            <article className="feature-card">
              <CalendarCheck size={36} />

              <h3>Maintenance préventive</h3>

              <p>
                Créez des plans de maintenance avec des assignés, des
                checklists et des pièces à prévoir.
              </p>
            </article>

            <article className="feature-card">
              <Users size={36} />

              <h3>Équipes et collaborateurs</h3>

              <p>
                Organisez les utilisateurs en équipes et gérez leurs missions
                et leurs responsabilités.
              </p>
            </article>

            <article className="feature-card">
              <ShoppingCart size={36} />

              <h3>Commandes d’achat</h3>

              <p>
                Créez des commandes fournisseurs, ajoutez des lignes de commande
                et suivez leur statut.
              </p>
            </article>

            <article className="feature-card">
              <PackageCheck size={36} />

              <h3>Fournisseurs</h3>

              <p>
                Centralisez les informations des fournisseurs et consultez leurs
                catalogues.
              </p>
            </article>

            <article className="feature-card">
              <Gauge size={36} />

              <h3>Indicateurs de performance</h3>

              <p>
                Analysez les principales données de maintenance et suivez
                l’évolution des performances.
              </p>
            </article>
          </div>
        </section>

        <section className="profiles-section" id="profiles">
  <div className="section-heading">
    <span className="section-label">
      Profils utilisateurs
    </span>

    <h2>
      Une solution adaptée à chaque intervenant
    </h2>

    <p>
      Chaque utilisateur dispose d’un espace correspondant à ses missions
      et à ses responsabilités dans le processus de maintenance.
    </p>
  </div>

  <div className="profiles-grid">
    <ProfileCard
      image="/administrator.png"
      title="Administrateur"
      description="Gère les utilisateurs, les équipements, les équipes, les tâches, les stocks, les fournisseurs et les commandes."
    />

    <ProfileCard
      image="/technician.png"
      title="Technicien"
      description="Consulte les interventions assignées et enregistre les activités de maintenance réalisées."
    />

    <ProfileCard
      image="/production.png"
      title="Production"
      description="Signale les anomalies et suit l’avancement des interventions sur les équipements."
    />

    <ProfileCard
      image="/service-provider.png"
      title="Prestataire"
      description="Consulte les interventions confiées et renseigne les opérations de maintenance réalisées."
    />
  </div>
</section>

        <section className="security-section">
          <div className="security-icon">
            <ShieldCheck size={48} />
          </div>

          <div>
            <span className="section-label">
              Gestion centralisée
            </span>

            <h2>
              Une plateforme fiable pour vos opérations de maintenance
            </h2>

            <p>
              Accédez à un espace sécurisé pour gérer les équipements, les
              interventions, les équipes, les stocks et les achats.
            </p>
          </div>

          <Link to="/login" className="primary-button">
            Accéder à l’application
          </Link>
        </section>
      </main>

      <footer className="footer">
        <div>
          <strong>SmartMaint</strong>

          <p>
            Solution de gestion de maintenance industrielle
          </p>
        </div>

        <span>
          © 2026 SmartMaint
        </span>
      </footer>
    </div>
  );
}

export default HomePage;