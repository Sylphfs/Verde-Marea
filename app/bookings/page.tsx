import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingStatusBadge } from "@/components/status-badge";
import { CancelButton } from "@/components/cancel-button";
import { canUserCancel, formatSlotLabel, BOOKING_RULES } from "@/lib/booking-rules";
import { Alert, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { slot: true, table: true },
    orderBy: { slot: { startTime: "desc" } },
  });

  const now = new Date();

  return (
    <div>
      <PageHeader title="Мои бронирования" />

      {params.created ? (
        <div className="mb-4">
          <Alert variant="success">Бронь создана. Ожидает подтверждения администратором.</Alert>
        </div>
      ) : null}

      {bookings.length === 0 ? (
        <EmptyState
          title="У вас пока нет броней"
          action={
            <ButtonLink href="/book" variant="primary">
              Забронировать стол
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => {
            const cancelCheck = canUserCancel(booking.slot.startTime, now);
            const cancellable =
              (booking.status === "pending" || booking.status === "confirmed") &&
              cancelCheck.allowed;

            return (
              <li key={booking.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {formatSlotLabel(booking.slot.startTime, booking.slot.endTime)}
                      </p>
                      <p className="text-sm text-ink/60">
                        Стол {booking.table.number} · {booking.guests} гост.
                      </p>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                    {cancellable ? <CancelButton bookingId={booking.id} /> : null}
                  </div>

                  {(booking.status === "pending" || booking.status === "confirmed") &&
                  !cancelCheck.allowed ? (
                    <p className="mt-2 text-sm text-ink/60">
                      Самостоятельная отмена — не позднее чем за{" "}
                      {BOOKING_RULES.cancelDeadlineHours} ч до начала.
                    </p>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
