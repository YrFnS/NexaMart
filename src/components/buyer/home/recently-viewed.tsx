'use client';

import React from 'react';
import { RecentlyViewedSection } from '@/components/buyer/recently-viewed-section';
import { AnimatedSection } from './home-hooks';

export function RecentlyViewed() {
  return (
    <AnimatedSection>
      <section className="container mx-auto px-4 py-2">
        <RecentlyViewedSection />
      </section>
    </AnimatedSection>
  );
}
