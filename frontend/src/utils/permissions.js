/**
 * Permission utility functions for RBAC and action-level authorization.
 * Seamlessly integrates with backend MenuPermissionDto and ROLE_ADMIN / ROLE_STAFF.
 */

export function hasRole(roles = [], targetRole) {
  if (!roles) return false;
  if (Array.isArray(roles)) {
    return roles.includes(targetRole) || roles.includes(`ROLE_${targetRole}`);
  }
  if (typeof roles === 'string') {
    return roles === targetRole || roles === `ROLE_${targetRole}`;
  }
  return false;
}

export function isAdmin(roles = []) {
  return hasRole(roles, 'ADMIN') || hasRole(roles, 'ROLE_ADMIN');
}

/**
 * Checks whether user has permission to perform action on a specific menu module.
 *
 * @param {Array} permissions - List of MenuPermissionDto objects from UserProfileResponse
 * @param {Array|string} roles - User roles
 * @param {string} menuCode - Menu code, e.g. 'VEHICLES', 'BROKERS', 'SALES', 'WORKSHOP'
 * @param {string} action - 'VIEW' | 'ADD' | 'CREATE' | 'EDIT' | 'DELETE' | 'PAY' | 'EXPORT' | 'STATUS'
 * @returns {boolean}
 */
export function hasPermission(permissions = [], roles = [], menuCode, action = 'VIEW') {
  // Superuser admin bypass
  if (isAdmin(roles)) {
    return true;
  }

  if (!permissions || !Array.isArray(permissions)) {
    return false;
  }

  const normalizedMenu = (menuCode || '').toUpperCase();
  const normalizedAction = (action || '').toUpperCase();

  const menuPerm = permissions.find(
    (p) => (p.menuCode || '').toUpperCase() === normalizedMenu
  );

  if (!menuPerm) {
    return false;
  }

  switch (normalizedAction) {
    case 'VIEW':
      return Boolean(menuPerm.canView);
    case 'ADD':
    case 'CREATE':
      return Boolean(menuPerm.canAdd);
    case 'EDIT':
    case 'UPDATE':
      return Boolean(menuPerm.canEdit);
    case 'DELETE':
      return Boolean(menuPerm.canDelete);
    case 'PAY':
      return Boolean(menuPerm.canPay);
    case 'EXPORT':
      return Boolean(menuPerm.canExport);
    case 'STATUS':
      return Boolean(menuPerm.canChangeStatus);
    default:
      return Boolean(menuPerm.canView);
  }
}
