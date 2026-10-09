// lib/roles.ts
// Единый источник ролевой логики. Этот модуль не использует серверные API
// (next/headers, Prisma), поэтому безопасно импортируется и клиентскими,
// и серверными компонентами. Клиент использует его только для видимости
// элементов; реальную защиту выполняет сервер.

export const ROLES = ["user", "admin", "super_admin"] as const;

export type Role = (typeof ROLES)[number];

/// Безопасное представление пользователя для UI и сессии (без passwordHash).
export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export const ROLE_LABELS: Record<Role, string> = {
  user: "Гость",
  admin: "Администратор",
  super_admin: "Супер-администратор",
};

/// Матрица прав: разрешение -> список ролей, которым оно доступно.
export const PERMISSIONS = {
  createBooking: ["user", "admin", "super_admin"],
  viewOwnBookings: ["user", "admin", "super_admin"],
  viewAllBookings: ["admin", "super_admin"],
  manageBookingStatus: ["admin", "super_admin"],
  manageTables: ["admin", "super_admin"],
  manageSlots: ["admin", "super_admin"],
  viewUsers: ["admin", "super_admin"],
  changeRoles: ["super_admin"],
  viewAuditLog: ["super_admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/// Проверка права по роли (клиент — видимость, сервер — enforcement).
export function can(role: Role, permission: Permission): boolean {
  const allowed: readonly string[] = PERMISSIONS[permission];
  return allowed.includes(role);
}

/// Менять роли (включая super_admin) может только super_admin.
export function canSetRole(actorRole: Role): boolean {
  return actorRole === "super_admin";
}
