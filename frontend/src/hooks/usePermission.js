import { useSelector } from 'react-redux';
import { hasPermission, isAdmin, hasRole } from '../utils/permissions';

export function usePermission() {
  const { user } = useSelector((state) => state.auth);
  const permissions = user?.permissions || [];
  const roles = user?.roles || [];

  const check = (menuCode, action = 'VIEW') => {
    return hasPermission(permissions, roles, menuCode, action);
  };

  const isSuperAdmin = isAdmin(roles);

  const checkRole = (role) => {
    return hasRole(roles, role);
  };

  return {
    permissions,
    roles,
    hasPermission: check,
    isAdmin: isSuperAdmin,
    hasRole: checkRole,
  };
}

export default usePermission;
