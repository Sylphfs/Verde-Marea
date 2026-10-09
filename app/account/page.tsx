import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/roles";
import { markNotificationsRead } from "@/app/actions/notifications";
import { Button, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function AccountPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <PageHeader title="Личный кабинет" />

      <Card>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-ink/60">Имя</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink/60">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink/60">Роль</dt>
            <dd>{ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/book" variant="primary">
          Забронировать стол
        </ButtonLink>
        <ButtonLink href="/bookings" variant="secondary">
          Мои бронирования
        </ButtonLink>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-forest">Уведомления</h2>
          <form action={markNotificationsRead}>
            <Button type="submit" variant="outline" size="sm">
              Отметить все прочитанными
            </Button>
          </form>
        </div>

        {notifications.length === 0 ? (
          <EmptyState title="Уведомлений нет" />
        ) : (
          <ul className="mt-4 space-y-2">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Card className={notification.read ? "opacity-70" : ""}>
                  <p className={notification.read ? "" : "font-semibold"}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-ink/50">
                    {notification.createdAt.toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
