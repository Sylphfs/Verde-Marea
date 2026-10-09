"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

const changeRoleSchema = z.object({
  userId: z.string().min(1, "Не указан пользователь"),
  role: z.enum(ROLES),
});

export type ChangeRoleState = { ok: boolean; error?: string };

export async function changeRole(
  _prev: ChangeRoleState,
  formData: FormData,
): Promise<ChangeRoleState> {
  // Серверная проверка: менять роли может только super_admin.
  // Обычный admin сюда не пройдёт — в том числе не сможет менять роль super_admin.
  const actor = await getCurrentUser();
  if (!actor) {
    return { ok: false, error: "Требуется вход" };
  }
  if (actor.role !== "super_admin") {
    return { ok: false, error: "Недостаточно прав: роли меняет только super_admin" };
  }

  const parsed = changeRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Некорректные данные" };
  }

  const { userId } = parsed.data;
  const newRole = parsed.data.role;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!target) {
    return { ok: false, error: "Пользователь не найден" };
  }

  // Защита от блокировки системы: нельзя понизить единственного super_admin.
  if (target.role === "super_admin" && newRole !== "super_admin") {
    const superAdminCount = await prisma.user.count({ where: { role: "super_admin" } });
    if (superAdminCount <= 1) {
      return { ok: false, error: "Нельзя понизить единственного super_admin" };
    }
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { role: newRole },
  });

  // Служебный сценарий: фиксируем изменение роли в журнале.
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "user.role_changed",
      entity: "User",
      entityId: target.id,
      details: { from: target.role, to: newRole },
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}
