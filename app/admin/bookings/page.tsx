import { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSlotLabel, fromDateKey } from "@/lib/booking-rules";
import { BOOKING_STATUSES, STATUS_LABELS, type BookingStatus } from "@/lib/booking-status";
import { BookingStatusBadge } from "@/components/status-badge";
import { AdminBookingActions } from "@/components/admin-booking-actions";
import { Button, ButtonLink, Card, EmptyState, Field, inputStyles } from "@/components/ui";

interface SearchParams {
  status?: string;
  date?: string;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("admin", "super_admin");
  const params = await searchParams;

  const where: Prisma.BookingWhereInput = {};

  const status = (BOOKING_STATUSES as readonly string[]).includes(params.status ?? "")
    ? (params.status as BookingStatus)
    : undefined;
  if (status) where.status = status;

  const day = params.date ? fromDateKey(params.date) : null;
  if (day) {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    where.slot = { startTime: { gte: dayStart, lt: dayEnd } };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      slot: true,
      table: true,
      user: { select: { email: true, name: true } },
    },
    orderBy: { slot: { startTime: "desc" } },
    take: 200,
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-forest">Бронирования</h2>

      <form method="get" action="/admin/bookings" className="mt-4 flex flex-wrap items-end gap-4">
        <Field label="Статус">
          <select name="status" defaultValue={params.status ?? "all"} className={inputStyles}>
            <option value="all">Все статусы</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Дата">
          <input type="date" name="date" defaultValue={params.date} className={inputStyles} />
        </Field>

        <Button type="submit">Фильтровать</Button>

        {params.status || params.date ? (
          <ButtonLink href="/admin/bookings" variant="outline">
            Сбросить
          </ButtonLink>
        ) : null}
      </form>

      {bookings.length === 0 ? (
        <EmptyState title="Броней не найдено" />
      ) : (
        <ul className="mt-6 space-y-3">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Card>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {formatSlotLabel(booking.slot.startTime, booking.slot.endTime)}
                    </p>
                    <p className="text-sm text-ink/60">
                      {booking.user.name} ({booking.user.email}) · стол {booking.table.number} ·{" "}
                      {booking.guests} гост.
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <AdminBookingActions bookingId={booking.id} status={booking.status} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
