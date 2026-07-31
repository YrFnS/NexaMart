from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    content = file_path.read_text(encoding="utf-8")
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:100]!r}")
    file_path.write_text(content.replace(old, new, 1), encoding="utf-8")


def replace_all(path: str, old: str, new: str, minimum: int = 1) -> None:
    file_path = Path(path)
    content = file_path.read_text(encoding="utf-8")
    count = content.count(old)
    if count < minimum:
        raise RuntimeError(f"Expected at least {minimum} matches in {path}, found {count}")
    file_path.write_text(content.replace(old, new), encoding="utf-8")


# Product cards cannot silently choose size/color options. Products with
# configured choices now open the detail page, while simple products retain
# one-click add-to-cart.
replace_once(
    "src/components/buyer/product-card.tsx",
    'import { useCartStore } from "@/stores/cart-store";\n',
    'import { useCartStore } from "@/stores/cart-store";\nimport { parseVariationOptions } from "@/lib/checkout-authority";\n',
)
replace_once(
    "src/components/buyer/product-card.tsx",
    "\t\te.preventDefault();\n\t\te.stopPropagation();\n\t\tsetCartBounce(true);",
    "\t\te.preventDefault();\n\t\te.stopPropagation();\n\t\tif (Object.keys(parseVariationOptions(product.variations)).length > 0) {\n\t\t\tnav.selectProduct(product.id);\n\t\t\treturn;\n\t\t}\n\t\tsetCartBounce(true);",
)
replace_once(
    "src/components/buyer/product-card.tsx",
    '\t\t\tstoreName: product.store?.name || "",\n\t\t});',
    '\t\t\tstoreName: product.store?.name || "",\n\t\t\thasFreeShipping: product.hasFreeShipping,\n\t\t});',
)

# Full product pages preserve the selected option combination and free-shipping
# eligibility on the cart line.
replace_once(
    "src/components/buyer/product-detail-page.tsx",
    "      storeName: product.store?.name || '',\n      variation: JSON.stringify(selectedVariations),",
    "      storeName: product.store?.name || '',\n      hasFreeShipping: product.hasFreeShipping,\n      variation: JSON.stringify(selectedVariations),",
)

# Quick view cannot represent a complete variation selection. Route configured
# products to full details instead of creating an invalid cart line.
replace_once(
    "src/components/buyer/product-quick-view.tsx",
    "  const handleAddToCart = () => {\n    for (let i = 0; i < quantity; i++) {",
    "  const handleAddToCart = () => {\n    if (variationKeys.length > 0) {\n      nav.selectProduct(product.id);\n      onClose();\n      return;\n    }\n\n    for (let i = 0; i < quantity; i++) {",
)
replace_once(
    "src/components/buyer/product-quick-view.tsx",
    "        storeName: product.store?.name || '',\n      });",
    "        storeName: product.store?.name || '',\n        hasFreeShipping: product.hasFreeShipping,\n      });",
)

# Cart mutations and React keys must target the unique product+variation line.
replace_once(
    "src/components/buyer/cart-page.tsx",
    "                  <React.Fragment key={item.productId}>",
    "                  <React.Fragment key={item.lineId}>",
)
replace_once(
    "src/components/buyer/cart-page.tsx",
    "onClick={() => setRemoveTarget(item.productId)}",
    "onClick={() => setRemoveTarget(item.lineId)}",
)
replace_all(
    "src/components/buyer/cart-page.tsx",
    "updateQuantity(item.productId,",
    "updateQuantity(item.lineId,",
    minimum=2,
)

# Mini-cart and checkout review keys also need the variation-safe line ID.
replace_once(
    "src/components/layout/header.tsx",
    "                    {useCartStore.getState().items.slice(0, 3).map((item) => (\n                      <div key={item.productId}",
    "                    {useCartStore.getState().items.slice(0, 3).map((item) => (\n                      <div key={item.lineId}",
)
replace_once(
    "src/components/buyer/checkout/components/checkout-review.tsx",
    "interface CartItem {\n  productId: string;",
    "interface CartItem {\n  lineId: string;\n  productId: string;",
)
replace_once(
    "src/components/buyer/checkout/components/checkout-review.tsx",
    '<div key={item.productId} className="flex items-center gap-3">',
    '<div key={item.lineId} className="flex items-center gap-3">',
)

