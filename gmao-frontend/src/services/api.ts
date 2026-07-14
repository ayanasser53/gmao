import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const api = axios.create({
  baseURL: "http://localhost:8090/api",
});

/*
 * Ne pas définir globalement :
 *
 * headers: {
 *   "Content-Type": "application/json"
 * }
 *
 * Axios choisira automatiquement :
 * - application/json pour les objets JSON ;
 * - multipart/form-data avec boundary pour FormData.
 */

api.interceptors.request.use(
  (
    config: InternalAxiosRequestConfig,
  ) => {
    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /*
     * Quand les données sont un FormData,
     * on supprime tout Content-Type éventuellement hérité.
     * Le navigateur doit le générer avec sa boundary.
     */
    if (config.data instanceof FormData) {
      delete config.headers[
        "Content-Type"
      ];
    }

    return config;
  },
  (error: AxiosError) =>
    Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const requestUrl =
        error.config?.url;

      const isAuthenticationRoute =
        requestUrl?.includes(
          "/auth/login",
        ) ||
        requestUrl?.includes(
          "/auth/register",
        );

      if (!isAuthenticationRoute) {
        localStorage.removeItem(
          "token",
        );

        localStorage.removeItem(
          "userId",
        );

        localStorage.removeItem(
          "email",
        );

        localStorage.removeItem(
          "role",
        );

        window.location.href =
          "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;