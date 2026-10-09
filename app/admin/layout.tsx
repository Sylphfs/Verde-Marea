import type { ReactNode } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/roles";
import { navLinkStyles } from "@/components/ui";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Административный контур доступен только admin и super_admin.
  const user = await requireRole("admin", "super_admin");

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold text-forest">Админ-панель</h1>
        <p className="text-sm text-ink/60">
          {user.email} — {ROLE_LABELS[user.role]}
        </p>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2 border-b border-ink/10 pb-4">
        <Link href="/admin" className={navLinkStyles}>
          Обзор
        </Link>
        {can(user.role, "viewAllBookings") ? (
          <Link href="/admin/bookings" className={navLinkStyles}>
            Бронирования
          </Link>
        ) : null}
        {can(user.role, "manageSlots") ? (
          <Link href="/admin/slots" className={navLinkStyles}>
            Окна
          </Link>
        ) : null}
        {can(user.role, "viewUsers") ? (
          <Link href="/admin/users" className={navLinkStyles}>
            Пользователи
          </Link>
        ) : null}
        {can(user.role, "viewAuditLog") ? (
          <Link href="/admin/audit" className={navLinkStyles}>
            История
          </Link>
        ) : null}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
