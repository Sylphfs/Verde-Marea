"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  ACTIVE_BOOKING_STATUSES,
  canUserCancel,
  formatSlotLabel,
  validateSlotWindow,
} from "@/lib/booking-rules";

const createBookingSchema = z.object({
  slotId: z.string().min(1, "Не указано окно"),
  guests: z.coerce
    .number()
    .int()
    .min(1, "Число гостей не меньше 1")
    .max(20, "Слишком много гостей"),
});

const cancelBookingSchema = z.object({
  bookingId: z.string().min(1, "Не указана бронь"),
});

export type BookingActionState = { ok: boolean; error?: string };

/** Ошибка бизнес-логики: транзакция откатывается, сообщение видит пользователь. */
class BookingError extends Error {}

export async function createBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const user = await requireUser();

  const parsed = createBookingSchema.safeParse({
    slotId: formData.get("slotId"),
    guests: formData.get("guests"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Проверьте данные" };
  }
  const { slotId, guests } = parsed.data;

  try {
    // Serializable: защищает от гонки, когда два запроса одновременно
    // претендуют на один стол или пользователь бронирует одно окно дважды.
    await prisma.$transaction(
      async (tx) => {
        const slot = await tx.slot.findUnique({ where: { id: slotId } });
        if (!slot) throw new BookingError("Окно не найдено");

        const windowError = validateSlotWindow(slot.startTime, slot.endTime, new Date());
        if (windowError) throw new BookingError(windowError);

        // Защита от дубля: один пользователь — одна активная бронь на окно.
        const userBooking = await tx.booking.findFirst({
          where: {
            userId: user.id,
            slotId,
            status: { in: [...ACTIVE_BOOKING_STATUSES] },
          },
        });
        if (userBooking) throw new BookingError("У вас уже есть активная бронь на это время");

        // Подбор свободного подходящего стола (best-fit по вместимости).
        const bookedTables = await tx.booking.findMany({
          where: { slotId, status: { in: [...ACTIVE_BOOKING_STATUSES] } },
          select: { tableId: true },
        });
        const bookedIds = bookedTables.map((b) => b.tableId);

        const table = await tx.table.findFirst({
          where: { capacity: { gte: guests }, id: { notIn: bookedIds } },
          orderBy: { capacity: "asc" },
        });
        if (!table) throw new BookingError("Нет подходящего свободного стола на это время");

        const booking = await tx.booking.create({
          data: { userId: user.id, slotId, tableId: table.id, guests, status: "pending" },
        });

        await tx.notification.create({
          data: {
            userId: user.id,
            bookingId: booking.id,
            type: "info",
            message: `Бронь создана: ${formatSlotLabel(slot.startTime, slot.endTime)}, стол ${table.number} (ожидает подтверждения)`,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: "booking.created",
            entity: "Booking",
            entityId: booking.id,
            details: { slotId, tableId: table.id, guests },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof BookingError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { ok: false, error: "Конфликт при бронировании — попробуйте ещё раз" };
    }
    throw error;
  }

  revalidatePath("/book");
  revalidatePath("/bookings");
  redirect("/bookings?created=1");
}

export async function cancelBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const user = await requireUser();

  const parsed = cancelBookingSchema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) return { ok: false, error: "Не указана бронь" };
  const { bookingId } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { slot: true },
  });

  // Серверная проверка прав: отменить можно только свою бронь.
  if (!booking || booking.userId !== user.id) {
    return { ok: false, error: "Бронь не найдена" };
  }
  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return { ok: false, error: "Эту бронь уже нельзя отменить" };
  }

  const cancelCheck = canUserCancel(booking.slot.startTime, new Date());
  if (!cancelCheck.allowed) {
    return { ok: false, error: cancelCheck.reason ?? "Отмена недоступна" };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "cancelled" },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      bookingId: booking.id,
      type: "info",
      message: `Бронь отменена: ${formatSlotLabel(booking.slot.startTime, booking.slot.endTime)}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "booking.cancelled",
      entity: "Booking",
      entityId: booking.id,
    },
  });

  revalidatePath("/bookings");
  redirect("/bookings");
}
