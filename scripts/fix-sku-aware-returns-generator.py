from pathlib import Path

path = Path("scripts/apply-sku-aware-returns.py")
content = path.read_text(encoding="utf-8")

old = '''  const selectedItem = useMemo(() => {
    for (const order of eligibleOrders) {
      const item = order.items.find((current) => current.orderItemId === orderItemId);
      if (item) return { order, item };
    }
    return null;
  }, [eligibleOrders, orderItemId]);'''
new = '''  const selectedItem = (() => {
    for (const order of eligibleOrders) {
      const item = order.items.find((current) => current.orderItemId === orderItemId);
      if (item) return { order, item };
    }
    return null;
  })();'''

count = content.count(old)
if count != 1:
    raise RuntimeError(f"Expected one selected-item memo block, found {count}")

path.write_text(content.replace(old, new, 1), encoding="utf-8")
print("SKU-aware returns generator lint fix applied.")
