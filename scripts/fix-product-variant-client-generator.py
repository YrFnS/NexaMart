from pathlib import Path

path = Path("scripts/apply-product-variant-client.py")
content = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str) -> None:
    global content
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one generator match, found {count}: {old[:120]!r}")
    content = content.replace(old, new, 1)


replace_once(
    """  useEffect(() => {
    setVariantError('');
    const available = selectedVariant?.stock ?? product?.stock ?? 0;
    if (available > 0 && quantity > available) setQuantity(available);
  }, [product?.stock, quantity, selectedVariant]);

""",
    "",
)

replace_once(
    r"    imagesText: product.images.join('\n'),",
    "    imagesText: product.images.join(String.fromCharCode(10)),",
)

replace_once(
    r"""      images: draft.imagesText
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean),""",
    """      images: draft.imagesText
        .split(',')
        .flatMap((value) => value.split(String.fromCharCode(10)))
        .map((value) => value.trim())
        .filter(Boolean),""",
)

replace_once(
    r"      .join('\n');",
    "      .join(String.fromCharCode(10));",
)

replace_once(
    "import React, { useEffect, useMemo, useState } from 'react';",
    "import React, { useCallback, useEffect, useMemo, useState } from 'react';",
)

replace_once(
    """  async function loadProducts() {
    setLoading(true);
""",
    """  const loadProducts = useCallback(async () => {
    setLoading(true);
""",
)

replace_once(
    """    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);
""",
    """    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);
""",
)

path.write_text(content, encoding="utf-8")
print("Product variant client generator fixes applied successfully.")
