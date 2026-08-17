import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/auth-context";
import type { Role } from "../../lib/types";

export function ProtectedRoute({ requireRole }: { requireRole?: Role }) {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && !hasRole(requireRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
