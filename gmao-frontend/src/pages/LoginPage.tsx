import { useState, type ChangeEvent, type FormEvent } from "react";

import { AxiosError } from "axios";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Wrench,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import {
  loginAdmin,
  saveAuthentication,
} from "../services/authService";

import type {
  ApiErrorResponse,
  AuthResponse,
  LoginRequest,
} from "../types/auth";

function getStartPath(authData: AuthResponse): string {
  if (authData.role === "PRODUCTION") {
    return "/operator";
  }

  return "/admin/dashboard";
}

function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginRequest>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const authData = await loginAdmin(form);

      saveAuthentication(authData);

      navigate(getStartPath(authData), {
        replace: true,
      });
    } catch (requestError) {
      const axiosError =
        requestError as AxiosError<ApiErrorResponse>;

      const message =
        axiosError.response?.data?.message ??
        axiosError.response?.data?.error ??
        "Email ou mot de passe incorrect.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-visual login-visual">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          Retour à l’accueil
        </Link>

        <div className="auth-visual-content">
          <div className="auth-logo">
            <Wrench size={34} />
          </div>

          <h1>Bienvenue sur SmartMaint</h1>

          <p>
            Connectez-vous pour accéder à la plateforme de gestion de
            maintenance.
          </p>

          <div className="auth-benefit">
            <LockKeyhole size={28} />

            <span>Accès sécurisé à vos données de maintenance</span>
          </div>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <span className="section-label">Connexion</span>

          <h2>Accéder à votre compte</h2>

          <p className="auth-subtitle">
            Saisissez votre email et votre mot de passe.
          </p>

          {error && <div className="error-message">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Adresse email *</label>

              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="admin@gmao.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Mot de passe *</label>

              <div className="password-field">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={form.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previousValue) => !previousValue)
                  }
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p className="auth-switch">
            Vous n’avez pas encore de compte ?{" "}
            <Link to="/register">Créer un compte</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
