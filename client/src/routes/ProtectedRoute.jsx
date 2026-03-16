import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const adminLaneRoles = ['admin', 'principal'];
  const isAdminLane =
    allowedRoles.length > 0 && allowedRoles.every((role) => adminLaneRoles.includes(role));

  if (!isAuthenticated) {
    return <Navigate to={isAdminLane ? '/admin-login' : '/login'} replace state={{ from: location }} />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