# Checkout preview derives jurisdiction from the selected address and mirrors
# per-store shipping. The server remains authoritative and returns the final
# reconciled amount.
replace_once(
    "src/components/buyer/checkout-page.tsx",
    "import { calculateTax } from '@/lib/tax';\n",
    "import { calculateTax } from '@/lib/tax';\nimport {\n  calculateStoreShippingCents,\n  resolveTaxCountryCode,\n  toCents,\n} from '@/lib/checkout-authority';\n",
)
replace_once(
    "src/components/buyer/checkout-page.tsx",
    "  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);\n  const [countryCode, setCountryCode] = useState('iq');",
    "  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);",
)
replace_once(
    "src/components/buyer/checkout-page.tsx",
    "\n  useEffect(() => {\n    let cancelled = false;\n    queueMicrotask(() => {\n      if (cancelled) return;\n      try {\n        const saved = localStorage.getItem(LS_KEYS.country);\n        if (saved) setCountryCode(saved.toLowerCase());\n      } catch {\n        // Storage may be unavailable.\n      }\n    });\n    return () => {\n      cancelled = true;\n    };\n  }, []);\n",
    "\n",
)
replace_once(
    "src/components/buyer/checkout-page.tsx",
    "  const itemCount = getItemCount();\n  const subtotal = getTotal();\n  const selectedShipping =\n    SHIPPING_METHODS.find((method) => method.id === selectedShippingId) ||\n    SHIPPING_METHODS[0];\n  const shippingCost =\n    selectedShipping.price === 0 && selectedShippingId === 'standard'\n      ? subtotal >= SHIPPING_CONFIG.freeShippingThreshold\n        ? 0\n        : 9.99\n      : selectedShipping.price;\n  const taxResult = calculateTax(subtotal, countryCode, undefined, currency);\n  const tax = taxResult.taxAmount;\n  const taxRate = taxResult.taxRate;\n  const taxLabel = isRTL ? taxResult.taxLabelAr : taxResult.taxLabel;\n  const isTaxExempt = taxResult.isTaxExempt;\n  const total = taxResult.total + shippingCost - couponDiscount;\n\n  const selectedAddress = savedAddresses.find(\n    (address) => address.id === selectedAddressId,\n  );\n  const selectedPayment = PAYMENT_METHODS.find(\n    (method) => method.id === selectedPaymentId,\n  );\n  const stepIndex = STEPS.findIndex((step) => step.key === currentStep);",
    "  const itemCount = getItemCount();\n  const subtotal = getTotal();\n  const selectedAddress = savedAddresses.find(\n    (address) => address.id === selectedAddressId,\n  );\n  const selectedShipping =\n    SHIPPING_METHODS.find((method) => method.id === selectedShippingId) ||\n    SHIPPING_METHODS[0];\n  const addressForTotals =\n    selectedAddress || (showNewAddress ? newAddress : undefined);\n  const taxCountryCode =\n    resolveTaxCountryCode(addressForTotals?.country || '') || 'iq';\n  const itemsByStore = new Map<string, typeof items>();\n  for (const item of items) {\n    const storeItems = itemsByStore.get(item.storeId) || [];\n    storeItems.push(item);\n    itemsByStore.set(item.storeId, storeItems);\n  }\n  const shippingCost = [...itemsByStore.values()].reduce(\n    (sum, storeItems) => {\n      const storeSubtotalCents = storeItems.reduce(\n        (storeSum, item) =>\n          storeSum + toCents(item.price) * item.quantity,\n        0,\n      );\n      const storeShippingCents = calculateStoreShippingCents(\n        selectedShippingId as 'standard' | 'express' | 'next_day',\n        storeSubtotalCents,\n        storeItems.map((item) => ({\n          hasFreeShipping: Boolean(item.hasFreeShipping),\n        })),\n      );\n      return sum + storeShippingCents / 100;\n    },\n    0,\n  );\n  const taxableSubtotal = Math.max(0, subtotal - couponDiscount);\n  const taxResult = calculateTax(taxableSubtotal, taxCountryCode);\n  const tax = taxResult.taxAmount;\n  const taxRate = taxResult.taxRate;\n  const taxLabel = isRTL ? taxResult.taxLabelAr : taxResult.taxLabel;\n  const isTaxExempt = taxResult.isTaxExempt;\n  const total = taxableSubtotal + shippingCost + tax;\n\n  const selectedPayment = PAYMENT_METHODS.find(\n    (method) => method.id === selectedPaymentId,\n  );\n  const stepIndex = STEPS.findIndex((step) => step.key === currentStep);",
)
replace_once(
    "src/components/buyer/checkout-page.tsx",
    "          countryCode,\n          couponCode: appliedCoupon?.code,",
    "          couponCode: appliedCoupon?.code,",
)

print("Checkout client authority updates applied successfully.")
