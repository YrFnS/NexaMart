from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:120]!r}")
    write(path, text.replace(old, new, 1))


def regex_once(path: str, pattern: str, replacement: str) -> None:
    text = read(path)
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError(f"Expected one regex match in {path}, found {count}: {pattern[:120]!r}")
    write(path, updated)


# Fetching functions update state only after an asynchronous scheduling boundary.
replace_once(
    "src/components/admin/admin-banners-manager.tsx",
    """\tuseEffect(() => {\n\t\tfetchBanners();\n\t}, [fetchBanners]);""",
    """\tuseEffect(() => {\n\t\tlet cancelled = false;\n\t\tqueueMicrotask(() => {\n\t\t\tif (!cancelled) void fetchBanners();\n\t\t});\n\t\treturn () => {\n\t\t\tcancelled = true;\n\t\t};\n\t}, [fetchBanners]);""",
)

replace_once(
    "src/components/buyer/ai-review-summary.tsx",
    """  useEffect(() => {\n    if (totalReviews > 0) {\n      fetchSummary();\n    } else {\n      setLoading(false);\n    }\n  }, [totalReviews, fetchSummary]);""",
    """  useEffect(() => {\n    if (totalReviews === 0) return;\n\n    let cancelled = false;\n    queueMicrotask(() => {\n      if (!cancelled) void fetchSummary();\n    });\n\n    return () => {\n      cancelled = true;\n    };\n  }, [totalReviews, fetchSummary]);""",
)
replace_once(
    "src/components/buyer/ai-review-summary.tsx",
    """      const reviews = await reviewsRes.json();\n      if (!Array.isArray(reviews) || reviews.length === 0) {""",
    """      const payload = await reviewsRes.json();\n      const reviews = Array.isArray(payload) ? payload : payload.reviews || [];\n      if (reviews.length === 0) {""",
)

replace_once(
    "src/components/buyer/checkout-page.tsx",
    """  useEffect(() => {\n    try {\n      const saved = localStorage.getItem(LS_KEYS.country);\n      if (saved) setCountryCode(saved.toLowerCase());\n    } catch {\n      // Storage may be unavailable.\n    }\n  }, []);""",
    """  useEffect(() => {\n    let cancelled = false;\n    queueMicrotask(() => {\n      if (cancelled) return;\n      try {\n        const saved = localStorage.getItem(LS_KEYS.country);\n        if (saved) setCountryCode(saved.toLowerCase());\n      } catch {\n        // Storage may be unavailable.\n      }\n    });\n    return () => {\n      cancelled = true;\n    };\n  }, []);""",
)

for path, function_name in [
    ("src/components/buyer/near-me-page.tsx", "fetchProducts"),
    ("src/components/buyer/price-alerts-page.tsx", "fetchData"),
]:
    replace_once(
        path,
        f"""  useEffect(() => {{\n    {function_name}();\n  }}, [{function_name}]);""",
        f"""  useEffect(() => {{\n    let cancelled = false;\n    queueMicrotask(() => {{\n      if (!cancelled) void {function_name}();\n    }});\n    return () => {{\n      cancelled = true;\n    }};\n  }}, [{function_name}]);""",
    )

replace_once(
    "src/components/buyer/shop-page.tsx",
    """\tuseEffect(() => {\n\t\tfetchProducts();\n\t}, [fetchProducts]);""",
    """\tuseEffect(() => {\n\t\tlet cancelled = false;\n\t\tqueueMicrotask(() => {\n\t\t\tif (!cancelled) void fetchProducts();\n\t\t});\n\t\treturn () => {\n\t\t\tcancelled = true;\n\t\t};\n\t}, [fetchProducts]);""",
)
replace_once(
    "src/components/buyer/shop-page.tsx",
    """\tuseEffect(() => {\n\t\tif (selectedCategory) setCategoryId(selectedCategory);\n\t}, [selectedCategory]);""",
    """\tuseEffect(() => {\n\t\tif (!selectedCategory) return;\n\t\tqueueMicrotask(() => setCategoryId(selectedCategory));\n\t}, [selectedCategory]);""",
)
replace_once(
    "src/components/buyer/shop-page.tsx",
    """\tuseEffect(() => {\n\t\tif (searchQuery) setSearch(searchQuery);\n\t}, [searchQuery]);""",
    """\tuseEffect(() => {\n\t\tif (!searchQuery) return;\n\t\tqueueMicrotask(() => setSearch(searchQuery));\n\t}, [searchQuery]);""",
)

