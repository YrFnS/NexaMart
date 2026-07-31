import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Visual search is unavailable until a real image-embedding provider and indexed catalog are configured.',
      errorAr:
        'البحث البصري غير متاح حتى يتم إعداد مزود حقيقي لتضمين الصور وفهرسة كتالوج المنتجات.',
      code: 'VISUAL_SEARCH_NOT_CONFIGURED',
      results: [],
      totalResults: 0,
    },
    { status: 501 },
  );
}
