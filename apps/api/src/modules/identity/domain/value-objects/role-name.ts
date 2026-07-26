export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  SUPPORT = 'SUPPORT',
  CUSTOMER = 'CUSTOMER',
}

/** Roles que pueden acceder al panel administrativo (todos salvo Customer). */
export const STAFF_ROLES: readonly RoleName[] = [
  RoleName.SUPER_ADMIN,
  RoleName.ADMIN,
  RoleName.EDITOR,
  RoleName.SUPPORT,
];
