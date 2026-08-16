/**
 * Role-based access control — shared by Studio (staff) and storefront (customer).
 *
 * Roles:
 * - customer: storefront account only.
 * - manager:  Studio access — Products, Orders, Returns, view Customers.
 * - admin:    full system access.
 */

export const ROLES = Object.freeze({
  CUSTOMER: "customer",
  MANAGER: "manager",
  ADMIN: "admin",
});

export const STUDIO_ROLES = Object.freeze([ROLES.MANAGER, ROLES.ADMIN]);

/** Studio module permission matrix — used to gate future module pages. */
const MODULE_PERMISSIONS = Object.freeze({
  overview: STUDIO_ROLES,
  products: STUDIO_ROLES,
  categories: STUDIO_ROLES,
  media: STUDIO_ROLES,
  homepage: [ROLES.ADMIN],
  navigation: [ROLES.ADMIN],
  orders: STUDIO_ROLES,
  returns: STUDIO_ROLES,
  customers: STUDIO_ROLES,
  coupons: [ROLES.ADMIN],
  theme: [ROLES.ADMIN],
  settings: [ROLES.ADMIN],
  analytics: STUDIO_ROLES,
});

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

export function hasStudioAccess(role) {
  return STUDIO_ROLES.includes(role);
}

export function isAdmin(role) {
  return role === ROLES.ADMIN;
}

export function isManagerOrAdmin(role) {
  return hasStudioAccess(role);
}

/** @param {string} role @param {keyof typeof MODULE_PERMISSIONS} moduleKey */
export function canAccessModule(role, moduleKey) {
  const allowed = MODULE_PERMISSIONS[moduleKey];
  if (!allowed) return isAdmin(role);
  return allowed.includes(role);
}
