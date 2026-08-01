from __future__ import annotations

from pathlib import Path


seller_path = Path("src/components/seller/fulfillment-operations.tsx")
seller = seller_path.read_text()

seller_open = '''    const opened = window.open(
      `/api/orders/${encodeURIComponent(order.id)}/document?${query.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
'''
seller_open_fixed = '''    const opened = window.open(
      `/api/orders/${encodeURIComponent(order.id)}/document?${query.toString()}`,
      '_blank',
    );
'''
if seller_open in seller:
    seller = seller.replace(seller_open, seller_open_fixed, 1)
elif seller_open_fixed not in seller:
    raise SystemExit("Could not locate seller document launcher")

seller_guard = '''      return;
    }

    if (type === 'packing-slip') {
'''
seller_guard_fixed = '''      return;
    }
    opened.opener = null;

    if (type === 'packing-slip') {
'''
if "    opened.opener = null;\n\n    if (type === 'packing-slip')" not in seller:
    if seller_guard not in seller:
        raise SystemExit("Could not locate seller popup guard")
    seller = seller.replace(seller_guard, seller_guard_fixed, 1)

seller_path.write_text(seller)


buyer_path = Path("src/components/buyer/orders-page.tsx")
buyer = buyer_path.read_text()

buyer_open = '''                          const opened = window.open(
                            `/api/orders/${encodeURIComponent(order.id)}/document?${query.toString()}`,
                            '_blank',
                            'noopener,noreferrer',
                          );
'''
buyer_open_fixed = '''                          const opened = window.open(
                            `/api/orders/${encodeURIComponent(order.id)}/document?${query.toString()}`,
                            '_blank',
                          );
'''
if buyer_open in buyer:
    buyer = buyer.replace(buyer_open, buyer_open_fixed, 1)
elif buyer_open_fixed not in buyer:
    raise SystemExit("Could not locate buyer document launcher")

buyer_guard = '''                          if (!opened) {
                            setError(
                              isRTL
                                ? 'تعذر فتح مستند الطلب. تحقق من حظر النوافذ المنبثقة.'
                                : 'The order document could not open. Check the popup blocker.',
                            );
                          }
'''
buyer_guard_fixed = '''                          if (!opened) {
                            setError(
                              isRTL
                                ? 'تعذر فتح مستند الطلب. تحقق من حظر النوافذ المنبثقة.'
                                : 'The order document could not open. Check the popup blocker.',
                            );
                          } else {
                            opened.opener = null;
                          }
'''
if "                          } else {\n                            opened.opener = null;" not in buyer:
    if buyer_guard not in buyer:
        raise SystemExit("Could not locate buyer popup guard")
    buyer = buyer.replace(buyer_guard, buyer_guard_fixed, 1)

buyer_path.write_text(buyer)

print("Document launchers now distinguish popup blocking from noopener isolation.")
