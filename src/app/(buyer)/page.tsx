import type { Metadata } from 'next';
import { HomeOnboarding } from '@/components/buyer/home-onboarding';
import { HomePage } from '@/components/buyer/home-page';
import { APP_DESCRIPTION, APP_NAME, APP_URL } from '@/lib/config';
import { getHomePageData, jsonLd } from '@/lib/storefront-data';

export const metadata: Metadata = {
  title: 'Marketplace home',
  description: APP_DESCRIPTION,
  alternates: { canonical: '/' },
};

export default async function Home() {
  const initialData = await getHomePageData();
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: APP_NAME,
    url: APP_URL,
    description: APP_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${APP_URL}/shop?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }}
      />
      <HomePage initialData={initialData} />
      <HomeOnboarding />
    </>
  );
}
