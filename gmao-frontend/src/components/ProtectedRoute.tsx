import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { getAuthenticatedRole, isAuthenticated } from "../services/authService";
import type { UserRole } from "../types/user";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

function defaultPathForRole(role: string) {
  if (role === "PRODUCTION") {
    return "/operator";
  }

  if (role === "TECHNICIAN") {
    return "/technician";
  }

  if (role === "SERVICE_PROVIDER") {
    return "/provider";
  }

  if (role === "ADMIN" || role === "SUPERADMIN" || role === "SUPERVISOR") {
    return "/admin/dashboard";
  }

  // Rôle authentifié mais sans espace dédié pour l'instant : on renvoie
  // vers le login plutôt que de boucler indéfiniment sur /admin.
  return "/login";
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getAuthenticatedRole();

  if (allowedRoles && !allowedRoles.includes(role as UserRole)) {
    return <Navigate to={defaultPathForRole(role)} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
