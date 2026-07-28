from __future__ import annotations

import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]

package_path = root / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
dependencies = package.get("dependencies", {})
dependencies.pop("socket.io", None)
dependencies.pop("socket.io-client", None)
package_path.write_text(
    json.dumps(package, indent=2, ensure_ascii=False) + "\n",
    encoding="utf-8",
)

schema_path = root / "prisma/schema.prisma"
schema = schema_path.read_text(encoding="utf-8")
old_chat = """model ChatMessage {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  message    String
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())
}
"""
new_chat = """model ChatMessage {
  id         String   @id @default(cuid())
  senderId   String
  receiverId String
  message    String
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())

  @@index([senderId, receiverId, createdAt])
}
"""
if new_chat not in schema:
    if schema.count(old_chat) != 1:
        raise RuntimeError("Unexpected ChatMessage model")
    schema = schema.replace(old_chat, new_chat, 1)
schema_path.write_text(schema, encoding="utf-8")

migration_path = (
    root
    / "prisma/migrations/production_hardening_chat_20260729/migration.sql"
)
migration_path.parent.mkdir(parents=True, exist_ok=True)
migration_path.write_text(
    'CREATE INDEX "ChatMessage_senderId_receiverId_createdAt_idx" '
    'ON "ChatMessage"("senderId", "receiverId", "createdAt");\n',
    encoding="utf-8",
)

env_path = root / ".env.example"
env = env_path.read_text(encoding="utf-8")
needle = 'ADMIN_SECRET_KEY=""\n'
replacement = (
    'ADMIN_SECRET_KEY=""\n'
    '# Required only when ADMIN_SECRET_KEY automation performs audited writes.\n'
    'ADMIN_AUTOMATION_USER_ID=""\n'
)
if "ADMIN_AUTOMATION_USER_ID" not in env:
    if env.count(needle) != 1:
        raise RuntimeError("Unexpected admin environment block")
    env = env.replace(needle, replacement, 1)
env_path.write_text(env, encoding="utf-8")

readme_path = root / "README.md"
readme = readme_path.read_text(encoding="utf-8")
old_admin = (
    "`ADMIN_SECRET_KEY` is optional and intended only for trusted "
    "server-to-server automation. It must never use a `NEXT_PUBLIC_` prefix "
    "or be stored in a browser."
)
new_admin = (
    "`ADMIN_SECRET_KEY` is optional and intended only for trusted "
    "server-to-server automation. It must never use a `NEXT_PUBLIC_` prefix "
    "or be stored in a browser. Audited automation must also set "
    "`ADMIN_AUTOMATION_USER_ID` to the ID of an existing administrator account."
)
if new_admin not in readme:
    if readme.count(old_admin) != 1:
        raise RuntimeError("Unexpected README admin automation paragraph")
    readme = readme.replace(old_admin, new_admin, 1)
readme_path.write_text(readme, encoding="utf-8")

print("Final hardening cleanup applied")
