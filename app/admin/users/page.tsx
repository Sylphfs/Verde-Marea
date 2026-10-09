import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/roles";
import { RoleManager } from "@/components/role-manager";
import { Alert, Card } from "@/components/ui";

export default async function AdminUsersPage() {
  const user = await requireRole("admin", "super_admin");
  const isSuper = user.role === "super_admin";

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-forest">Пользователи</h2>

      {isSuper ? (
        <RoleManager users={users} />
      ) : (
        <>
          <div className="mt-4">
            <Alert variant="info">
              Просмотр пользователей доступен. Смена ролей — только для super_admin.
            </Alert>
          </div>
          <ul className="mt-4 space-y-2">
            {users.map((u) => (
              <li key={u.id}>
                <Card>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-ink/60">
                    {u.email} — {ROLE_LABELS[u.role]}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
