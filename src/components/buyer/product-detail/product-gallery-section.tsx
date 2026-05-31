'use client';

import React from 'react';
import { ProductGallery } from '@/components/buyer/product-gallery';

interface ProductGallerySectionProps {
  images: string[];
  displayName: string;
  categoryName: string;
}

export function ProductGallerySection({ images, displayName, categoryName }: ProductGallerySectionProps) {
  return (
    <div className="zoom-lens-container rounded-xl shadow-lg shadow-emerald-500/5 border border-border/50">
      <ProductGallery images={images} productName={displayName} category={categoryName} />
    </div>
  );
}
