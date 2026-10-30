// prisma/seed.ts
// Контрольные данные для локальной проверки. Запуск: npx prisma db seed
import { PrismaClient, Role, BookingStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import {
  BOOKING_RULES,
  generateBookableDates,
  generateSlotsForDay,
} from "../lib/booking-rules.ts";

// pg-адаптер: TLS через Node.js — работает на Windows (движок Prisma на Windows не всегда).
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const SALT_ROUNDS = 12; // bcryptjs: 12 раундов

async function main(): Promise<void> {
  // 1. Столы (вместимость разная — для проверки правила «подходящий стол»)
  const tables = [
    { number: 1, capacity: 2 },
    { number: 2, capacity: 2 },
    { number: 3, capacity: 4 },
    { number: 4, capacity: 6 },
  ];

  for (const table of tables) {
    await prisma.table.upsert({
      where: { number: table.number },
      update: { capacity: table.capacity },
      create: table,
    });
  }

  // 2. Пользователи: super_admin и демо-гость (пароль — только хэш)
  const adminPasswordHash = await hash("Admin123!", SALT_ROUNDS);
  const guestPasswordHash = await hash("Guest123!", SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: "admin@verdemarea.local" },
    update: { role: Role.super_admin },
    create: {
      email: "admin@verdemarea.local",
      name: "Администратор Verde Marea",
      passwordHash: adminPasswordHash,
      role: Role.super_admin,
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: "guest@verdemarea.local" },
    update: {},
    create: {
      email: "guest@verdemarea.local",
      name: "Демо Гость",
      passwordHash: guestPasswordHash,
      role: Role.user,
    },
  });

  // 3. Окна бронирования на ближайшие 14 дней (единые правила из lib/booking-rules)
  const days = generateBookableDates(new Date(), BOOKING_RULES.horizonDays);
  for (const day of days) {
    for (const slotWindow of generateSlotsForDay(day)) {
      await prisma.slot.upsert({
        where: {
          startTime_endTime: { startTime: slotWindow.startTime, endTime: slotWindow.endTime },
        },
        update: {},
        create: slotWindow,
      });
    }
  }

  // 4. Демо-брони (только если по броням база ещё пуста)
  const existingBookings = await prisma.booking.count();
  if (existingBookings === 0) {
    const futureSlots = await prisma.slot.findMany({
      where: { startTime: { gt: new Date() } },
      orderBy: { startTime: "asc" },
      take: 2,
    });

    const demoTable2 = await prisma.table.findUnique({ where: { number: 2 } });
    const demoTable4 = await prisma.table.findUnique({ where: { number: 4 } });

    // Две брони на разные окна и разные столы — правила дублей не нарушаются.
    if (futureSlots.length === 2 && demoTable2 && demoTable4) {
      await prisma.booking.createMany({
        data: [
          {
            userId: guest.id,
            slotId: futureSlots[0].id,
            tableId: demoTable2.id,
            guests: 2,
            status: BookingStatus.confirmed,
          },
          {
            userId: guest.id,
            slotId: futureSlots[1].id,
            tableId: demoTable4.id,
            guests: 4,
            status: BookingStatus.pending,
          },
        ],
      });
    }
  }

  const [usersCount, tablesCount, slotsCount, bookingsCount] = await Promise.all([
    prisma.user.count(),
    prisma.table.count(),
    prisma.slot.count(),
    prisma.booking.count(),
  ]);

  console.log("Seed завершён:");
  console.log(`  пользователи: ${usersCount}`);
  console.log(`  столы: ${tablesCount}`);
  console.log(`  окна: ${slotsCount}`);
  console.log(`  брони: ${bookingsCount}`);
  console.log("  super_admin: admin@verdemarea.local / Admin123!");
  console.log("  гость: guest@verdemarea.local / Guest123!");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
