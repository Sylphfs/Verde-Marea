// lib/auth.ts
// Серверная часть аутентификации и сессий.
// ВНИМАНИЕ: импортировать только в серверных компонентах и server actions
// (модуль использует next/headers и Prisma).
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import type { Role, SafeUser } from "./roles";

const SESSION_COOKIE = "session";
const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

/** Хэширование пароля: bcryptjs, 12 раундов (требование ТЗ). */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/** Проверка пароля против сохранённого хэша. */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

/** Создаёт сессию и возвращает случайный токен. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: { token, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  return token;
}

/** Удаляет сессию по токену (выход). */
export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

/**
 * Возвращает текущего пользователя по сессии или null.
 * Используется select без passwordHash — пароль даже не читается из базы.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

/** Требует авторизации: без сессии — redirect на /login. */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Требует одну из ролей: иначе redirect на главную. */
export async function requireRole(...roles: Role[]): Promise<SafeUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
