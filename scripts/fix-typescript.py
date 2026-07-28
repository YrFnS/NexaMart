from pathlib import Path

root = Path(__file__).resolve().parents[1]

password_path = root / "src/lib/password.ts"
password_path.write_text(
    """import {\n  randomBytes,\n  scrypt as scryptCallback,\n  timingSafeEqual,\n  type ScryptOptions,\n} from 'node:crypto';\n\nconst KEY_LENGTH = 64;\nconst COST = 16_384;\nconst BLOCK_SIZE = 8;\nconst PARALLELIZATION = 1;\n\nfunction deriveKey(\n  password: string,\n  salt: string,\n  length: number,\n  options: ScryptOptions,\n): Promise<Buffer> {\n  return new Promise((resolve, reject) => {\n    scryptCallback(password, salt, length, options, (error, derivedKey) => {\n      if (error) {\n        reject(error);\n        return;\n      }\n      resolve(derivedKey);\n    });\n  });\n}\n\nexport async function hashPassword(password: string): Promise<string> {\n  const salt = randomBytes(16).toString('base64url');\n  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, {\n    N: COST,\n    r: BLOCK_SIZE,\n    p: PARALLELIZATION,\n    maxmem: 64 * 1024 * 1024,\n  });\n\n  return [\n    'scrypt',\n    String(COST),\n    String(BLOCK_SIZE),\n    String(PARALLELIZATION),\n    salt,\n    derivedKey.toString('base64url'),\n  ].join('$');\n}\n\nexport async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {\n  const [algorithm, cost, blockSize, parallelization, salt, storedKey] =\n    encodedHash.split('$');\n\n  if (\n    algorithm !== 'scrypt' ||\n    !cost ||\n    !blockSize ||\n    !parallelization ||\n    !salt ||\n    !storedKey\n  ) {\n    return false;\n  }\n\n  try {\n    const expected = Buffer.from(storedKey, 'base64url');\n    const actual = await deriveKey(password, salt, expected.length, {\n      N: Number(cost),\n      r: Number(blockSize),\n      p: Number(parallelization),\n      maxmem: 64 * 1024 * 1024,\n    });\n\n    return expected.length === actual.length && timingSafeEqual(expected, actual);\n  } catch {\n    return false;\n  }\n}\n""",
    encoding="utf-8",
)

security_path = root / "src/lib/security.ts"
security = security_path.read_text(encoding="utf-8")
old = ".replace(/<script[^>]*>.*?<\\/script>/gis, '')"
new = ".replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, '')"
if security.count(old) != 1:
    raise RuntimeError(f"Expected one security regex match, found {security.count(old)}")
security_path.write_text(security.replace(old, new, 1), encoding="utf-8")

print("TypeScript compatibility fixes applied")
