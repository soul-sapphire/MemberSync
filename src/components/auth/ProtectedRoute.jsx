import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole, ROLES } from '../../utils/roleCheck';

/**
 * Enhanced ProtectedRoute that enforces both authentication and role-based authorization.
 * Redirects unauthorized users to an Access Denied page instead of silent redirects.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Authenticating...</p>
        </div>
      </div>
    );
  }

  // 1. Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If user is authenticated, check if they have any of the allowed roles
  if (allowedRoles && !hasAnyRole(userRole, allowedRoles)) {
    console.warn(`Access denied for role: ${userRole}. Required: ${allowedRoles}`);
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};
