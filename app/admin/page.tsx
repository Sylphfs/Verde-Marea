import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can, ROLE_LABELS } from "@/lib/roles";
import { ButtonLink, Card } from "@/components/ui";

export default async function AdminDashboard() {
  const user = await requireRole("admin", "super_admin");

  const [bookingsCount, tablesCount, slotsCount, usersCount] = await Promise.all([
    prisma.booking.count(),
    prisma.table.count(),
    prisma.slot.count(),
    prisma.user.count(),
  ]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-forest">Обзор</h2>
      <p className="mt-2 text-ink/60">Ваша роль: {ROLE_LABELS[user.role]}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-sm text-ink/60">Брони</p>
          <p className="text-2xl font-semibold">{bookingsCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink/60">Столы</p>
          <p className="text-2xl font-semibold">{tablesCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink/60">Окна</p>
          <p className="text-2xl font-semibold">{slotsCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-ink/60">Пользователи</p>
          <p className="text-2xl font-semibold">{usersCount}</p>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {can(user.role, "viewAllBookings") ? (
          <ButtonLink href="/admin/bookings" variant="primary">
            Управлять бронями
          </ButtonLink>
        ) : null}
        {can(user.role, "manageSlots") ? (
          <ButtonLink href="/admin/slots" variant="secondary">
            Окна записи
          </ButtonLink>
        ) : null}
        {can(user.role, "viewAuditLog") ? (
          <ButtonLink href="/admin/audit" variant="secondary">
            История изменений
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
