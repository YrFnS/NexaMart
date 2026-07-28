import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password.ts';

const db = new PrismaClient();

async function main() {
  const email = process.env.AUTH_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.AUTH_BOOTSTRAP_PASSWORD;

  if (!email) {
    throw new Error('AUTH_BOOTSTRAP_EMAIL is required.');
  }
  if (!password || password.length < 12) {
    throw new Error('AUTH_BOOTSTRAP_PASSWORD must contain at least 12 characters.');
  }

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });
  if (!existing) {
    throw new Error(`No NexaMart user exists with email ${email}.`);
  }

  const passwordHash = await hashPassword(password);
  await db.user.update({
    where: { id: existing.id },
    data: { passwordHash },
  });

  console.log(`Password initialized for ${existing.email} (${existing.role}).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
