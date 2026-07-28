from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "prisma" / "schema.prisma"
PACKAGE_PATH = ROOT / "package.json"


def replace_once(text: str, old: str, new: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise RuntimeError(f"Expected text was not found: {old!r}")
    return text.replace(old, new, 1)


def model_bounds(schema: str, model_name: str) -> tuple[int, int]:
    marker = f"model {model_name} {{"
    start = schema.find(marker)
    if start == -1:
        raise RuntimeError(f"Model {model_name} was not found")

    opening = schema.find("{", start)
    depth = 0
    for index in range(opening, len(schema)):
        char = schema[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return start, index
    raise RuntimeError(f"Model {model_name} is not balanced")


def add_model_attributes(schema: str, model_name: str, attributes: list[str]) -> str:
    _, closing = model_bounds(schema, model_name)
    missing = [attribute for attribute in attributes if attribute not in schema]
    if not missing:
        return schema

    insertion = "\n" + "\n".join(f"  {attribute}" for attribute in missing) + "\n"
    return schema[:closing] + insertion + schema[closing:]


def patch_schema() -> None:
    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    schema = replace_once(
        schema,
        "  email         String   @unique\n",
        "  email         String   @unique\n  passwordHash  String?\n",
    )
    schema = replace_once(
        schema,
        "  orderNumber     String   @unique\n",
        "  orderNumber     String   @unique\n  idempotencyKey  String?\n",
    )
    schema = replace_once(
        schema,
        "  invoiceNumber String\n",
        "  invoiceNumber String   @unique\n",
    )

    model_attributes = {
        "User": ["@@index([role])"],
        "Store": ["@@index([isVerified])"],
        "Product": [
            "@@index([status, createdAt])",
            "@@index([categoryId, status])",
            "@@index([storeId, status])",
        ],
        "Order": [
            "@@unique([idempotencyKey, storeId])",
            "@@index([userId, createdAt])",
            "@@index([storeId, status])",
        ],
        "Address": ["@@index([userId, isDefault])"],
        "Notification": ["@@index([userId, createdAt])"],
        "Coupon": ["@@index([isActive, expiresAt])"],
        "Return": [
            "@@index([buyerId, status])",
            "@@index([sellerId, status])",
        ],
        "Invoice": [
            "@@index([orderId])",
            "@@index([buyerId, createdAt])",
            "@@index([sellerId, createdAt])",
        ],
        "Payout": [
            "@@index([status, requestedAt])",
            "@@index([sellerId, status])",
        ],
        "Dispute": [
            "@@index([buyerId, status])",
            "@@index([sellerId, status])",
        ],
        "AuditLog": ["@@index([adminId, createdAt])"],
    }

    for model_name, attributes in model_attributes.items():
        schema = add_model_attributes(schema, model_name, attributes)

    SCHEMA_PATH.write_text(schema, encoding="utf-8")


def patch_package_json() -> None:
    package = json.loads(PACKAGE_PATH.read_text(encoding="utf-8"))
    scripts = package.setdefault("scripts", {})
    scripts["typecheck"] = "tsc --noEmit"
    scripts["check"] = "npm run lint && npm run typecheck && npm run build"
    scripts["postinstall"] = "prisma generate"
    scripts["db:deploy"] = "prisma migrate deploy"

    dependencies = package.setdefault("dependencies", {})
    dev_dependencies = package.setdefault("devDependencies", {})
    dependencies["@prisma/client"] = "6.19.2"
    dev_dependencies.pop("@prisma/client", None)
    dev_dependencies["prisma"] = "6.19.2"

    PACKAGE_PATH.write_text(
        json.dumps(package, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    patch_schema()
    patch_package_json()
