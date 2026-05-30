export default function BuyerLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg skeleton-emerald" />
            <div className="w-24 h-5 rounded skeleton-emerald" />
          </div>
          {/* Nav links skeleton */}
          <div className="hidden md:flex items-center gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-16 h-4 rounded skeleton-emerald" />
            ))}
          </div>
          {/* Actions skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full skeleton-emerald" />
            <div className="w-9 h-9 rounded-full skeleton-emerald" />
            <div className="w-9 h-9 rounded-full skeleton-emerald" />
          </div>
        </div>
      </header>

      {/* Hero Skeleton */}
      <section className="w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="w-full h-56 md:h-72 rounded-2xl skeleton-emerald" />
        </div>
      </section>

      {/* Category Skeleton */}
      <section className="w-full">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-14 h-14 rounded-full skeleton-emerald" />
                <div className="w-12 h-3 rounded skeleton-emerald" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid Skeleton */}
      <section className="w-full flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Section title */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-36 h-6 rounded skeleton-emerald" />
            <div className="w-20 h-4 rounded skeleton-emerald" />
          </div>
          {/* Grid: 2 cols mobile, 3 md, 4 lg */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/40 overflow-hidden">
                {/* Image placeholder */}
                <div className="aspect-square skeleton-emerald" />
                {/* Content */}
                <div className="p-3 space-y-2.5">
                  <div className="w-3/4 h-4 rounded skeleton-emerald" />
                  <div className="w-1/2 h-3 rounded skeleton-emerald" />
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-5 rounded skeleton-emerald" />
                    <div className="w-8 h-8 rounded-full skeleton-emerald" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Skeleton */}
      <footer className="w-full border-t border-border/40 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="w-20 h-4 rounded skeleton-emerald" />
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="w-28 h-3 rounded skeleton-emerald" />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-8 pt-4 border-t border-border/30">
            <div className="w-48 h-3 rounded skeleton-emerald mx-auto" />
          </div>
        </div>
      </footer>
    </div>
  );
}
