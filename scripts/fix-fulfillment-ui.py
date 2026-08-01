from __future__ import annotations

from pathlib import Path


seller_path = Path("src/components/seller/fulfillment-operations.tsx")
seller_source = seller_path.read_text()
nullable_expression = (
    "Boolean(replacement) && replacement.status !== 'preparing'"
)
null_safe_expression = (
    "replacement ? replacement.status !== 'preparing' : false"
)
nullable_count = seller_source.count(nullable_expression)
if nullable_count not in (0, 3):
    raise SystemExit(
        f"Expected zero or three nullable replacement checks, found {nullable_count}"
    )
if nullable_count:
    seller_source = seller_source.replace(
        nullable_expression,
        null_safe_expression,
    )
seller_path.write_text(seller_source)


buyer_path = Path("src/components/buyer/orders-page.tsx")
buyer_source = buyer_path.read_text()

if "  FileText,\n" not in buyer_source:
    icon_anchor = "  Clock3,\n  Loader2,"
    if icon_anchor not in buyer_source:
        raise SystemExit("Could not locate buyer order icon anchor")
    buyer_source = buyer_source.replace(
        icon_anchor,
        "  Clock3,\n  FileText,\n  Loader2,",
        1,
    )

if "Open order document" not in buyer_source:
    action_anchor = '''                    <div className="flex flex-wrap justify-end gap-2 p-4">
                      <Button variant="outline" onClick={() => buyAgain(order)}>
'''
    document_button = '''                    <div className="flex flex-wrap justify-end gap-2 p-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const query = new URLSearchParams({
                            type: 'order',
                            lang: isRTL ? 'ar' : 'en',
                            print: '1',
                          });
                          const opened = window.open(
                            `/api/orders/${encodeURIComponent(order.id)}/document?${query.toString()}`,
                            '_blank',
                            'noopener,noreferrer',
                          );
                          if (!opened) {
                            setError(
                              isRTL
                                ? 'تعذر فتح مستند الطلب. تحقق من حظر النوافذ المنبثقة.'
                                : 'The order document could not open. Check the popup blocker.',
                            );
                          }
                        }}
                      >
                        <FileText className="me-2 size-4" />
                        {isRTL ? 'فتح مستند الطلب' : 'Open order document'}
                      </Button>
                      <Button variant="outline" onClick={() => buyAgain(order)}>
'''
    if action_anchor not in buyer_source:
        raise SystemExit("Could not locate buyer order action anchor")
    buyer_source = buyer_source.replace(
        action_anchor,
        document_button,
        1,
    )

buyer_path.write_text(buyer_source)

print("Fulfillment UI nullability and buyer document access normalized.")
