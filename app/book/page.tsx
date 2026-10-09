import { requireUser } from "@/lib/auth";
import { getAvailableSlots, getMaxCapacity } from "@/lib/bookings";
import {
  generateBookableDates,
  toDateKey,
  fromDateKey,
  formatDate,
  formatSlotLabel,
} from "@/lib/booking-rules";
import { SlotList, type AvailableSlot } from "@/components/slot-list";
import { Alert, Button, EmptyState, Field, PageHeader, inputStyles } from "@/components/ui";

interface SearchParams {
  date?: string;
  guests?: string;
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireUser();
  const params = await searchParams;

  const bookableDates = generateBookableDates(new Date());
  const maxCapacity = await getMaxCapacity();

  const selectedDate = params.date ? fromDateKey(params.date) : null;
  const selectedGuests = params.guests ? Number.parseInt(params.guests, 10) : null;

  let slots: AvailableSlot[] = [];
  let error: string | null = null;

  if (selectedDate && selectedGuests && selectedGuests >= 1) {
    const isInHorizon = bookableDates.some((d) => toDateKey(d) === params.date);
    if (!isInHorizon) {
      error = "Выбранная дата вне горизонта бронирования (14 дней, вт–вс)";
    } else if (selectedGuests > maxCapacity) {
      error = "Нет столов на такое количество гостей";
    } else {
      const available = await getAvailableSlots(selectedDate, selectedGuests);
      slots = available.map((slot) => ({
        id: slot.id,
        label: formatSlotLabel(slot.startTime, slot.endTime),
      }));
    }
  }

  return (
    <div>
      <PageHeader
        title="Бронирование стола"
        subtitle="Выберите дату и количество гостей — покажем свободные окна"
      />

      <form method="get" action="/book" className="flex flex-wrap items-end gap-4">
        <Field label="Дата">
          <select name="date" defaultValue={params.date} className={inputStyles}>
            {bookableDates.map((d) => (
              <option key={toDateKey(d)} value={toDateKey(d)}>
                {formatDate(d)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Гостей">
          <select name="guests" defaultValue={params.guests ?? "1"} className={inputStyles}>
            {Array.from({ length: Math.max(1, maxCapacity) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>

        <Button type="submit">Показать окна</Button>
      </form>

      {error ? (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      {!error && selectedDate && selectedGuests ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-forest">
            Свободные окна — {formatDate(selectedDate)}, {selectedGuests} гост.
          </h2>
          {slots.length === 0 ? (
            <EmptyState title="Нет свободных окон на эту дату для такого числа гостей" />
          ) : (
            <SlotList slots={slots} guests={selectedGuests} />
          )}
        </section>
      ) : null}
    </div>
  );
}
