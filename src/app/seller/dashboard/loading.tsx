export default function SellerDashboardLoading() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-border/40 flex-col p-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 pb-4 border-b border-border/30">
          <div className="w-8 h-8 rounded-lg skeleton-emerald" />
          <div className="w-20 h-5 rounded skeleton-emerald" />
        </div>
        {/* Nav items */}
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <div className="w-5 h-5 rounded skeleton-emerald" />
            <div className="w-24 h-4 rounded skeleton-emerald" />
          </div>
        ))}
        {/* Bottom user */}
        <div className="mt-auto flex items-center gap-3 px-2 pt-4 border-t border-border/30">
          <div className="w-9 h-9 rounded-full skeleton-emerald" />
          <div className="space-y-1.5 flex-1">
            <div className="w-20 h-3.5 rounded skeleton-emerald" />
            <div className="w-14 h-3 rounded skeleton-emerald" />
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="w-40 h-6 rounded skeleton-emerald" />
            <div className="w-56 h-3.5 rounded skeleton-emerald" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-28 h-9 rounded-lg skeleton-emerald" />
            <div className="w-9 h-9 rounded-lg skeleton-emerald lg:hidden" />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/40 p-4 space-y-3">
              <div className="w-8 h-8 rounded-lg skeleton-emerald" />
              <div className="w-20 h-3 rounded skeleton-emerald" />
              <div className="w-16 h-6 rounded skeleton-emerald" />
            </div>
          ))}
        </div>

        {/* Charts / content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main chart */}
          <div className="lg:col-span-2 rounded-xl border border-border/40 p-4 space-y-4">
            <div className="w-32 h-5 rounded skeleton-emerald" />
            <div className="w-full h-48 rounded-lg skeleton-emerald" />
          </div>
          {/* Side panel */}
          <div className="rounded-xl border border-border/40 p-4 space-y-3">
            <div className="w-24 h-5 rounded skeleton-emerald" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full skeleton-emerald" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-20 h-3 rounded skeleton-emerald" />
                  <div className="w-14 h-2.5 rounded skeleton-emerald" />
                </div>
                <div className="w-12 h-3 rounded skeleton-emerald" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders table */}
        <div className="rounded-xl border border-border/40 p-4 space-y-4">
          <div className="w-28 h-5 rounded skeleton-emerald" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-20 h-3 rounded skeleton-emerald" />
                <div className="w-28 h-3 rounded skeleton-emerald" />
                <div className="w-16 h-3 rounded skeleton-emerald" />
                <div className="w-14 h-3 rounded skeleton-emerald ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
