import { useState, type FormEvent } from "react";

import { AxiosError } from "axios";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { registerAdmin } from "../services/authService";

import type {
  ApiErrorResponse,
  RegisterRequest,
} from "../types/auth";

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  function updateField(
    field: keyof RegisterRequest,
    value: string,
  ): void {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Le mot de passe doit contenir au moins 6 caractères.",
      );
      return;
    }

    setLoading(true);

    try {
      const requestData: RegisterRequest = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      };

      const response = await registerAdmin(requestData);

      navigate("/login", {
        replace: true,
        state: {
          successMessage: response.message,
          email: response.email,
        },
      });
    } catch (requestError) {
      const axiosError =
        requestError as AxiosError<ApiErrorResponse | string>;

      console.error("Erreur inscription :", axiosError);

      const responseData = axiosError.response?.data;

      let message =
        "Impossible de créer le compte administrateur.";

      if (typeof responseData === "string" && responseData.trim()) {
        message = responseData;
      } else if (
        typeof responseData === "object" &&
        responseData !== null
      ) {
        message =
          responseData.message ??
          responseData.error ??
          message;
      } else if (axiosError.code === "ERR_NETWORK") {
        message =
          "Impossible de contacter le serveur. Vérifiez que le backend est démarré.";
      }

      if (
        axiosError.response?.status === 409 &&
        !(
          typeof responseData === "object" &&
          responseData !== null &&
          responseData.message
        )
      ) {
        message = "Cette adresse email est déjà utilisée.";
      }

      if (
        axiosError.response?.status === 400 &&
        !(
          typeof responseData === "object" &&
          responseData !== null &&
          responseData.message
        )
      ) {
        message = "Les informations saisies ne sont pas valides.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-visual register-visual">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          Retour à l’accueil
        </Link>

        <div className="auth-visual-content">
          <div className="auth-logo">
            <Wrench size={34} />
          </div>

          <h1>Créez votre espace administrateur</h1>

          <p>
            Centralisez la gestion de vos équipements, de vos équipes,
            de vos stocks et de vos interventions de maintenance.
          </p>

          <div className="auth-benefit">
            <ShieldCheck size={28} />

            <span>
              Un espace sécurisé pour piloter vos opérations de maintenance
            </span>
          </div>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <span className="section-label">Inscription</span>

          <h2>Créer un compte</h2>

          <p className="auth-subtitle">
            Complétez les informations de l’administrateur.
          </p>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="register-first-name">
                  Prénom *
                </label>

                <input
                  id="register-first-name"
                  name="registerFirstName"
                  type="text"
                  placeholder="Votre prénom"
                  value={form.firstName}
                  onChange={(event) =>
                    updateField("firstName", event.target.value)
                  }
                  autoComplete="off"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-last-name">
                  Nom *
                </label>

                <input
                  id="register-last-name"
                  name="registerLastName"
                  type="text"
                  placeholder="Votre nom"
                  value={form.lastName}
                  onChange={(event) =>
                    updateField("lastName", event.target.value)
                  }
                  autoComplete="off"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="register-email">
                Adresse email *
              </label>

              <input
                id="register-email"
                name="registerAccountEmail"
                type="email"
                placeholder="nom@entreprise.com"
                value={form.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                autoComplete="off"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-phone">
                Téléphone
              </label>

              <input
                id="register-phone"
                name="registerPhoneNumber"
                type="tel"
                placeholder="Votre numéro de téléphone"
                value={form.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                autoComplete="off"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">
                Mot de passe *
              </label>

              <div className="password-field">
                <input
                  id="register-password"
                  name="newAccountPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Au moins 6 caractères"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={6}
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previousValue) => !previousValue,
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  disabled={loading}
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
              {loading
                ? "Création en cours..."
                : "Créer mon compte"}
            </button>
          </form>

          <p className="auth-switch">
            Vous avez déjà un compte ?{" "}
            <Link to="/login">
              Se connecter
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

export default RegisterPage;