import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;

  return [
    'scrypt',
    String(COST),
    String(BLOCK_SIZE),
    String(PARALLELIZATION),
    salt,
    derivedKey.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, cost, blockSize, parallelization, salt, storedKey] = encodedHash.split('$');

  if (
    algorithm !== 'scrypt' ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !storedKey
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(storedKey, 'base64url');
    const actual = (await scrypt(password, salt, expected.length, {
      N: Number(cost),
      r: Number(blockSize),
      p: Number(parallelization),
      maxmem: 64 * 1024 * 1024,
    })) as Buffer;

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
