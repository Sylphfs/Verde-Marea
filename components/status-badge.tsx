import { cn } from "@/components/ui";
import { STATUS_LABELS, type BookingStatus } from "@/lib/booking-status";

const STATUS_CLASSES: Record<BookingStatus, string> = {
  pending: "bg-gold text-ink",
  confirmed: "bg-forest text-cream",
  cancelled: "bg-ink/10 text-ink",
  completed: "bg-forest text-cream",
  no_show: "bg-danger text-cream",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
