"use client";

import { useActionState } from "react";
import {
  confirmBooking,
  adminCancelBooking,
  completeBooking,
  markNoShow,
  type AdminActionState,
} from "@/app/actions/admin-bookings";
import {
  ALLOWED_TRANSITIONS,
  type BookingStatus,
  type TransitionTarget,
} from "@/lib/booking-status";
import { Button } from "@/components/ui";

const TARGET_ACTIONS: Record<
  TransitionTarget,
  (prev: AdminActionState, formData: FormData) => Promise<AdminActionState>
> = {
  confirmed: confirmBooking,
  cancelled: adminCancelBooking,
  completed: completeBooking,
  no_show: markNoShow,
};

const TARGET_LABELS: Record<TransitionTarget, string> = {
  confirmed: "Подтвердить",
  cancelled: "Отменить",
  completed: "Завершить",
  no_show: "Неявка",
};

function ActionButton({ bookingId, target }: { bookingId: string; target: TransitionTarget }) {
  const action = TARGET_ACTIONS[target];
  const [state, formAction, pending] = useActionState(action, { ok: false });

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" variant="secondary" size="sm" loading={pending}>
        {TARGET_LABELS[target]}
      </Button>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}

export function AdminBookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  // Действия показываются только для разрешённых переходов машины состояний.
  const targets = ALLOWED_TRANSITIONS[status];
  if (targets.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {targets.map((target) => (
        <ActionButton key={target} bookingId={bookingId} target={target} />
      ))}
    </div>
  );
}
