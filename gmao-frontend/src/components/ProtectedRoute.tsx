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

  return "/admin/dashboard";
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
