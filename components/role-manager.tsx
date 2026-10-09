"use client";

import { useActionState } from "react";
import { changeRole, type ChangeRoleState } from "@/app/actions/admin";
import { ROLES, ROLE_LABELS, type SafeUser } from "@/lib/roles";
import { Button, Card, inputStyles } from "@/components/ui";

function RoleRow({ user }: { user: SafeUser }) {
  const [state, formAction, pending] = useActionState<ChangeRoleState, FormData>(changeRole, {
    ok: false,
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-sm text-ink/60">{user.email}</p>
        </div>

        <form action={formAction} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <select name="role" defaultValue={user.role} className={inputStyles}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <Button type="submit" variant="gold" size="sm" loading={pending}>
            Сохранить
          </Button>
        </form>
      </div>

      {state.error ? <p className="mt-2 text-sm text-danger">{state.error}</p> : null}
    </Card>
  );
}

export function RoleManager({ users }: { users: SafeUser[] }) {
  if (users.length === 0) {
    return <p className="mt-4 text-ink/60">Пользователей нет.</p>;
  }

  return (
    <ul className="mt-4 space-y-2">
      {users.map((user) => (
        <li key={user.id}>
          <RoleRow user={user} />
        </li>
      ))}
    </ul>
  );
}
