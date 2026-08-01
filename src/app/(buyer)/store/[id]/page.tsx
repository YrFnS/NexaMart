import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StoreProfilePage } from '@/components/buyer/store-profile-page';
import { APP_DESCRIPTION, APP_NAME, APP_URL } from '@/lib/config';
import { getStorePageData, jsonLd } from '@/lib/storefront-data';

interface StoreRouteProps {
  params: Promise<{ id: string }>;
}

function absoluteUrl(value: string): string {
  try {
    return new URL(value, APP_URL).toString();
  } catch {
    return APP_URL;
  }
}

export async function generateMetadata({
  params,
}: StoreRouteProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getStorePageData(id);
  if (!data) {
    return {
      title: 'Store not found',
      description: APP_DESCRIPTION,
      robots: { index: false, follow: false },
    };
  }

  const { store } = data;
  const description =
    store.description?.trim() ||
    `Browse active products from ${store.name} on ${APP_NAME}.`;
  const images = [store.banner, store.logo]
    .filter((value): value is string => Boolean(value))
    .map(absoluteUrl);
  const canonical = `/store/${store.id}`;

  return {
    title: store.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: store.name,
      description,
      images,
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      title: store.name,
      description,
      images,
    },
  };
}

export default async function StoreRoute({ params }: StoreRouteProps) {
  const { id } = await params;
  const initialData = await getStorePageData(id);
  if (!initialData) notFound();

  const { store } = initialData;
  const storeUrl = `${APP_URL}/store/${store.id}`;
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    alternateName: store.nameAr || undefined,
    description: store.description || undefined,
    url: storeUrl,
    image: store.logo ? absoluteUrl(store.logo) : undefined,
    address: store.location || undefined,
    ...(store.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: store.rating,
            reviewCount: store.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(storeSchema) }}
      />
      <StoreProfilePage initialData={initialData} />
    </>
  );
}
