import { NextRequest } from 'next/server';

// Category-to-color mapping for placeholder images
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

// Category icons (simple SVG paths)
const categoryIcons: Record<string, string> = {
  electronics: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  fashion: 'M12 2C8 2 4 6 4 10c0 6 8 12 8 12s8-6 8-12c0-4-4-8-8-8z',
  beauty: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  home: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10',
  sports: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6v-4m0-4h.01',
  jewelry: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  books: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 004 17V5a2 2 0 012-2h14v14H6.5A2.5 2.5 0 004 19.5z',
  food: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-6v4m4-4v4m4-4v4',
  toys: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
  automotive: 'M5 17h14M5 17a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2M5 17l-1 3m15-3l1 3M9 9h6',
};

function getCategoryFromPath(path: string): string {
  const lower = path.toLowerCase();
  for (const cat of Object.keys(categoryColors)) {
    if (lower.includes(cat)) return cat;
  }
  return 'electronics'; // default
}

function getInitials(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const fullPath = pathSegments.join('/');

  const { searchParams } = new URL(request.url);
  const width = parseInt(searchParams.get('w') || '400');
  const height = parseInt(searchParams.get('h') || '400');
  const name = searchParams.get('name') || '';
  const category = searchParams.get('category') || getCategoryFromPath(fullPath);

  const colors = categoryColors[category] || categoryColors.electronics;
  const initials = name ? getInitials(name) : getInitials(fullPath);
  const iconPath = categoryIcons[category] || categoryIcons.electronics;

  const fontSize = Math.min(width, height) * 0.18;
  const iconSize = Math.min(width, height) * 0.2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.from};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.to};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.1);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)" rx="0"/>
  <rect width="${width}" height="${height}" fill="url(#overlay)" rx="0"/>
  <circle cx="${width * 0.8}" cy="${height * 0.2}" r="${Math.min(width, height) * 0.15}" fill="rgba(255,255,255,0.08)"/>
  <circle cx="${width * 0.2}" cy="${height * 0.8}" r="${Math.min(width, height) * 0.2}" fill="rgba(255,255,255,0.05)"/>
  <g transform="translate(${width / 2 - iconSize / 2}, ${height / 2 - iconSize * 0.8})" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="${iconPath}" />
  </g>
  <text x="${width / 2}" y="${height / 2 + fontSize * 0.6}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700" fill="rgba(255,255,255,0.9)">${initials}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
