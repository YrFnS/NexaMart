import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const unsupportedPayments = await db.order.count({
    where: {
      OR: [
        { paymentMethod: { not: 'cash_on_delivery' } },
        { paymentStatus: { not: 'not_applicable' } },
      ],
    },
  });
  if (unsupportedPayments !== 0) {
    throw new Error(`Seed contains ${unsupportedPayments} payment-enabled orders.`);
  }

  const orders = await db.order.findMany({
    include: { statusEvents: true, items: true },
  });
  if (orders.length === 0) throw new Error('No seeded orders were found.');
  if (orders.some((order) => order.statusEvents.length === 0)) {
    throw new Error('Every seeded order must have a status event.');
  }
  const pending = orders.find((order) => order.status === 'pending');
  if (pending && !pending.confirmationExpiresAt) {
    throw new Error('Pending orders require a seller confirmation deadline.');
  }

  console.log(
    JSON.stringify(
      {
        orders: orders.length,
        statusEvents: orders.reduce(
          (sum, order) => sum + order.statusEvents.length,
          0,
        ),
        pendingConfirmationDeadline:
          pending?.confirmationExpiresAt?.toISOString() || null,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