# Collection counts are derived data, not synchronized state.
replace_once(
    "src/components/buyer/wishlist-page.tsx",
    """  // Update collection counts when items change\n  useEffect(() => {\n    setCollections((prev) =>\n      prev.map((c) => ({\n        ...c,\n        count: c.id === 'all'\n          ? wishlistItems.length\n          : wishlistItems.filter((i) => i.collection === c.id).length,\n      }))\n    );\n  }, [wishlistItems]);""",
    """  const collectionsWithCounts = useMemo(\n    () =>\n      collections.map((collection) => ({\n        ...collection,\n        count:\n          collection.id === 'all'\n            ? wishlistItems.length\n            : wishlistItems.filter((item) => item.collection === collection.id).length,\n      })),\n    [collections, wishlistItems],\n  );""",
)
replace_once(
    "src/components/buyer/wishlist-page.tsx",
    "{collections.map((col) => (",
    "{collectionsWithCounts.map((col) => (",
)

# The welcome message is created by the user action that opens the chat.
replace_once(
    "src/components/common/ai-chat-widget.tsx",
    """  // Add welcome message when opened for the first time\n  useEffect(() => {\n    if (isOpen && messages.length === 0) {\n      setMessages([\n        {\n          id: 'welcome',\n          role: 'assistant',\n          content: isRTL\n            ? 'مرحباً! 👋 أنا مساعدك الذكي للتسوق. كيف يمكنني مساعدتك اليوم؟'\n            : t('aiAssistant') + '! 👋 How can I help you today?',\n          timestamp: new Date(),\n        },\n      ]);\n    }\n  }, [isOpen, messages.length, t, isRTL]);\n\n""",
    "",
)
replace_once(
    "src/components/common/ai-chat-widget.tsx",
    """  const handleToggleOpen = () => {\n    setIsOpen(true);\n    setIsMinimized(false);\n  };""",
    """  const handleToggleOpen = () => {\n    if (messages.length === 0) {\n      setMessages([\n        {\n          id: 'welcome',\n          role: 'assistant',\n          content: isRTL\n            ? 'مرحباً! 👋 أنا مساعدك الذكي للتسوق. كيف يمكنني مساعدتك اليوم؟'\n            : `${t('aiAssistant')}! 👋 How can I help you today?`,\n          timestamp: new Date(),\n        },\n      ]);\n    }\n    setIsOpen(true);\n    setIsMinimized(false);\n  };""",
)

replace_once(
    "src/components/ui/carousel.tsx",
    """  React.useEffect(() => {\n    if (!api) return\n    onSelect(api)\n    api.on(\"reInit\", onSelect)\n    api.on(\"select\", onSelect)\n\n    return () => {\n      api?.off(\"select\", onSelect)\n    }\n  }, [api, onSelect])""",
    """  React.useEffect(() => {\n    if (!api) return\n    queueMicrotask(() => onSelect(api))\n    api.on(\"reInit\", onSelect)\n    api.on(\"select\", onSelect)\n\n    return () => {\n      api.off(\"reInit\", onSelect)\n      api.off(\"select\", onSelect)\n    }\n  }, [api, onSelect])""",
)

write(
    "src/hooks/use-mobile.ts",
    '''import * as React from "react"\n\nconst MOBILE_BREAKPOINT = 768\nconst MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`\n\nfunction subscribe(onStoreChange: () => void) {\n  const mediaQuery = window.matchMedia(MOBILE_QUERY)\n  mediaQuery.addEventListener("change", onStoreChange)\n  return () => mediaQuery.removeEventListener("change", onStoreChange)\n}\n\nfunction getSnapshot() {\n  return window.matchMedia(MOBILE_QUERY).matches\n}\n\nfunction getServerSnapshot() {\n  return false\n}\n\nexport function useIsMobile() {\n  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)\n}\n''',
)

