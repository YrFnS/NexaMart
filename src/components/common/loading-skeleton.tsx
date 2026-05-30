'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Shimmer wrapper class
const shimmerClass = 'animate-shimmer';

/**
 * ProductCardSkeleton - matches product card dimensions
 */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Image placeholder */}
      <div className="relative aspect-square">
        <Skeleton className={`absolute inset-0 rounded-none ${shimmerClass}`} />
      </div>
      {/* Content */}
      <div className="p-4 space-y-2.5">
        <Skeleton className={`h-3 w-2/3 ${shimmerClass}`} />
        <Skeleton className={`h-4 w-full ${shimmerClass}`} />
        <Skeleton className={`h-4 w-4/5 ${shimmerClass}`} />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className={`h-5 w-20 ${shimmerClass}`} />
          <Skeleton className={`h-4 w-16 ${shimmerClass}`} />
        </div>
        <div className="flex gap-2 pt-1">
          <Skeleton className={`h-8 flex-1 rounded-md ${shimmerClass}`} />
          <Skeleton className={`h-8 w-8 rounded-md ${shimmerClass}`} />
        </div>
      </div>
    </div>
  );
}

/**
 * ProductGridSkeleton - grid of product card skeletons
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * OrderListSkeleton - order items skeleton
 */
export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className={`h-4 w-32 ${shimmerClass}`} />
            <Skeleton className={`h-5 w-20 rounded-full ${shimmerClass}`} />
          </div>
          <div className="flex gap-3">
            <Skeleton className={`size-14 rounded-md ${shimmerClass}`} />
            <div className="flex-1 space-y-2">
              <Skeleton className={`h-4 w-3/4 ${shimmerClass}`} />
              <Skeleton className={`h-3 w-1/2 ${shimmerClass}`} />
            </div>
            <Skeleton className={`h-5 w-16 ${shimmerClass}`} />
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className={`h-8 w-24 rounded-md ${shimmerClass}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * DashboardSkeleton - seller/admin dashboard skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <Skeleton className={`h-4 w-24 ${shimmerClass}`} />
            <Skeleton className={`h-7 w-20 ${shimmerClass}`} />
            <Skeleton className={`h-3 w-16 ${shimmerClass}`} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 space-y-3">
          <Skeleton className={`h-5 w-36 ${shimmerClass}`} />
          <Skeleton className={`h-48 w-full rounded-md ${shimmerClass}`} />
        </div>
        <div className="rounded-lg border p-4 space-y-3">
          <Skeleton className={`h-5 w-36 ${shimmerClass}`} />
          <Skeleton className={`h-48 w-full rounded-md ${shimmerClass}`} />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <Skeleton className={`h-5 w-32 ${shimmerClass}`} />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className={`size-9 rounded-full ${shimmerClass}`} />
              <div className="flex-1 space-y-2">
                <Skeleton className={`h-4 w-1/3 ${shimmerClass}`} />
                <Skeleton className={`h-3 w-1/4 ${shimmerClass}`} />
              </div>
              <Skeleton className={`h-5 w-16 rounded-full ${shimmerClass}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ChatSkeleton - chat messages skeleton
 */
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`flex gap-2 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          {i % 2 === 0 && (
            <Skeleton className={`size-8 rounded-full shrink-0 ${shimmerClass}`} />
          )}
          <div
            className={`max-w-[70%] space-y-1.5 ${
              i % 2 === 0 ? '' : 'items-end'
            }`}
          >
            <Skeleton
              className={`h-12 w-48 rounded-2xl ${
                i % 2 === 0 ? 'rounded-tl-sm' : 'rounded-tr-sm'
              } ${shimmerClass}`}
            />
          </div>
          {i % 2 !== 0 && (
            <Skeleton className={`size-8 rounded-full shrink-0 ${shimmerClass}`} />
          )}
        </div>
      ))}
      {/* Input bar */}
      <div className="flex gap-2 pt-4 border-t">
        <Skeleton className={`flex-1 h-10 rounded-xl ${shimmerClass}`} />
        <Skeleton className={`h-10 w-10 rounded-xl ${shimmerClass}`} />
      </div>
    </div>
  );
}

/**
 * TableSkeleton - data table skeleton
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={`h-4 flex-1 ${shimmerClass}`} />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-4 p-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton
                key={colIdx}
                className={`h-4 flex-1 ${shimmerClass}`}
                style={{ width: `${60 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ProfileSkeleton - user profile skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Skeleton className={`size-20 rounded-full ${shimmerClass}`} />
        <div className="space-y-2 flex-1">
          <Skeleton className={`h-6 w-40 ${shimmerClass}`} />
          <Skeleton className={`h-4 w-56 ${shimmerClass}`} />
          <div className="flex gap-2 pt-1">
            <Skeleton className={`h-5 w-20 rounded-full ${shimmerClass}`} />
            <Skeleton className={`h-5 w-16 rounded-full ${shimmerClass}`} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 text-center space-y-2">
            <Skeleton className={`h-6 w-12 mx-auto ${shimmerClass}`} />
            <Skeleton className={`h-3 w-16 mx-auto ${shimmerClass}`} />
          </div>
        ))}
      </div>

      {/* Info sections */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className={`h-5 w-32 mb-3 ${shimmerClass}`} />
            <div className="space-y-2">
              <Skeleton className={`h-4 w-full ${shimmerClass}`} />
              <Skeleton className={`h-4 w-3/4 ${shimmerClass}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
