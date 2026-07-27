import { useLocation } from "react-router-dom";

export function useWorkspaceBasePath(): "/admin" | "/technician" | "/operator" {
  const location = useLocation();

  if (location.pathname.startsWith("/technician")) {
    return "/technician";
  }

  if (location.pathname.startsWith("/operator")) {
    return "/operator";
  }

  return "/admin";
}
