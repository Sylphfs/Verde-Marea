"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatSlotLabel } from "@/lib/booking-rules";
import { canTransition, type TransitionTarget } from "@/lib/booking-status";

const schema = z.object({ bookingId: z.string().min(1, "Не указана бронь") });

export type AdminActionState = { ok: boolean; error?: string };

function actionCode(target: TransitionTarget): string {
  switch (target) {
    case "confirmed":
      return "booking.confirmed";
    case "cancelled":
      return "booking.cancelled";
    case "completed":
      return "booking.completed";
    case "no_show":
      return "booking.no_show";
  }
}

function notificationMessage(
  target: TransitionTarget,
  tableNumber: number,
  slotLabel: string,
): string {
  switch (target) {
    case "confirmed":
      return `Бронь подтверждена: ${slotLabel}, стол ${tableNumber}`;
    case "cancelled":
      return `Бронь отменена администратором: ${slotLabel}`;
    case "completed":
      return `Визит завершён: ${slotLabel}, стол ${tableNumber}`;
    case "no_show":
      return `Отмечена неявка: ${slotLabel}`;
  }
}

async function transitionBooking(
  formData: FormData,
  target: TransitionTarget,
): Promise<AdminActionState> {
  // Доступ только для admin и super_admin.
  const actor = await requireRole("admin", "super_admin");

  const parsed = schema.safeParse({ bookingId: formData.get("bookingId") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Не указана бронь" };
  }
  const { bookingId } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { slot: true, table: true },
  });
  if (!booking) {
    return { ok: false, error: "Бронь не найдена" };
  }

  // Машина состояний: запрещаем переходы вне ALLOWED_TRANSITIONS,
  // в том числе возврат терминальных статусов в активные.
  if (!canTransition(booking.status, target)) {
    return { ok: false, error: `Переход «${booking.status}» → «${target}» не разрешён` };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: target },
  });

  await prisma.notification.create({
    data: {
      userId: booking.userId,
      bookingId: booking.id,
      type: "info",
      message: notificationMessage(
        target,
        booking.table.number,
        formatSlotLabel(booking.slot.startTime, booking.slot.endTime),
      ),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: actionCode(target),
      entity: "Booking",
      entityId: booking.id,
      details: { from: booking.status, to: target },
    },
  });

  revalidatePath("/admin/bookings");
  revalidatePath("/bookings");
  redirect("/admin/bookings");
}

export async function confirmBooking(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return transitionBooking(formData, "confirmed");
}

export async function adminCancelBooking(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return transitionBooking(formData, "cancelled");
}

export async function completeBooking(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return transitionBooking(formData, "completed");
}

export async function markNoShow(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  return transitionBooking(formData, "no_show");
}
