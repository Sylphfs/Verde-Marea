import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { can } from "@/lib/roles";
import { Button, ButtonLink, navLinkStyles } from "@/components/ui";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-ink/10 bg-cream">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="font-serif text-2xl font-semibold text-forest">
          Verde Marea
        </Link>

        <nav className="flex flex-wrap items-center gap-1.5">
          {user ? (
            <>
              <Link href="/book" className={navLinkStyles}>
                Забронировать
              </Link>
              <Link href="/bookings" className={navLinkStyles}>
                Мои брони
              </Link>
              <Link href="/account" className={navLinkStyles}>
                Кабинет
              </Link>
              {can(user.role, "viewAllBookings") ? (
                <Link href="/admin" className={navLinkStyles}>
                  Админ-панель
                </Link>
              ) : null}
              <form action={logout} className="ml-2">
                <Button type="submit" variant="outline" size="sm">
                  Выйти
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={navLinkStyles}>
                Войти
              </Link>
              <ButtonLink href="/register" variant="primary" size="sm">
                Регистрация
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
