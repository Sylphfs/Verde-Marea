"use client";

import { useActionState } from "react";
import { cancelBooking, type BookingActionState } from "@/app/actions/bookings";
import { Button } from "@/components/ui";

export function CancelButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    cancelBooking,
    { ok: false },
  );

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" variant="danger" size="sm" loading={pending}>
        Отменить
      </Button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
