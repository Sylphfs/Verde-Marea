"use client";

import { useActionState } from "react";
import { createBooking, type BookingActionState } from "@/app/actions/bookings";
import { Button, Card } from "@/components/ui";

export interface AvailableSlot {
  id: string;
  label: string;
}

function SlotCard({ slot, guests }: { slot: AvailableSlot; guests: number }) {
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    createBooking,
    { ok: false },
  );

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1 font-medium">{slot.label}</span>
        <form action={formAction}>
          <input type="hidden" name="slotId" value={slot.id} />
          <input type="hidden" name="guests" value={guests} />
          <Button type="submit" size="sm" loading={pending}>
            Забронировать
          </Button>
        </form>
      </div>
      {state.error ? <p className="mt-2 text-sm text-danger">{state.error}</p> : null}
    </Card>
  );
}

export function SlotList({ slots, guests }: { slots: AvailableSlot[]; guests: number }) {
  return (
    <ul className="mt-4 space-y-2">
      {slots.map((slot) => (
        <li key={slot.id}>
          <SlotCard slot={slot} guests={guests} />
        </li>
      ))}
    </ul>
  );
}
