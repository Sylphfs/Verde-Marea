// lib/booking-rules.ts
// Чистые правила бронирования без зависимостей от Prisma/Next.
// Источник правды для: генерации слотов (seed), серверных проверок и UI.
// Времена трактуются в локальном часовом поясе сервера (проект локальный).

export const BOOKING_RULES = {
  /** Горизонт бронирования в днях. */
  horizonDays: 14,
  /** Шаг окна в минутах. */
  slotStepMinutes: 90,
  /** Первое окно — 12:00 (минуты от начала суток). */
  firstSlotMinutes: 12 * 60,
  /** Последний старт — 19:30 (конец последнего окна — 21:00). */
  lastSlotStartMinutes: 19 * 60 + 30,
  /** Понедельник — выходной (0 = воскресенье, 1 = понедельник). */
  closedWeekday: 1,
  /** Дедлайн самостоятельной отмены, часы. */
  cancelDeadlineHours: 3,
} as const;

/** Статусы, которые занимают окно и стол (активные брони). */
export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;
export type ActiveBookingStatus = (typeof ACTIVE_BOOKING_STATUSES)[number];

export function isActiveStatus(status: string): boolean {
  return (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(status);
}

export interface SlotWindow {
  startTime: Date;
  endTime: Date;
}

/** Окна одного дня (вт–вс, шаг 90 мин, 12:00–21:00). В понедельник — пусто. */
export function generateSlotsForDay(day: Date): SlotWindow[] {
  if (day.getDay() === BOOKING_RULES.closedWeekday) return [];

  const windows: SlotWindow[] = [];
  for (
    let minutes = BOOKING_RULES.firstSlotMinutes;
    minutes <= BOOKING_RULES.lastSlotStartMinutes;
    minutes += BOOKING_RULES.slotStepMinutes
  ) {
    const startTime = new Date(day);
    startTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    const endTime = new Date(startTime.getTime() + BOOKING_RULES.slotStepMinutes * 60 * 1000);
    windows.push({ startTime, endTime });
  }
  return windows;
}

/** Даты на ближайшие horizonDays дней, только вт–вс (локальные, полночь). */
export function generateBookableDates(
  from: Date,
  horizonDays: number = BOOKING_RULES.horizonDays,
): Date[] {
  const result: Date[] = [];
  const base = new Date(from);
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < horizonDays; i++) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    if (day.getDay() !== BOOKING_RULES.closedWeekday) result.push(day);
  }
  return result;
}

/** Ключ даты в локальном формате YYYY-MM-DD (для значений формы). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Разбор ключа YYYY-MM-DD в локальную дату (null, если некорректно). */
export function fromDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  // Проверка на реальную дату (например, 2025-02-30 не существует).
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

/** Проверка окна по правилам проекта. Возвращает текст ошибки или null. */
export function validateSlotWindow(startTime: Date, endTime: Date, now: Date): string | null {
  if (startTime.getTime() <= now.getTime()) {
    return "Нельзя забронировать прошедшее время";
  }
  if (startTime.getDay() === BOOKING_RULES.closedWeekday) {
    return "В этот день ресторан закрыт";
  }
  const horizonEnd = now.getTime() + BOOKING_RULES.horizonDays * 24 * 60 * 60 * 1000;
  if (startTime.getTime() > horizonEnd) {
    return "Окно вне горизонта бронирования (14 дней)";
  }
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  if (startMinutes < BOOKING_RULES.firstSlotMinutes) {
    return "Окно раньше начала работы (12:00)";
  }
  if (endMinutes > BOOKING_RULES.lastSlotStartMinutes + BOOKING_RULES.slotStepMinutes) {
    return "Окно позже конца работы (21:00)";
  }
  if (endMinutes !== startMinutes + BOOKING_RULES.slotStepMinutes) {
    return "Некорректная длительность окна";
  }
  return null;
}

/** Можно ли пользователю отменить бронь самому (не позднее 3 часов). */
export function canUserCancel(
  startTime: Date,
  now: Date,
): { allowed: boolean; reason?: string } {
  const deadline = startTime.getTime() - BOOKING_RULES.cancelDeadlineHours * 60 * 60 * 1000;
  if (now.getTime() <= deadline) return { allowed: true };
  return { allowed: false, reason: "Отмена доступна не позднее чем за 3 часа до начала" };
}

/** Форматирование для UI и уведомлений. */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatSlotLabel(startTime: Date, endTime: Date): string {
  return `${formatDate(startTime)}, ${formatTime(startTime)}–${formatTime(endTime)}`;
}
