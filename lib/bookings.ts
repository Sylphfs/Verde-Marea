// lib/bookings.ts
// Запросы доступности окон и столов (серверная логика бронирования).
import { prisma } from "./prisma";
import { ACTIVE_BOOKING_STATUSES } from "./booking-rules";
import type { Slot } from "@prisma/client";

/** Максимальная вместимость среди столов (для выбора числа гостей). */
export async function getMaxCapacity(): Promise<number> {
  const result = await prisma.table.aggregate({ _max: { capacity: true } });
  return result._max.capacity ?? 0;
}

/**
 * Свободные окна на выбранный день для заданного числа гостей.
 * Окно свободно, если: время в будущем и есть хотя бы один подходящий
 * (capacity >= guests) стол без активной брони на это окно.
 */
export async function getAvailableSlots(day: Date, guests: number): Promise<Slot[]> {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();

  const slots = await prisma.slot.findMany({
    where: { startTime: { gte: dayStart, lt: dayEnd } },
    orderBy: { startTime: "asc" },
  });

  if (slots.length === 0) return [];

  const activeBookings = await prisma.booking.findMany({
    where: {
      slotId: { in: slots.map((s) => s.id) },
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
    },
    select: { slotId: true, tableId: true },
  });

  const bookedTablesBySlot = new Map<string, Set<string>>();
  for (const booking of activeBookings) {
    const set = bookedTablesBySlot.get(booking.slotId) ?? new Set<string>();
    set.add(booking.tableId);
    bookedTablesBySlot.set(booking.slotId, set);
  }

  const suitableTables = await prisma.table.findMany({ where: { capacity: { gte: guests } } });

  return slots.filter((slot) => {
    // Без прошедшего времени.
    if (slot.startTime.getTime() <= now.getTime()) return false;
    const booked = bookedTablesBySlot.get(slot.id) ?? new Set<string>();
    // Доступно, если хотя бы один подходящий стол свободен.
    return suitableTables.some((table) => !booked.has(table.id));
  });
}
