import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlots } from "@/app/actions/admin-slots";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_RULES,
  formatSlotLabel,
} from "@/lib/booking-rules";
import { Button, Card, EmptyState } from "@/components/ui";

export default async function AdminSlotsPage() {
  await requireRole("admin", "super_admin");

  const now = new Date();
  const slots = await prisma.slot.findMany({
    where: { startTime: { gte: now } },
    orderBy: { startTime: "asc" },
    include: {
      bookings: {
        where: { status: { in: [...ACTIVE_BOOKING_STATUSES] } },
        select: { tableId: true },
      },
    },
    take: 200,
  });

  const totalTables = await prisma.table.count();

  return (
    <div>
      <h2 className="text-xl font-semibold text-forest">Окна записи</h2>

      <Card className="mt-4">
        <p className="font-medium">Правила доступности</p>
        <p className="mt-1 text-ink/60">
          горизонт {BOOKING_RULES.horizonDays} дней · вт–вс · шаг {BOOKING_RULES.slotStepMinutes}{" "}
          мин · 12:00–21:00
        </p>
      </Card>

      <form action={generateSlots} className="mt-4">
        <Button type="submit">Сгенерировать окна на {BOOKING_RULES.horizonDays} дней</Button>
      </form>

      {slots.length === 0 ? (
        <EmptyState title="Нет будущих окон — нажмите «Сгенерировать»" />
      ) : (
        <ul className="mt-6 space-y-2">
          {slots.map((slot) => {
            const free = totalTables - slot.bookings.length;
            return (
              <li key={slot.id}>
                <Card>
                  <span className="font-medium">{formatSlotLabel(slot.startTime, slot.endTime)}</span>
                  <span className="ml-3 text-sm text-ink/60">
                    занято столов: {slot.bookings.length} · свободно: {free}
                  </span>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