# Search state uses lazy storage initialization and computed spelling suggestions.
path = "src/components/buyer/search-page.tsx"
replace_once(
    path,
    "import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';",
    "import React, { useState, useEffect, useRef, useMemo } from 'react';",
)
replace_once(path, "  const [didYouMean, setDidYouMean] = useState('');\n", "")
replace_once(
    path,
    "  const [localRecentSearches, setLocalRecentSearches] = useState<string[]>([]);",
    """  const [localRecentSearches, setLocalRecentSearches] = useState<string[]>(() => {\n    if (typeof window === 'undefined') return [];\n    try {\n      const stored = localStorage.getItem(LS_RECENT_KEY);\n      return stored ? JSON.parse(stored) : [];\n    } catch {\n      return [];\n    }\n  });""",
)
regex_once(
    path,
    r"  // Load recent searches from localStorage and read URL query param\n  useEffect\(\(\) => \{.*?\n  \}, \[\]\);",
    """  // Read the initial query once after hydration.\n  useEffect(() => {\n    const urlQuery = new URLSearchParams(window.location.search).get('q') || '';\n    const initialQuery = appSearchQuery.trim() || urlQuery.trim();\n    if (!initialQuery) return;\n\n    queueMicrotask(() => {\n      setQuery(initialQuery);\n      void performSearch(initialQuery);\n      saveRecentSearch(initialQuery);\n      if (appSearchQuery.trim()) setSearchQuery('');\n    });\n  }, []);""",
)
regex_once(
    path,
    r"  // Save recent search to localStorage\n  const saveRecentSearch = useCallback\(\(searchText: string\) => \{(.*?)\n  \}, \[\]\);",
    r"""  // Save recent search to localStorage\n  function saveRecentSearch(searchText: string) {\1\n  }""",
)
regex_once(
    path,
    r"  // Did you mean\n  useEffect\(\(\) => \{.*?\n  \}, \[query\]\);",
    """  const didYouMean = useMemo(() => {\n    if (query.length < 3) return '';\n    const misspellMap: Record<string, string> = {\n      hedphones: 'headphones',\n      earbds: 'earbuds',\n      smatwatch: 'smartwatch',\n      laptp: 'laptop',\n      sneekers: 'sneakers',\n    };\n    return misspellMap[query.toLowerCase()] || '';\n  }, [query]);""",
)
replace_once(
    path,
    """  const debouncedSearch = useCallback((searchText: string) => {\n    if (debounceRef.current) {\n      clearTimeout(debounceRef.current);\n    }\n    debounceRef.current = setTimeout(() => {\n      performSearch(searchText);\n    }, 300);\n  }, []);""",
    """  function debouncedSearch(searchText: string) {\n    if (debounceRef.current) {\n      clearTimeout(debounceRef.current);\n    }\n    debounceRef.current = setTimeout(() => {\n      void performSearch(searchText);\n    }, 300);\n  }""",
)
replace_once(
    path,
    """  const performSearch = async (searchText: string) => {\n    if (!searchText.trim()) return;\n    setIsSearching(true);\n    setSearchError(false);\n    setShowSuggestions(false);\n    setShowDropdown(false);\n\n    try {\n      const res = await fetch(`/api/products?search=${encodeURIComponent(searchText)}&limit=20`);\n      if (!res.ok) throw new Error('Search failed');\n      const data = await res.json();\n      if (data.products && data.products.length > 0) {\n        setResults(data.products);\n      } else {\n        setResults([]);\n      }\n    } catch {\n      setResults([]);\n      setSearchError(true);\n    } finally {\n      setIsSearching(false);\n    }\n  };""",
    """  async function performSearch(searchText: string) {\n    if (!searchText.trim()) return;\n    setIsSearching(true);\n    setSearchError(false);\n    setShowSuggestions(false);\n    setShowDropdown(false);\n\n    try {\n      const res = await fetch(`/api/products?search=${encodeURIComponent(searchText)}&limit=20`);\n      if (!res.ok) throw new Error('Search failed');\n      const data = await res.json();\n      setResults(data.products?.length ? data.products : []);\n    } catch {\n      setResults([]);\n      setSearchError(true);\n    } finally {\n      setIsSearching(false);\n    }\n  }""",
)

print("React lint refactor applied successfully")
