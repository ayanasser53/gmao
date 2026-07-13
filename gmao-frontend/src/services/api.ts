import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8090/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url as string | undefined;

      const isAuthRoute =
        requestUrl?.includes("/auth/login") ||
        requestUrl?.includes("/auth/register");

      if (!isAuthRoute) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("email");
        localStorage.removeItem("role");

        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;