from __future__ import annotations

import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]

seed_path = root / "prisma/seed.ts"
seed = seed_path.read_text(encoding="utf-8")

old_import = 'import { PrismaClient } from "@prisma/client";\n'
new_import = (
    'import { PrismaClient } from "@prisma/client";\n'
    'import { hashPassword } from "../src/lib/password.ts";\n'
)
if new_import not in seed:
    if seed.count(old_import) != 1:
        raise RuntimeError("Unexpected Prisma seed import block")
    seed = seed.replace(old_import, new_import, 1)

old_main = "async function main() {\n\tconst now = new Date();\n"
new_main = """async function main() {
	const now = new Date();
	const seedPassword = process.env.SEED_DEMO_PASSWORD;
	if (!seedPassword || seedPassword.length < 12) {
		throw new Error(
			"SEED_DEMO_PASSWORD with at least 12 characters is required before seeding.",
		);
	}
	const passwordHash = await hashPassword(seedPassword);
"""
if new_main not in seed:
    if seed.count(old_main) != 1:
        raise RuntimeError("Unexpected Prisma seed main block")
    seed = seed.replace(old_main, new_main, 1)

start_marker = "\tconst users = await db.user.createMany({"
end_marker = "\n\t});\n\n\tconst allUsers = await db.user.findMany"
start = seed.index(start_marker)
end = seed.index(end_marker, start)
users_block = seed[start:end]
if "passwordHash," not in users_block:
    users_block, count = re.subn(
        r'(\t\t\t\temail: "[^"]+",\n)',
        r'\1\t\t\t\tpasswordHash,\n',
        users_block,
    )
    if count != 10:
        raise RuntimeError(f"Expected 10 seeded users, found {count}")
    seed = seed[:start] + users_block + seed[end:]

seed_path.write_text(seed, encoding="utf-8")

package_path = root / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
package.setdefault("scripts", {})["db:seed"] = "prisma db seed"
package["scripts"]["auth:set-password"] = (
    "node --experimental-strip-types scripts/set-user-password.ts"
)
package["prisma"] = {
    "seed": "node --experimental-strip-types prisma/seed.ts"
}
package_path.write_text(
    json.dumps(package, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
)

env_path = root / ".env.example"
env = env_path.read_text(encoding="utf-8")
seed_env = '''
# Required only when running `npm run db:seed`.
SEED_DEMO_PASSWORD=""
'''
if "SEED_DEMO_PASSWORD" not in env:
    env = env.rstrip() + "\n" + seed_env
env_path.write_text(env, encoding="utf-8")

readme_path = root / "README.md"
readme = readme_path.read_text(encoding="utf-8")
old_setup = """npm run db:deploy
npm run db:generate
npm run dev
"""
new_setup = """npm run db:deploy
npm run db:generate
SEED_DEMO_PASSWORD='choose-a-development-password' npm run db:seed
npm run dev
"""
if new_setup not in readme:
    if readme.count(old_setup) != 1:
        raise RuntimeError("Unexpected README local setup block")
    readme = readme.replace(old_setup, new_setup, 1)

marker = """`ADMIN_SECRET_KEY` is optional and intended only for trusted server-to-server automation. It must never use a `NEXT_PUBLIC_` prefix or be stored in a browser.
"""
bootstrap_docs = """

Existing users created before this authentication migration have no password hash. Initialize each account deliberately after deployment; use a mounted secret file in production so the password is not written into shell history:

```bash
AUTH_BOOTSTRAP_EMAIL="admin@nexamart.com" \\
AUTH_BOOTSTRAP_PASSWORD_FILE="/run/secrets/nexamart-admin-password" \\
npm run auth:set-password
```
"""
if "AUTH_BOOTSTRAP_PASSWORD_FILE" not in readme:
    if readme.count(marker) != 1:
        raise RuntimeError("Unexpected README admin secret paragraph")
    readme = readme.replace(marker, marker + bootstrap_docs, 1)

readme_path.write_text(readme, encoding="utf-8")

print("Seed and existing-user authentication bootstrap configured")
