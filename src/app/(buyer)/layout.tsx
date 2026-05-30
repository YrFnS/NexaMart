'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const AppShell = dynamic(
  () => import('@/components/layout/app-shell').then(mod => ({ default: mod.AppShell })),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading NexaMart...</p>
        </div>
      </div>
    )
  }
);

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
