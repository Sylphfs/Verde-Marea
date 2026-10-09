"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  getSessionToken,
  destroySession,
  clearSessionCookie,
} from "@/lib/auth";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Имя должно быть не короче 2 символов")
    .max(80, "Имя слишком длинное"),
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z
    .string()
    .min(8, "Пароль должен быть не короче 8 символов")
    // bcryptjs использует только первые 72 байта пароля.
    .max(72, "Пароль слишком длинный"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type AuthFormState = { error?: string };

export async function register(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте введённые данные" };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Пользователь с таким email уже существует" };
  }

  // Пароль хранится только как bcrypt-хэш (12 раундов, требование ТЗ).
  const passwordHash = await hashPassword(password);

  let user: { id: string };
  try {
    user = await prisma.user.create({
      data: { name, email, passwordHash, role: "user" },
    });
  } catch (error) {
    // Страховка от гонки: уникальность email гарантирована и на уровне БД.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Пользователь с таким email уже существует" };
    }
    throw error;
  }

  await setSessionCookie(await createSession(user.id));
  redirect("/account");
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Введите корректный email и пароль" };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Один и тот же ответ для несуществующего email и неверного пароля,
  // чтобы не раскрывать, зарегистрирован ли такой email.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Неверный email или пароль" };
  }

  await setSessionCookie(await createSession(user.id));
  redirect("/account");
}

export async function logout(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await destroySession(token);
  }
  await clearSessionCookie();
  redirect("/");
}
