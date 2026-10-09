import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTION_LABELS } from "@/lib/booking-status";
import { Card, EmptyState } from "@/components/ui";

export default async function AdminAuditPage() {
  // История изменений доступна только super_admin.
  await requireRole("super_admin");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { email: true, name: true } } },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-forest">История изменений</h2>

      {logs.length === 0 ? (
        <EmptyState title="История пуста" />
      ) : (
        <ul className="mt-6 space-y-2">
          {logs.map((log) => (
            <li key={log.id}>
              <Card>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{ACTION_LABELS[log.action] ?? log.action}</span>
                  <span className="text-ink/50">
                    {log.createdAt.toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink/60">
                  {log.actor ? `${log.actor.name} (${log.actor.email})` : "удалённый пользователь"}
                  {" · "}
                  {log.entity}
                  {log.entityId ? ` #${log.entityId}` : ""}
                </p>
                {log.details ? (
                  <pre className="mt-2 overflow-x-auto rounded bg-cream p-2 text-xs">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
