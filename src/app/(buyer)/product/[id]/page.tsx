import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetailPage } from '@/components/buyer/product-detail-page';
import { APP_DESCRIPTION, APP_NAME, APP_URL } from '@/lib/config';
import {
  getProductDetailData,
  jsonLd,
  parseImageList,
} from '@/lib/storefront-data';

interface ProductRouteProps {
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
}: ProductRouteProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getProductDetailData(id);
  if (!data) {
    return {
      title: 'Product not found',
      description: APP_DESCRIPTION,
      robots: { index: false, follow: false },
    };
  }

  const { product } = data;
  const description =
    product.description?.trim() ||
    `View ${product.name} from ${product.store.name} on ${APP_NAME}.`;
  const images = parseImageList(product.images).slice(0, 4).map(absoluteUrl);
  const canonical = `/product/${product.id}`;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: product.name,
      description,
      images,
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      title: product.name,
      description,
      images,
    },
  };
}

export default async function ProductRoute({ params }: ProductRouteProps) {
  const { id } = await params;
  const initialData = await getProductDetailData(id);
  if (!initialData) notFound();

  const { product } = initialData;
  const images = parseImageList(product.images).map(absoluteUrl);
  const productUrl = `${APP_URL}/product/${product.id}`;
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: images,
    sku: product.sku || undefined,
    category: product.category.name,
    url: productUrl,
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'USD',
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: product.store.name,
        url: `${APP_URL}/store/${product.store.id}`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }}
      />
      <ProductDetailPage productId={product.id} initialData={initialData} />
    </>
  );
}
