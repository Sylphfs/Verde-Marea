"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  BOOKING_RULES,
  generateBookableDates,
  generateSlotsForDay,
} from "@/lib/booking-rules";

/** Генерирует окна записи на ближайшие 14 дней по правилам проекта. */
export async function generateSlots(): Promise<void> {
  const actor = await requireRole("admin", "super_admin");

  const days = generateBookableDates(new Date(), BOOKING_RULES.horizonDays);
  let created = 0;

  for (const day of days) {
    for (const slotWindow of generateSlotsForDay(day)) {
      const existing = await prisma.slot.findUnique({
        where: {
          startTime_endTime: { startTime: slotWindow.startTime, endTime: slotWindow.endTime },
        },
      });
      if (!existing) {
        await prisma.slot.create({ data: slotWindow });
        created++;
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "slots.generated",
      entity: "Slot",
      details: { created, horizonDays: BOOKING_RULES.horizonDays },
    },
  });

  revalidatePath("/admin/slots");
}
