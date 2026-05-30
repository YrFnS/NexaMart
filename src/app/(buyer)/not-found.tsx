import { Home } from 'lucide-react';
import Link from 'next/link';

export default function BuyerNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* 404 illustration */}
        <div className="relative mx-auto">
          <div className="text-8xl font-extrabold gradient-text-emerald select-none">
            404
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
          </p>
        </div>

        {/* Go Home button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
