import { Link, useNavigate } from "react-router-dom";
import { Menu, Wrench, X } from "lucide-react";
import { useState } from "react";

import {
  getAuthenticatedEmail,
  isAuthenticated,
  logout,
} from "../services/authService";

function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const authenticated = isAuthenticated();
  const email = getAuthenticatedEmail();

  function handleLogout(): void {
    logout();
    navigate("/");
  }

  function closeMenu(): void {
    setMenuOpen(false);
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand" onClick={closeMenu}>
  <div className="brand-logo-icon">
    <Wrench size={30} strokeWidth={2.5} />
  </div>

  <div className="brand-logo-text">
    <span className="brand-name-dark">Smart</span>
    <span className="brand-name-blue">Maint</span>
  </div>
</Link>

      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setMenuOpen((previous) => !previous)}
        aria-label="Ouvrir le menu"
      >
        {menuOpen ? <X size={25} /> : <Menu size={25} />}
      </button>

      <nav className={`nav-links ${menuOpen ? "nav-links-open" : ""}`}>
        <a href="/#features" onClick={closeMenu}>
          Fonctionnalités
        </a>

        <a href="/#profiles" onClick={closeMenu}>
          Utilisateurs
        </a>

        <a href="/#about" onClick={closeMenu}>
          À propos
        </a>

        {!authenticated ? (
          <>
            <Link to="/login" className="nav-login" onClick={closeMenu}>
              Connexion
            </Link>

            <Link
              to="/register"
              className="primary-button small-button"
              onClick={closeMenu}
            >
              Créer un compte
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="nav-login" onClick={closeMenu}>
              Tableau de bord
            </Link>

            <span className="connected-email">{email}</span>

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;