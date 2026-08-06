import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password.ts';

const db = new PrismaClient();
const VALID_ROLES = new Set(['buyer', 'seller', 'admin']);

async function main() {
  const [, , emailInput, password, roleInput = 'buyer', ...nameParts] = process.argv;
  const email = String(emailInput || '').trim().toLowerCase();
  const role = String(roleInput || '').trim().toLowerCase();
  const name = nameParts.join(' ').trim() || email.split('@')[0];

  if (!email || !email.includes('@')) {
    throw new Error(
      'Usage: npm run auth:provision -- user@example.com "strong-password" [buyer|seller|admin] [Display Name]',
    );
  }
  if (!password || password.length < 12 || password.length > 128) {
    throw new Error('Password must be between 12 and 128 characters.');
  }
  if (!VALID_ROLES.has(role)) {
    throw new Error('Role must be buyer, seller, or admin.');
  }

  // Credentials live on User.passwordHash, which is what the session login path reads.
  const passwordHash = await hashPassword(password);
  const user = await db.user.upsert({
    where: { email },
    update: {
      role,
      isBanned: false,
      passwordHash,
    },
    create: {
      email,
      name,
      role,
      passwordHash,
      loyaltyTier: 'bronze',
      loyaltyPoints: 0,
      walletBalance: 0,
      aiCredits: 10,
      isVerified: role === 'admin',
      isBanned: false,
    },
    select: { id: true, email: true, role: true },
  });

  console.log(`Provisioned ${user.email} as ${user.role} (${user.id}).`);
}

main()
  .catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
