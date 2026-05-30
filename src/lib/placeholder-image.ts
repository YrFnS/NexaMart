/**
 * Utility to generate placeholder image data URIs for products.
 * Used as img src fallback when product images don't resolve.
 */

const categoryColors: Record<string, { from: string; to: string }> = {
  electronics: { from: '#3b82f6', to: '#06b6d4' },
  fashion: { from: '#ec4899', to: '#f43f5e' },
  beauty: { from: '#8b5cf6', to: '#7c3aed' },
  home: { from: '#f59e0b', to: '#f97316' },
  sports: { from: '#22c55e', to: '#10b981' },
  jewelry: { from: '#eab308', to: '#d97706' },
  books: { from: '#14b8a6', to: '#0d9488' },
  food: { from: '#ef4444', to: '#f97316' },
  toys: { from: '#06b6d4', to: '#3b82f6' },
  automotive: { from: '#64748b', to: '#71717a' },
};

function getInitials(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

/**
 * Returns a data URI SVG string for use as an img src fallback.
 * @param category - Product category (electronics, fashion, etc.)
 * @param name - Product name (used for initials)
 * @param width - Image width (default 400)
 * @param height - Image height (default 400)
 */
export function getPlaceholderImage(
  category: string,
  name: string,
  width = 400,
  height = 400
): string {
  const lower = category.toLowerCase();
  const colors = categoryColors[lower] || categoryColors.electronics;
  const initials = name ? getInitials(name) : '?';
  const fontSize = Math.min(width, height) * 0.18;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.from};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.to};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${width * 0.8}" cy="${height * 0.2}" r="${Math.min(width, height) * 0.15}" fill="rgba(255,255,255,0.08)"/>
  <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${Math.min(width, height) * 0.2}" fill="rgba(255,255,255,0.05)"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,-apple-system,sans-serif" font-size="${fontSize}" font-weight="700" fill="rgba(255,255,255,0.9)">${initials}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Returns the URL for the placeholder API route.
 * @param category - Product category
 * @param name - Product name
 * @param width - Image width (default 400)
 * @param height - Image height (default 400)
 */
export function getPlaceholderUrl(
  category: string,
  name: string,
  width = 400,
  height = 400
): string {
  const params = new URLSearchParams({
    category,
    name,
    w: String(width),
    h: String(height),
  });
  return `/api/placeholder/${encodeURIComponent(category)}?${params.toString()}`;
}
