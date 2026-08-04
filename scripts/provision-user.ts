import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const PASSWORD_PREFIX = 'scrypt';
const VALID_ROLES = new Set(['buyer', 'seller', 'admin']);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${PASSWORD_PREFIX}$${salt}$${derived}`;
}

async function main() {
  const [, , emailInput, password, roleInput = 'buyer', ...nameParts] = process.argv;
  const email = String(emailInput || '').trim().toLowerCase();
  const role = String(roleInput || '').trim().toLowerCase();
  const name = nameParts.join(' ').trim() || email.split('@')[0];

  if (!email || !email.includes('@')) {
    throw new Error(
      'Usage: bun run auth:provision -- user@example.com "strong-password" [buyer|seller|admin] [Display Name]',
    );
  }
  if (!password || password.length < 12 || password.length > 128) {
    throw new Error('Password must be between 12 and 128 characters.');
  }
  if (!VALID_ROLES.has(role)) {
    throw new Error('Role must be buyer, seller, or admin.');
  }

  const passwordHash = hashPassword(password);
  const result = await db.$transaction(async tx => {
    const user = await tx.user.upsert({
      where: { email },
      update: {
        role,
        isBanned: false,
      },
      create: {
        email,
        name,
        role,
        loyaltyTier: 'bronze',
        loyaltyPoints: 0,
        walletBalance: 0,
        aiCredits: 10,
        isVerified: role === 'admin',
        isBanned: false,
      },
    });

    await tx.platformSettings.upsert({
      where: { key: `auth.password.${user.id}` },
      update: { value: passwordHash },
      create: {
        key: `auth.password.${user.id}`,
        value: passwordHash,
      },
    });

    return { id: user.id, email: user.email, role: user.role };
  });

  console.log(`Provisioned ${result.email} as ${result.role} (${result.id}).`);
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
