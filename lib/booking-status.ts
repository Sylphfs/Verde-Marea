// lib/booking-status.ts
// Машина состояний бронирования и подписи для UI/истории.
// Чистый модуль без зависимостей от Prisma/Next.

export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no_show"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Целевые статусы, в которые бронь можно перевести действием администратора. */
export type TransitionTarget = "confirmed" | "cancelled" | "completed" | "no_show";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Завершена",
  no_show: "Неявка",
};

/**
 * Разрешённые переходы. Терминальные статусы (cancelled/completed/no_show)
 * не возвращаются в активные — явного правила реактивации в проекте нет.
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, readonly TransitionTarget[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "no_show", "cancelled"],
  cancelled: [],
  completed: [],
  no_show: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] as readonly BookingStatus[]).includes(to);
}

/** Подписи действий для истории изменений (AuditLog.action). */
export const ACTION_LABELS: Record<string, string> = {
  "booking.created": "Создал(а) бронь",
  "booking.confirmed": "Подтвердил(а) бронь",
  "booking.cancelled": "Отменил(а) бронь",
  "booking.completed": "Завершил(а) бронь",
  "booking.no_show": "Пометил(а) как неявку",
  "user.role_changed": "Изменил(а) роль пользователя",
  "slots.generated": "Сгенерировал(а) окна записи",
};
