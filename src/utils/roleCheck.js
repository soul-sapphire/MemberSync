/**
 * Role-Based Access Control (RBAC) utility.
 * Defines roles and their permissions.
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  MEMBER: 'member',
};

export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.STAFF]: 2,
  [ROLES.MEMBER]: 1,
};

/**
 * Checks if a user has at least the required role based on hierarchy.
 */
export const hasRequiredRole = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

/**
 * Checks if a user has any of the allowed roles.
 */
export const hasAnyRole = (userRole, allowedRoles) => {
  if (!userRole || !allowedRoles) return false;
  return allowedRoles.includes(userRole);
};

export const isAdmin = (role) => role === ROLES.ADMIN;
export const isManager = (role) => role === ROLES.MANAGER;
export const isStaff = (role) => role === ROLES.STAFF;
export const isMember = (role) => role === ROLES.MEMBER;
